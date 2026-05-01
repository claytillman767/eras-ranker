"""
Stage 2 of the per-category playback timestamps pipeline.

Reads src/data/syncedLyricsFull.json (built by fetch_synced_lyrics.py) and asks
the Claude API to pick the single best moment for several lyric-based rating /
bracket categories per song. Maps Claude's chosen line back to a millisecond
timestamp using the synced-lyrics data.

Lyric-based categories (Claude picks):
  - most-romantic
  - most-devastating
  - cry-factor
  - best-storytelling
  - best-lyrics

Structural categories (derived directly from section data, no Claude needed):
  - best-opening-line   = first synced line in the song
  - best-closing-line   = last synced line in the song
  - best-chorus / hook  = first [Chorus] section's startMs

Outputs:
  src/data/spotifyCategoryTimes.js   — flat ms lookup, imported by the app
  src/data/categoryTimesAudit.json   — Claude's reasoning + chosen lines (cache
                                       AND audit trail; committed to git)

Run from the project root:
    python find_category_times.py              # all songs
    python find_category_times.py --limit 3    # smoke-test first 3 songs
    python find_category_times.py --song ml_0  # single song

Requires:
    pip install python-dotenv         (auto-installed if missing)
    ANTHROPIC_API_KEY in .env

Cached responses in categoryTimesAudit.json are reused on re-runs — only songs
not in the cache get a fresh API call. Delete the cache file (or specific keys)
to re-roll choices.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ── Dependency bootstrap (mirrors fetch_lyrics.py) ───────────────────────────

def _require(pip_name, import_name=None):
    import importlib
    mod_name = import_name or pip_name
    try:
        return importlib.import_module(mod_name)
    except ImportError:
        print(f'Installing {pip_name}...')
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', pip_name])
        return importlib.import_module(mod_name)


dotenv = _require('python-dotenv', 'dotenv')
dotenv.load_dotenv()


# ── Config ───────────────────────────────────────────────────────────────────

MODEL = 'claude-haiku-4-5-20251001'
MAX_TOKENS = 1024
API_URL = 'https://api.anthropic.com/v1/messages'

LYRIC_CATEGORIES = [
    {
        'id':     'most-romantic',
        'prompt': 'The single most romantic / swoon-worthy line — the moment a listener would screenshot and send to someone they love.',
    },
    {
        'id':     'most-devastating',
        'prompt': 'The most heartbreaking / gut-punch line — the "pull over the car" moment of pure devastation.',
    },
    {
        'id':     'cry-factor',
        'prompt': 'The line most likely to actually make a listener tear up — pure emotional vulnerability or release. May overlap with most-devastating but pick the moment that hits hardest emotionally rather than just thematically.',
    },
    {
        'id':     'best-storytelling',
        'prompt': 'The most vivid narrative line — a specific image or scene that anchors the story Taylor is telling.',
    },
    {
        'id':     'best-lyrics',
        'prompt': 'The single most quotable, clever, or beautifully written line — the showpiece of the song from a craft perspective.',
    },
]

CATEGORY_IDS = [c['id'] for c in LYRIC_CATEGORIES]

SYSTEM_PROMPT = (
    "You are a Taylor Swift expert helping select the single best moment from each "
    "song for various rating and bracket categories in a music app. You'll see one "
    "song's lyrics, broken into sections with timestamps, and must pick — for each "
    "requested category — the one line that best captures that quality.\n\n"
    "Rules:\n"
    "1. Output ONLY a JSON object. No prose, no markdown fences, no commentary.\n"
    "2. The 'line' value MUST be copied EXACTLY from the lyrics shown — same words, "
    "same casing, same punctuation. Do not paraphrase or summarise.\n"
    "3. If a category genuinely doesn't apply (e.g., a song with no romantic content "
    "for 'most-romantic'), set 'line' to null.\n"
    "4. 'reasoning' is one short sentence explaining what makes the line definitive.\n"
    "5. You may pick lines from anywhere in the song — don't default to the bridge or "
    "chorus unless that truly is the best moment for the category.\n"
    "6. Different categories should usually pick different lines, but if the same line "
    "really is the best answer for two categories, that's allowed."
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def normalize(s):
    # Convert ALL whitespace (including exotic ones like   four-per-em space
    # that turn up in Genius lyrics) to ASCII space first, so the next step
    # doesn't strip them as non-alphanumeric.
    s = re.sub(r'\s+', ' ', (s or '').lower())
    return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9 ]", "", s)).strip()


def format_song_for_prompt(song_data):
    """Format the song's sections + lines for Claude. Includes ms timestamps where known."""
    parts = [
        f"Song: {song_data['song']}",
        f"Album: {song_data['album']}",
    ]
    duration = song_data.get('duration')
    if duration:
        m, s = divmod(duration // 1000, 60)
        parts.append(f"Duration: {m}:{s:02d}")
    parts.append('')

    for sec in song_data['sections']:
        ms = sec.get('startMs')
        if ms is not None:
            mins, secs = divmod(ms // 1000, 60)
            ts = f" ({mins}:{secs:02d})"
        else:
            ts = ' (no timestamp)'
        parts.append(f"[{sec['label']}]{ts}")
        for line in sec['lines']:
            parts.append(f"  {line['text']}")
        parts.append('')

    return '\n'.join(parts)


def build_user_prompt(song_text):
    cats_block = '\n'.join(f"  - {c['id']}: {c['prompt']}" for c in LYRIC_CATEGORIES)
    schema_keys = ',\n  '.join(f'"{cid}": {{"line": string|null, "reasoning": string}}' for cid in CATEGORY_IDS)
    schema = '{\n  ' + schema_keys + '\n}'
    return (
        f"{song_text}\n"
        f"Pick the best line for each category below.\n\n"
        f"Categories:\n{cats_block}\n\n"
        f"Output JSON matching this schema exactly:\n{schema}"
    )


def call_claude(api_key, system, user_msg, max_retries=4):
    headers = {
        'x-api-key':         api_key,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
    }
    body = {
        'model':      MODEL,
        'max_tokens': MAX_TOKENS,
        # Cache the system prompt — saves ~500 tokens × N songs of input cost.
        'system':     [{'type': 'text', 'text': system, 'cache_control': {'type': 'ephemeral'}}],
        'messages':   [{'role': 'user', 'content': user_msg}],
    }
    data = json.dumps(body).encode('utf-8')

    last_err = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(API_URL, data=data, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')
            last_err = f'HTTP {e.code}: {err_body[:200]}'
            if e.code in (429, 500, 502, 503, 504) and attempt < max_retries - 1:
                wait = (2 ** attempt) * 5
                print(f'    {last_err} — retrying in {wait}s')
                time.sleep(wait)
                continue
            raise RuntimeError(last_err) from e
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = str(e)
            if attempt < max_retries - 1:
                wait = (2 ** attempt) * 5
                print(f'    {last_err} — retrying in {wait}s')
                time.sleep(wait)
                continue
            raise


def parse_claude_json(text):
    text = (text or '').strip()
    # Strip markdown fences if Claude added them despite instructions
    if text.startswith('```'):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    # If there's leading/trailing prose, grab the outermost JSON object
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        text = m.group(0)
    return json.loads(text)


def find_line_ms(line_text, song_data):
    """
    Locate the chosen line in the song. Returns (ms, section_label, found, used_section_fallback).
      - ms is the line's own timestamp if synced, else the section's startMs.
      - found=False means Claude hallucinated a line not in the lyrics.
    """
    if not line_text:
        return None, None, False, False

    target_norm = normalize(line_text)

    # Pass 1: exact text match
    for sec in song_data['sections']:
        for line in sec['lines']:
            if line['text'] == line_text:
                if line['ms'] is not None:
                    return line['ms'], sec['label'], True, False
                if sec.get('startMs') is not None:
                    return sec['startMs'], sec['label'], True, True
                return None, sec['label'], True, True

    # Pass 2: normalized match (handles minor punctuation/casing differences)
    for sec in song_data['sections']:
        for line in sec['lines']:
            if normalize(line['text']) == target_norm:
                if line['ms'] is not None:
                    return line['ms'], sec['label'], True, False
                if sec.get('startMs') is not None:
                    return sec['startMs'], sec['label'], True, True
                return None, sec['label'], True, True

    # Pass 3: Claude line is a substring of a longer source line, or vice versa.
    # Require both sides to be at least 8 chars after normalization — otherwise
    # tiny stray lines like '&' or ']' (which normalize to '') match anything.
    MIN_LEN = 8
    if len(target_norm) < MIN_LEN:
        return None, None, False, False
    for sec in song_data['sections']:
        for line in sec['lines']:
            src_norm = normalize(line['text'])
            if len(src_norm) < MIN_LEN:
                continue
            if target_norm in src_norm or src_norm in target_norm:
                if line['ms'] is not None:
                    return line['ms'], sec['label'], True, False
                if sec.get('startMs') is not None:
                    return sec['startMs'], sec['label'], True, True
                return None, sec['label'], True, True

    return None, None, False, False


def derive_structural(song_data):
    """Returns dict of category_id -> ms (or None) using only section structure."""
    sections = song_data['sections']
    out = {}

    # Walk forward to find the first synced line
    for sec in sections:
        for line in sec['lines']:
            if line['ms'] is not None:
                out['best-opening-line'] = line['ms']
                break
        if 'best-opening-line' in out:
            break

    # Walk backward to find the last synced line
    for sec in reversed(sections):
        for line in reversed(sec['lines']):
            if line['ms'] is not None:
                out['best-closing-line'] = line['ms']
                break
        if 'best-closing-line' in out:
            break

    # First [Chorus] section's startMs serves both best-chorus and hook
    for sec in sections:
        if sec['label'].lower().startswith('chorus') and sec.get('startMs') is not None:
            out['best-chorus'] = sec['startMs']
            out['hook']        = sec['startMs']
            break

    return out


# ── Output writers ───────────────────────────────────────────────────────────

ALBUM_ORDER = ['tv', 'fe', 'st', 'rd', '89', 'rp', 'lv', 'fl', 'ev', 'ml', 'tp', 'ls']


def write_times_js(path, times, songs, scores):
    out = [
        '// Auto-generated by find_category_times.py — do not edit by hand.',
        '// Run `python find_category_times.py` from the project root to regenerate.',
        '// SPOTIFY_CATEGORY_TIMES — playback timestamps (ms) per song × category.',
        '// CATEGORY_FIT_SCORES   — 0–100 fitness rating per song × category, used',
        '// by the bracket builder to decide which songs are eligible for which bracket.',
        '',
        'export const SPOTIFY_CATEGORY_TIMES = {',
    ]

    by_album = {}
    for key in times:
        by_album.setdefault(key.split('_')[0], []).append(key)

    for album_id in ALBUM_ORDER:
        album_keys = by_album.get(album_id, [])
        if not album_keys:
            continue
        first = album_keys[0]
        album_name = songs.get(first, {}).get('album', album_id)
        out.append(f'  // {album_name}')
        for key in sorted(album_keys, key=lambda k: int(k.split('_')[1])):
            cat_times = times[key]
            song_name = songs.get(key, {}).get('song', '')
            items = ', '.join(
                f"'{cid}': {ms}"
                for cid, ms in cat_times.items()
                if ms is not None
            )
            if items:
                out.append(f"  '{key}': {{ {items} }},  // {song_name}")
            else:
                out.append(f"  // '{key}': no timestamps available — {song_name}")
        out.append('')

    out.append('};')
    out.append('')

    # ── CATEGORY_FIT_SCORES ──────────────────────────────────────────────
    out.append('export const CATEGORY_FIT_SCORES = {')
    for album_id in ALBUM_ORDER:
        album_keys = [k for k in scores if k.split('_')[0] == album_id]
        if not album_keys:
            continue
        first = album_keys[0]
        album_name = songs.get(first, {}).get('album', album_id)
        out.append(f'  // {album_name}')
        for key in sorted(album_keys, key=lambda k: int(k.split('_')[1])):
            cat_scores = scores[key]
            song_name = songs.get(key, {}).get('song', '')
            items = ', '.join(f"'{cid}': {sc}" for cid, sc in cat_scores.items())
            if items:
                out.append(f"  '{key}': {{ {items} }},  // {song_name}")
        out.append('')
    out.append('};')
    out.append('')

    # Helper exports for the app
    out.extend([
        '/**',
        ' * Get the playback start position (ms) for a given song + category.',
        ' * Returns null if no timestamp is available for that combination.',
        ' */',
        'export function getCategoryStartMs(albumId, songIndex, categoryId) {',
        '  const song = SPOTIFY_CATEGORY_TIMES[`${albumId}_${songIndex}`];',
        '  return song?.[categoryId] ?? null;',
        '}',
        '',
        '/**',
        ' * Get the 0–100 fitness score for a given song + category.',
        ' * Used by the bracket builder to filter eligible songs.',
        ' * Returns 0 if no score is available.',
        ' */',
        'export function getCategoryFitScore(albumId, songIndex, categoryId) {',
        '  const song = CATEGORY_FIT_SCORES[`${albumId}_${songIndex}`];',
        '  return song?.[categoryId] ?? 0;',
        '}',
        '',
    ])

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    parser.add_argument('--limit', type=int, default=None,
                        help='Process only the first N songs (smoke test)')
    parser.add_argument('--song', type=str, default=None,
                        help='Process only one song key (e.g. ml_0)')
    parser.add_argument('--no-cache', action='store_true',
                        help='Ignore cached responses and re-call API for every song')
    parser.add_argument('--summary', action='store_true',
                        help='Print audit coverage summary and exit (no processing)')
    args = parser.parse_args()

    # API key is OPTIONAL. Without it, the script works in resolve-only mode:
    # uses whatever picks are already in the audit JSON, regenerates timestamps
    # and JS output. Songs without cached picks are skipped (and listed at the end).
    api_key = os.environ.get('ANTHROPIC_API_KEY')

    script_dir  = Path(__file__).parent
    synced_path = script_dir / 'src' / 'data' / 'syncedLyricsFull.json'
    audit_path  = script_dir / 'src' / 'data' / 'categoryTimesAudit.json'
    out_js_path = script_dir / 'src' / 'data' / 'spotifyCategoryTimes.js'

    if not synced_path.exists():
        print(f'ERROR: {synced_path} not found. Run fetch_synced_lyrics.py first.')
        sys.exit(1)

    print(f'Loading {synced_path}...')
    with open(synced_path, encoding='utf-8') as f:
        songs = json.load(f)

    # Load existing audit/cache
    audit = {}
    if audit_path.exists() and not args.no_cache:
        with open(audit_path, encoding='utf-8') as f:
            audit = json.load(f)
        print(f'Loaded {len(audit)} cached responses from {audit_path.name}')

    # --summary mode: report coverage and exit
    if args.summary:
        cached = [k for k in songs if k in audit and 'picks' in audit[k]]
        missing = [k for k in songs if k not in audit or 'picks' not in audit.get(k, {})]
        rejected = []
        overridden = []
        for k in cached:
            for cid, p in audit[k]['picks'].items():
                if p.get('rejected'):
                    rejected.append((k, cid))
                if p.get('manualLine'):
                    overridden.append((k, cid))
        print(f'\n── Audit coverage ──────────────────────────────────────')
        print(f'  Songs in synced lyrics : {len(songs)}')
        print(f'  Songs with picks       : {len(cached)}')
        print(f'  Songs missing picks    : {len(missing)}')
        print(f'  Rejected picks         : {len(rejected)}')
        print(f'  Manually overridden    : {len(overridden)}')
        if missing and len(missing) <= 30:
            print(f'\n  Missing songs:')
            for k in missing:
                print(f'    {k}  {songs[k]["song"]}')
        elif missing:
            print(f'\n  First 10 missing songs:')
            for k in missing[:10]:
                print(f'    {k}  {songs[k]["song"]}')
            print(f'    ... and {len(missing) - 10} more')
        return

    # Choose keys to process
    keys = sorted(songs.keys(), key=lambda k: (ALBUM_ORDER.index(k.split('_')[0]) if k.split('_')[0] in ALBUM_ORDER else 99,
                                                int(k.split('_')[1])))
    if args.song:
        if args.song not in songs:
            print(f'ERROR: song key {args.song} not found in synced lyrics.')
            sys.exit(1)
        keys = [args.song]
    elif args.limit:
        keys = keys[:args.limit]

    if not api_key:
        print('Note: ANTHROPIC_API_KEY not set — running in resolve-only mode.')
        print('Songs without cached picks will be skipped.\n')

    print(f'Processing {len(keys)} song(s)...\n')

    times = {}
    scores = {}
    skipped_no_api = []
    new_calls = 0
    cache_hits = 0
    hallucinations = []

    for i, key in enumerate(keys):
        song = songs[key]
        print(f'[{i+1}/{len(keys)}] {key}  {song["song"]}')

        # Lyric-based picks via Claude (cached)
        cached = audit.get(key)
        if cached and 'picks' in cached and not args.no_cache:
            picks = cached['picks']
            cache_hits += 1
            print('  (cached)')
        elif not api_key:
            print('  (skipped — no cached picks and no API key)')
            skipped_no_api.append(key)
            # Still derive structural categories so this song gets *some* output
            song_times = {}
            for cid, ms in derive_structural(song).items():
                song_times[cid] = ms
            if song_times:
                times[key] = song_times
            continue
        else:
            song_text = format_song_for_prompt(song)
            user_msg  = build_user_prompt(song_text)
            try:
                resp = call_claude(api_key, SYSTEM_PROMPT, user_msg)
            except Exception as e:
                print(f'  ✗ API error: {e}')
                continue

            try:
                text  = resp['content'][0]['text']
                picks = parse_claude_json(text)
            except Exception as e:
                print(f'  ✗ Parse error: {e}')
                print(f'    Raw response: {resp}')
                continue

            audit[key] = {'song': song['song'], 'album': song['album'], 'picks': picks, 'resolved': {}}
            new_calls += 1

            # Persist cache after EVERY successful call so an interrupt loses at most one song
            with open(audit_path, 'w', encoding='utf-8') as f:
                json.dump(audit, f, ensure_ascii=False, indent=2)

            time.sleep(0.4)  # be polite

        # Resolve each Claude pick to a timestamp.
        # Honors three developer-review fields the audit UI sets:
        #   rejected: true     — output null for this category (excluded from brackets)
        #   manualLine: "..."  — use this hand-picked line instead of the auto-pick
        #   score: 0..100      — propagated to CATEGORY_FIT_SCORES export
        song_times = {}
        song_scores = {}
        resolved = {}
        for cat in LYRIC_CATEGORIES:
            cid = cat['id']
            pick = picks.get(cid) or {}
            if not isinstance(pick, dict):
                pick = {}

            rejected     = bool(pick.get('rejected'))
            manual_line  = pick.get('manualLine')
            auto_line    = pick.get('line')
            effective    = manual_line if manual_line else auto_line
            score        = int(pick.get('score') or 0)

            if rejected:
                ms, section_label, found, used_fallback = None, None, False, False
            else:
                ms, section_label, found, used_fallback = find_line_ms(effective, song)

            song_times[cid] = ms
            song_scores[cid] = score
            resolved[cid] = {
                'ms':                  ms,
                'section':             section_label,
                'found_in_lyrics':     found,
                'used_section_start':  used_fallback,
                'used_manual_line':    bool(manual_line),
                'rejected':            rejected,
            }

            if effective and not rejected and not found:
                hallucinations.append((key, cid, effective))

            if rejected:
                mark = 'REJ'
                ts = '—'
            elif ms is not None:
                mark = '!' if used_fallback else ('M' if manual_line else 'OK')
                ts = f'{ms // 1000}s'
            elif found:
                mark = '?'
                ts = '—'
            elif effective:
                mark = 'X'
                ts = '—'
            else:
                mark = '-'
                ts = '—'
            preview = (effective or '(none)')[:55]
            print(f'  [{mark:>3}] {cid:18}  {score:>3}  {ts:>6}  {preview}')

        audit[key]['resolved'] = resolved

        # Structural categories — always derived from section data, never developer-rejected
        for cid, ms in derive_structural(song).items():
            song_times[cid] = ms

        times[key] = song_times
        scores[key] = song_scores

    # Persist final audit
    with open(audit_path, 'w', encoding='utf-8') as f:
        json.dump(audit, f, ensure_ascii=False, indent=2)

    # Write JS output (only for the songs we processed)
    write_times_js(out_js_path, times, songs, scores)

    # Summary
    print(f'\n── Results ──────────────────────────────────────────────')
    print(f'  Songs in JS output  : {len(times)} (lyric picks + structural categories)')
    print(f'  New API calls       : {new_calls}')
    print(f'  Cache hits          : {cache_hits}')
    if skipped_no_api:
        print(f'  Skipped (no picks)  : {len(skipped_no_api)} (got structural categories only)')
    if hallucinations:
        print(f'  Hallucinated lines  : {len(hallucinations)} (fell back to None)')
        for key, cid, line in hallucinations[:10]:
            print(f'    {key} {cid}: {line[:60]!r}')
        if len(hallucinations) > 10:
            print(f'    ... and {len(hallucinations) - 10} more')

    print(f'\nWrote {audit_path}')
    print(f'Wrote {out_js_path}')


if __name__ == '__main__':
    main()
