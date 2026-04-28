"""
Finds Spotify playback timestamps for bridge sections in every Taylor Swift song.

Approach:
  1. Re-parses taylor_swift_lyrics.txt to get the bridge text per song
     (same logic as parse_bridges.py).
  2. For each song that has a bridge, queries lrclib.net for synchronized
     lyrics (LRC format with per-line timestamps). No API key required.
  3. Fuzzy-matches the first line of the bridge text against the LRC lines
     to find where the bridge starts.
  4. Outputs src/data/spotifyBridgeTimes.js with the results.

Run from the project root:
    python find_bridge_times.py

Requirements: Python 3.7+, no extra packages needed.
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request

# ── Album / song metadata (mirrors parse_bridges.py) ─────────────────────────

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

# Human-readable album names used in lrclib.net queries.
# Using Taylor's Version titles where applicable since those are the
# canonical releases lrclib is most likely to have synced lyrics for.
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


# ── Bridge lyrics parser (adapted from parse_bridges.py) ─────────────────────

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


def parse_bridges(path):
    """Return { albumId: { songIndex: bridge_text } }."""
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()

    result = {}
    current_album = None
    current_song_index = -1
    in_bridge = False
    bridge_lines = []
    bridge_collected = False
    DIVIDER = '\u2550'

    def flush():
        nonlocal bridge_lines, in_bridge
        if bridge_lines and current_album and current_song_index >= 0:
            text = '\n'.join(l.rstrip('\n') for l in bridge_lines).strip()
            if text:
                result.setdefault(current_album, {})[current_song_index] = text
        bridge_lines.clear()
        in_bridge = False

    i = 0
    while i < len(lines):
        stripped = lines[i].strip()

        if stripped and all(c == DIVIDER for c in stripped):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                aid = album_id_for_header(lines[j].strip())
                if aid and aid != current_album:
                    flush()
                    current_album = aid
                    current_song_index = -1
                    bridge_collected = False
            i += 1
            continue

        if stripped.startswith('### '):
            flush()
            title = stripped[4:].strip()
            current_song_index = match_song(title, current_album) if current_album else -1
            bridge_collected = False
            i += 1
            continue

        if stripped.startswith('[') and ']' in stripped:
            section = stripped[stripped.index('[') + 1: stripped.rindex(']')].strip()
            if in_bridge:
                flush()
            if section.lower().startswith('bridge') and not bridge_collected:
                in_bridge = True
                bridge_collected = True
            else:
                in_bridge = False
            i += 1
            continue

        if in_bridge:
            bridge_lines.append(lines[i])
        i += 1

    flush()
    return result


# ── lrclib.net API ────────────────────────────────────────────────────────────

def fetch_synced_lyrics(song_name, album_name, artist='Taylor Swift'):
    """
    Query lrclib.net for synchronized lyrics.
    Returns the syncedLyrics string (LRC format) or None if not found.
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
        req = urllib.request.Request(url, headers={'User-Agent': 'ErasRanker/1.0 (bridge-time-finder)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                return data.get('syncedLyrics')
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f'    HTTP {e.code}')
    except Exception as e:
        print(f'    Error: {e}')
    return None


def parse_lrc(synced_lyrics):
    """Parse LRC text into a list of (ms, line_text) tuples."""
    lines = []
    for line in synced_lyrics.split('\n'):
        m = re.match(r'\[(\d+):(\d+(?:\.\d+)?)\](.*)', line)
        if m:
            ms = int((int(m.group(1)) * 60 + float(m.group(2))) * 1000)
            text = m.group(3).strip()
            if text:
                lines.append((ms, text))
    return lines


def find_bridge_ms(bridge_text, lrc_lines, min_score=0.4):
    """
    Find the LRC timestamp that best matches the first line of bridge_text.
    Returns ms (int) or None if no line scores above min_score.
    """
    bridge_first = bridge_text.strip().split('\n')[0].strip()
    if not bridge_first:
        return None

    best_ms, best_score = None, min_score
    for ms, lrc_line in lrc_lines:
        score = token_similarity(bridge_first, lrc_line)
        if score > best_score:
            best_score = score
            best_ms = ms

    return best_ms


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lyrics_path = os.path.join(script_dir, 'taylor_swift_lyrics.txt')
    out_path    = os.path.join(script_dir, 'src', 'data', 'spotifyBridgeTimes.js')

    print(f'Parsing bridge lyrics from {lyrics_path} ...')
    bridges = parse_bridges(lyrics_path)
    total_bridges = sum(len(v) for v in bridges.values())
    print(f'Found {total_bridges} songs with bridge lyrics. Querying lrclib.net...\n')

    results   = {}   # { "albumId_songIndex": ms }
    found     = 0
    not_found = []

    for album_id in ALBUM_ORDER:
        album_bridges = bridges.get(album_id, {})
        if not album_bridges:
            continue
        album_display = ALBUM_DISPLAY[album_id]

        for song_idx in sorted(album_bridges.keys()):
            song_name   = SONGS[album_id][song_idx]
            bridge_text = album_bridges[song_idx]
            key         = f'{album_id}_{song_idx}'

            print(f'  [{album_id}_{song_idx}] {song_name}')

            synced = fetch_synced_lyrics(song_name, album_display)

            # Retry without Taylor's Version album name if first attempt fails
            if synced is None and "Taylor's Version" in album_display:
                base_name = re.sub(r"\s*\(Taylor's Version\)", '', album_display).strip()
                synced = fetch_synced_lyrics(song_name, base_name)

            if synced is None:
                print(f'    ✗ No synced lyrics found')
                not_found.append(key)
                time.sleep(0.3)
                continue

            lrc_lines = parse_lrc(synced)
            ms = find_bridge_ms(bridge_text, lrc_lines)

            if ms is not None:
                results[key] = ms
                mins, secs = divmod(ms // 1000, 60)
                print(f'    ✓ Bridge at {mins}:{secs:02d} ({ms} ms)')
                found += 1
            else:
                print(f'    ✗ Bridge line not matched in LRC')
                not_found.append(key)

            # Be polite to the free API
            time.sleep(0.3)

    # ── Write output JS ───────────────────────────────────────────────────────
    out = [
        '// Auto-generated by find_bridge_times.py — do not edit by hand.',
        '// Run `python find_bridge_times.py` from the project root to regenerate.',
        '// Bridge section start positions in milliseconds, keyed by "albumId_songIndex".',
        '',
        'export const SPOTIFY_BRIDGE_TIMES = {',
    ]

    for album_id in ALBUM_ORDER:
        album_keys = [k for k in results if k.startswith(f'{album_id}_')]
        if not album_keys:
            continue
        out.append(f'  // {ALBUM_DISPLAY[album_id]}')
        for key in sorted(album_keys, key=lambda k: int(k.split('_')[1])):
            song_idx  = int(key.split('_')[1])
            song_name = SONGS[album_id][song_idx]
            ms        = results[key]
            mins, secs = divmod(ms // 1000, 60)
            out.append(f'  {key!r}: {ms},  // {song_name} — {mins}:{secs:02d}')
        out.append('')

    out.append('};')
    out.append('')

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))

    print(f'\n── Results ──────────────────────────────────────────────')
    print(f'  Matched : {found}')
    print(f'  Missing : {len(not_found)}')
    if not_found:
        print('  Not found:')
        for k in not_found:
            aid, idx = k.split('_')
            print(f'    {k}  {SONGS[aid][int(idx)]}')
    print(f'\nWrote {out_path}')


if __name__ == '__main__':
    main()
