"""
Stage 1 of the per-category playback timestamps pipeline.

Builds a master file of FULL synced lyrics for every Taylor Swift song:
  - Each song's lyrics broken into sections ([Verse 1], [Chorus], [Bridge], etc.)
  - Each section has a startMs timestamp
  - Each line within a section has its own ms timestamp (where lrclib provides one)

Approach:
  1. Re-parses taylor_swift_lyrics.txt to get the ordered sections + lines per song
     (extends the parse_bridges.py / parse_snippets.py logic to keep ALL sections).
  2. For each song, queries lrclib.net for synchronized lyrics (LRC format).
  3. Greedy pointer-based alignment: walks source-text lines and LRC lines together,
     matching by token similarity, to attach a timestamp to each source line.
  4. Outputs src/data/syncedLyricsFull.json — consumed by Stage 2 (the Claude API
     script that picks the best moment per category).

Run from the project root:
    python fetch_synced_lyrics.py

Requirements: Python 3.7+, no extra packages needed.
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

# Force UTF-8 stdout so the Unicode status glyphs (✓ ✗ ⚠) don't crash on Windows cp1252.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ── Album / song metadata (mirrors find_bridge_times.py) ─────────────────────

ALBUM_MAP = [
    ('Taylor Swift',                    'tv'),
    ('Fearless',                        'fe'),
    ('Speak Now',                       'st'),
    ('Red',                             'rd'),
    ('1989',                            '89'),
    ('Reputation',                      'rp'),
    ('Lover',                           'lv'),
    ('Folklore',                        'fl'),
    ('Evermore',                        'ev'),
    ('Midnights',                       'ml'),
    ('The Tortured Poets Department',   'tp'),
    ('The Life of a Showgirl',          'ls'),
]

ALBUM_DISPLAY = {
    'tv': 'Taylor Swift',
    'fe': "Fearless (Taylor's Version)",
    'st': "Speak Now (Taylor's Version)",
    'rd': "Red (Taylor's Version)",
    '89': "1989 (Taylor's Version)",
    'rp': 'Reputation',
    'lv': 'Lover',
    'fl': 'Folklore',
    'ev': 'Evermore',
    'ml': 'Midnights',
    'tp': 'The Tortured Poets Department',
    'ls': 'The Life of a Showgirl',
}

ALBUM_PATTERNS = [
    (re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE), aid)
    for name, aid in ALBUM_MAP
]

SONGS = {
    'tv': [
        'Tim McGraw', 'Picture to Burn', 'Teardrops on My Guitar', 'Stay Beautiful',
        "Should've Said No", 'Cold as You', 'The Outside', 'Tied Together with a Smile',
        "Mary's Song (Oh My My My)", 'Our Song',
    ],
    'fe': [
        'Fearless', 'Fifteen', 'Love Story', 'Hey Stephen', 'White Horse',
        'You Belong with Me', 'Breathe', 'Tell Me Why', "You're Not Sorry",
        'The Way I Loved You', 'Forever & Always', 'The Best Day', 'Change',
    ],
    'st': [
        'Mine', 'Sparks Fly', 'Back to December', 'Speak Now', 'Dear John',
        'Mean', 'The Story of Us', 'Never Grow Up', 'Enchanted',
        'Better than Revenge', 'Innocent', 'Haunted', 'Last Kiss', 'Long Live',
    ],
    'rd': [
        'State of Grace', 'Red', 'Treacherous', 'I Knew You Were Trouble',
        'All Too Well', '22', 'I Almost Do', 'We Are Never Getting Back Together',
        'Stay Stay Stay', 'The Last Time', 'Holy Ground', 'Sad Beautiful Tragic',
        'The Lucky One', 'Everything Has Changed', 'Starlight', 'Begin Again',
    ],
    '89': [
        'Welcome to New York', 'Blank Space', 'Style', 'Out of the Woods',
        'All You Had to Do Was Stay', 'Shake It Off', 'I Wish You Would',
        'Bad Blood', 'Wildest Dreams', 'How You Get the Girl', 'Clean',
        'Wonderland', 'You Are in Love', 'New Romantics',
    ],
    'rp': [
        '...Ready for It?', 'End Game', 'I Did Something Bad', "Don't Blame Me",
        'Delicate', 'Look What You Made Me Do', 'So It Goes...', 'Gorgeous',
        'Getaway Car', 'King of My Heart', 'Dancing with Our Hands Tied',
        'Dress', "This Is Why We Can't Have Nice Things", 'Call It What You Want',
        "New Year's Day",
    ],
    'lv': [
        'I Forgot That You Existed', 'Cruel Summer', 'Lover', 'The Man',
        'The Archer', 'I Think He Knows', 'Miss Americana & the Heartbreak Prince',
        'Paper Rings', 'Cornelia Street', 'Death by a Thousand Cuts',
        'London Boy', "Soon You'll Get Better", 'False God', 'You Need to Calm Down',
        'Afterglow', 'Me!', "It's Nice to Have a Friend", 'Daylight',
    ],
    'fl': [
        'the 1', 'cardigan', 'the last great american dynasty', 'exile',
        'my tears ricochet', 'mirrorball', 'seven', 'august',
        'this is me trying', 'illicit affairs', 'invisible string',
        'mad woman', 'epiphany', 'betty', 'peace', 'hoax',
    ],
    'ev': [
        'willow', 'champagne problems', 'gold rush', "'tis the damn season",
        'tolerate it', 'no body no crime', 'happiness', 'dorothea',
        'coney island', 'ivy', 'cowboy like me', 'long story short',
        'marjorie', 'closure', 'evermore',
    ],
    'ml': [
        'Lavender Haze', 'Maroon', 'Anti-Hero', 'Snow on the Beach',
        'Midnight Rain', 'Question...?', 'Vigilante Shit', 'Bejeweled',
        'Labyrinth', 'Karma', 'Sweet Nothing', 'Mastermind',
        'The Great War', 'Bigger Than the Whole Sky', 'Paris',
        'High Infidelity', 'Glitch', "Would've, Could've, Should've", 'Dear Reader',
    ],
    'tp': [
        'Fortnight (feat. Post Malone)', 'The Tortured Poets Department',
        'My Boy Only Breaks His Favorite Toys',
        'Down Bad', 'So Long, London', 'But Daddy I Love Him', 'Fresh Out the Slammer',
        'Florida!!! (feat. Florence and the Machine)', 'Guilty as Sin?',
        "Who's Afraid of Little Old Me?", 'I Can Fix Him (No Really I Can)',
        'loml', 'I Can Do It With a Broken Heart',
        'The Smallest Man Who Ever Lived', 'The Alchemy', 'Clara Bow',
        'The Black Dog', 'imgonnagetyouback', 'The Albatross',
        'Chloe or Sam or Sophia or Marcus', 'How Did It End?', 'So High School',
        'I Hate It Here', 'thanK you aIMee', "I Look in People's Windows",
        'The Prophecy', 'Cassandra', 'Peter', 'The Bolter', 'Robin', 'The Manuscript',
    ],
    'ls': [
        'The Fate of Ophelia', 'Elizabeth Taylor', 'Opalite', 'Father Figure',
        'Eldest Daughter', 'Ruin the Friendship', 'Actually Romantic', 'WI$SHLI$T',
        'Wood', 'CANCELLED!', 'Honey',
        'The Life of a Showgirl (feat. Sabrina Carpenter)',
    ],
}

ALBUM_ORDER = ['tv', 'fe', 'st', 'rd', '89', 'rp', 'lv', 'fl', 'ev', 'ml', 'tp', 'ls']


# ── Text helpers ──────────────────────────────────────────────────────────────

def normalize(s):
    """Lowercase, strip punctuation, collapse whitespace."""
    return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9 ]", "", s.lower())).strip()


def clean_song_name(name):
    """Strip suffixes that confuse search queries."""
    name = re.sub(r'\s*\(feat\..*?\)', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*\(From The Vault\)', '', name, flags=re.IGNORECASE)
    name = re.sub(r"\s*\(Taylor's Version\)", '', name, flags=re.IGNORECASE)
    return name.strip()


def token_similarity(a, b):
    """Fraction of tokens in a that also appear in b."""
    a_words = set(normalize(a).split())
    b_words = set(normalize(b).split())
    if not a_words:
        return 0.0
    return len(a_words & b_words) / len(a_words)


def album_id_for_header(line):
    matches = []
    for pattern, aid in ALBUM_PATTERNS:
        if pattern.search(line):
            matches.append((aid, len(pattern.pattern)))
    if not matches:
        return None
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches[0][0]


def match_song(title, album_id):
    songs = SONGS.get(album_id, [])
    norm = normalize(title)
    for i, s in enumerate(songs):
        if normalize(s) == norm:
            return i
    for i, s in enumerate(songs):
        ns = normalize(s)
        if ns in norm or norm in ns:
            return i
    return -1


# ── Source-text parser: keep ALL sections in order ───────────────────────────

# Whitelist of song-structure section labels. Anything else inside [brackets] in
# the source file (like [Radio DJ], [Tim McGraw], [Taylor Swift]) is a speaker
# tag from an interview transcript and must be skipped — those polluted Tim McGraw
# with 29 fake "sections" of dialogue and dropped its alignment to 3%.
MUSICAL_SECTION_RE = re.compile(
    r'^\s*('
    r'verse|chorus|pre[\s-]?chorus|post[\s-]?chorus|bridge|refrain|hook|'
    r'intro|outro|interlude|breakdown|buildup|build[\s-]?up|drop|tag|coda|'
    r'spoken|ad[\s-]?lib|vamp|reprise|'
    r'(fiddle|guitar|piano|drum|drums|sax|saxophone|violin|cello)\s+solo|'
    r'instrumental|solo'
    r')\b',
    re.IGNORECASE,
)


def is_musical_section(label):
    return bool(MUSICAL_SECTION_RE.match(label))


def parse_all_sections(path):
    """
    Return { albumId: { songIndex: [ (label, [line, line, ...]), ... ] } }.

    Sections are kept in the order they appear in the source file. Empty lines
    inside a section are dropped, but section order is preserved exactly so the
    LRC alignment can walk both lists in lockstep.
    """
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()

    result = {}
    current_album = None
    current_song_index = -1
    sections = []
    current_label = None
    current_lines = []
    DIVIDER = '═'

    def flush_section():
        nonlocal current_label, current_lines
        if current_label is not None:
            cleaned = [l.rstrip('\n').strip() for l in current_lines]
            cleaned = [l for l in cleaned if l]
            if cleaned:
                sections.append((current_label, cleaned))
        current_label = None
        current_lines = []

    def flush_song():
        nonlocal sections
        flush_section()
        if sections and current_album and current_song_index >= 0:
            result.setdefault(current_album, {})[current_song_index] = list(sections)
        sections = []

    i = 0
    while i < len(lines):
        stripped = lines[i].strip()

        # Album divider
        if stripped and all(c == DIVIDER for c in stripped):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                aid = album_id_for_header(lines[j].strip())
                if aid and aid != current_album:
                    flush_song()
                    current_album = aid
                    current_song_index = -1
            i += 1
            continue

        # Song header: ### Title
        if stripped.startswith('### '):
            flush_song()
            title = stripped[4:].strip()
            current_song_index = match_song(title, current_album) if current_album else -1
            i += 1
            continue

        # Section label: [Verse 1], [Chorus], [Bridge], etc.
        # Speaker tags from interview transcripts ([Radio DJ], [Tim McGraw], etc.)
        # are NOT musical sections — set current_label to None to ignore their lines.
        # Some Genius pages split long labels across multiple lines, e.g.:
        #   [Bridge: Justin Vernon,
        #   Taylor Swift
        #   ]
        # — accumulate forward until we find the closing bracket.
        if stripped.startswith('['):
            if ']' in stripped:
                close_idx = i
                full_label = stripped
            else:
                close_idx = None
                buf = [stripped]
                for j in range(i + 1, min(i + 8, len(lines))):
                    nxt = lines[j].strip()
                    buf.append(nxt)
                    if ']' in nxt:
                        close_idx = j
                        full_label = ' '.join(buf)
                        break
            if close_idx is not None:
                flush_section()
                label = full_label[full_label.index('[') + 1: full_label.rindex(']')].strip()
                # Collapse internal whitespace introduced by the line joins
                label = re.sub(r'\s+', ' ', label)
                current_label = label if is_musical_section(label) else None
                i = close_idx + 1
                continue

        # Content line
        if current_label is not None and current_song_index >= 0:
            current_lines.append(lines[i])

        i += 1

    flush_song()
    return result


# ── lrclib.net API ────────────────────────────────────────────────────────────

def fetch_lrclib(song_name, album_name, artist='Taylor Swift'):
    """
    Query lrclib.net for synchronized lyrics. Returns the full response dict
    (keys include syncedLyrics, plainLyrics, duration in seconds) or None.
    lrclib is free and requires no API key.
    """
    clean = clean_song_name(song_name)
    params = urllib.parse.urlencode({
        'artist_name': artist,
        'track_name':  clean,
        'album_name':  album_name,
    })
    url = f'https://lrclib.net/api/get?{params}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'ErasRanker/1.0 (synced-lyrics-fetcher)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f'    HTTP {e.code}')
    except Exception as e:
        print(f'    Error: {e}')
    return None


def parse_lrc(synced_lyrics):
    """Parse LRC text into a list of (ms, line_text) tuples."""
    out = []
    if not synced_lyrics:
        return out
    for line in synced_lyrics.split('\n'):
        m = re.match(r'\[(\d+):(\d+(?:\.\d+)?)\](.*)', line)
        if m:
            ms = int((int(m.group(1)) * 60 + float(m.group(2))) * 1000)
            text = m.group(3).strip()
            if text:
                out.append((ms, text))
    return out


# ── Section ⟷ LRC alignment ──────────────────────────────────────────────────

def align_sections_to_lrc(sections, lrc_lines, min_score=0.4, search_window=12):
    """
    Greedy pointer-based alignment.

    Walks the source-text sections in order. For each source line, scans the
    next `search_window` LRC lines for the best token-similarity match. If a
    match scores above `min_score`, the LRC timestamp is attached to that
    source line and the LRC pointer advances past it.

    Returns: [{ label, startMs, endMs, lines: [{ ms, text }, ...] }, ...]
    `startMs` / `endMs` are derived from the synced lines inside each section;
    they may be None if no line in that section matched the LRC.
    """
    aligned = []
    lrc_idx = 0
    n_lrc = len(lrc_lines)

    for label, source_lines in sections:
        section_lines = []
        for source_line in source_lines:
            best_idx = None
            best_score = min_score
            window_end = min(lrc_idx + search_window, n_lrc)

            for j in range(lrc_idx, window_end):
                ms, lrc_text = lrc_lines[j]
                # Exact normalized match always wins (handles short lines)
                if normalize(source_line) == normalize(lrc_text):
                    best_idx = j
                    best_score = 1.0
                    break
                score = token_similarity(source_line, lrc_text)
                if score > best_score:
                    best_score = score
                    best_idx = j

            if best_idx is not None:
                section_lines.append({'ms': lrc_lines[best_idx][0], 'text': source_line})
                lrc_idx = best_idx + 1
            else:
                section_lines.append({'ms': None, 'text': source_line})

        synced = [l['ms'] for l in section_lines if l['ms'] is not None]
        aligned.append({
            'label':   label,
            'startMs': synced[0] if synced else None,
            'endMs':   synced[-1] if synced else None,
            'lines':   section_lines,
        })

    # Backfill endMs of each section using the next section's startMs (better
    # boundary when the last line of a section didn't get synced).
    for i, sec in enumerate(aligned):
        for nxt in aligned[i + 1:]:
            if nxt['startMs'] is not None:
                if sec['endMs'] is None or nxt['startMs'] > sec['endMs']:
                    sec['endMs'] = nxt['startMs']
                break

    return aligned


def section_stats(aligned_sections):
    """Returns (synced_lines, total_lines) across all sections."""
    synced = total = 0
    for sec in aligned_sections:
        for l in sec['lines']:
            total += 1
            if l['ms'] is not None:
                synced += 1
    return synced, total


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir  = os.path.dirname(os.path.abspath(__file__))
    lyrics_path = os.path.join(script_dir, 'taylor_swift_lyrics.txt')
    out_path    = os.path.join(script_dir, 'src', 'data', 'syncedLyricsFull.json')

    print(f'Parsing source sections from {lyrics_path} ...')
    parsed = parse_all_sections(lyrics_path)
    total_songs = sum(len(v) for v in parsed.values())
    print(f'Parsed {total_songs} songs from source text. Querying lrclib.net...\n')

    output = {}        # { "albumId_songIndex": { song, albumId, ... } }
    no_lrc = []        # songs with no synced lyrics on lrclib
    poor   = []        # songs where alignment matched < 50% of lines

    for album_id in ALBUM_ORDER:
        album_songs = parsed.get(album_id, {})
        if not album_songs:
            continue
        album_display = ALBUM_DISPLAY[album_id]

        for song_idx in sorted(album_songs.keys()):
            song_name = SONGS[album_id][song_idx]
            sections  = album_songs[song_idx]
            key       = f'{album_id}_{song_idx}'

            print(f'  [{key}] {song_name}')

            data = fetch_lrclib(song_name, album_display)
            if data is None and "Taylor's Version" in album_display:
                base = re.sub(r"\s*\(Taylor's Version\)", '', album_display).strip()
                data = fetch_lrclib(song_name, base)

            if data is None or not data.get('syncedLyrics'):
                print(f'    ✗ No synced lyrics on lrclib')
                no_lrc.append(key)
                # Still record the unsynced lyrics so Stage 2 can fall back to plain text
                output[key] = {
                    'song':     song_name,
                    'albumId':  album_id,
                    'album':    album_display,
                    'duration': None,
                    'synced':   False,
                    'sections': [
                        {
                            'label':   label,
                            'startMs': None,
                            'endMs':   None,
                            'lines':   [{'ms': None, 'text': l} for l in lines],
                        }
                        for label, lines in sections
                    ],
                }
                time.sleep(0.3)
                continue

            lrc_lines = parse_lrc(data['syncedLyrics'])
            aligned   = align_sections_to_lrc(sections, lrc_lines)
            synced_n, total_n = section_stats(aligned)
            ratio = synced_n / total_n if total_n else 0

            duration_s = data.get('duration')
            duration_ms = int(duration_s * 1000) if duration_s else None

            output[key] = {
                'song':     song_name,
                'albumId':  album_id,
                'album':    album_display,
                'duration': duration_ms,
                'synced':   True,
                'sections': aligned,
            }

            mark = '✓' if ratio >= 0.5 else '⚠'
            print(f'    {mark} {synced_n}/{total_n} lines aligned ({ratio:.0%})'
                  + (f', duration {duration_ms // 1000}s' if duration_ms else ''))
            if ratio < 0.5:
                poor.append((key, song_name, ratio))

            time.sleep(0.3)

    # Write JSON
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Summary
    print(f'\n── Results ──────────────────────────────────────────────')
    print(f'  Songs total       : {len(output)}')
    print(f'  Fully synced      : {len(output) - len(no_lrc)}')
    print(f'  No LRC available  : {len(no_lrc)}')
    print(f'  Poor alignment    : {len(poor)}  (<50% lines matched)')

    if no_lrc:
        print('\n  Songs with no LRC on lrclib:')
        for k in no_lrc:
            aid, idx = k.split('_')
            print(f'    {k}  {SONGS[aid][int(idx)]}')

    if poor:
        print('\n  Songs with poor alignment (review before relying on these):')
        for k, name, ratio in poor:
            print(f'    {k}  {name}  ({ratio:.0%})')

    print(f'\nWrote {out_path}')


if __name__ == '__main__':
    main()
