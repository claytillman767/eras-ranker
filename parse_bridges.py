"""
Parses taylor_swift_lyrics.txt and extracts [Bridge] sections for every song.
Outputs src/data/bridgeLyrics.js with a lookup keyed by albumId + songIndex.
"""

import re

# Map album name → album id.  Order doesn't matter; we use word-boundary regex.
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

# Pre-compile word-boundary patterns for each album name
ALBUM_PATTERNS = [
    (re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE), aid)
    for name, aid in ALBUM_MAP
]

# Exact song lists from albums.js (same order = same index)
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
        'Florida!!! (feat. Florence and the Machine)', 'Guilty as Sin?', "Who's Afraid of Little Old Me?",
        'I Can Fix Him (No Really I Can)', 'loml', 'I Can Do It With a Broken Heart',
        'The Smallest Man Who Ever Lived', 'The Alchemy', 'Clara Bow',
        # The Anthology (tracks 17–31)
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


def normalize(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def album_id_for_header(header_line):
    """Match an album header line using word-boundary regex to avoid
    'Red' matching inside 'Tortured', etc."""
    # Try longer names first so more specific names win
    matches = []
    for pattern, aid in ALBUM_PATTERNS:
        if pattern.search(header_line):
            matches.append((aid, pattern.pattern))
    if not matches:
        return None
    # Prefer the match whose pattern is longest (most specific)
    matches.sort(key=lambda x: len(x[1]), reverse=True)
    return matches[0][0]


def match_song(title, album_id):
    """Return the index of title in SONGS[album_id], or -1 if not found."""
    songs = SONGS.get(album_id, [])
    norm_title = normalize(title)
    for i, s in enumerate(songs):
        if normalize(s) == norm_title:
            return i
    # Fallback: longest common substring
    for i, s in enumerate(songs):
        ns = normalize(s)
        if ns in norm_title or norm_title in ns:
            return i
    return -1


def parse_lyrics(path):
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()

    # Result: { albumId: { songIndex: bridgeLyricsString } }
    result = {}

    current_album = None
    current_song_index = -1
    in_bridge = False
    bridge_lines = []
    bridge_collected = False  # only grab first [Bridge] per song

    DIVIDER_CHAR = '\u2550'  # ═

    def flush_bridge():
        nonlocal bridge_lines, in_bridge
        if bridge_lines and current_album and current_song_index >= 0:
            text = '\n'.join(l.rstrip('\n') for l in bridge_lines).strip()
            if text:
                result.setdefault(current_album, {})[current_song_index] = text
        bridge_lines.clear()
        in_bridge = False

    i = 0
    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()

        # ── Album divider line (═══…═══) ──────────────────────────────────
        if stripped and all(c == DIVIDER_CHAR for c in stripped):
            # Peek at the very next non-blank line for the album title
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                candidate = lines[j].strip()
                aid = album_id_for_header(candidate)
                if aid and aid != current_album:
                    flush_bridge()
                    current_album = aid
                    current_song_index = -1
                    bridge_collected = False
            i += 1
            continue

        # ── Song header (### Song Name) ───────────────────────────────────
        if stripped.startswith('### '):
            flush_bridge()
            song_title = stripped[4:].strip()
            current_song_index = match_song(song_title, current_album) if current_album else -1
            bridge_collected = False
            i += 1
            continue

        # ── Section label [Anything] ──────────────────────────────────────
        if stripped.startswith('[') and ']' in stripped:
            # Extract text between first [ and last ]
            section = stripped[stripped.index('[') + 1: stripped.rindex(']')].strip()
            if in_bridge:
                flush_bridge()
            if section.lower().startswith('bridge') and not bridge_collected:
                in_bridge = True
                bridge_collected = True
            else:
                in_bridge = False
            i += 1
            continue

        # ── Collect bridge content ────────────────────────────────────────
        if in_bridge:
            bridge_lines.append(raw)

        i += 1

    flush_bridge()
    return result


def escape_js(s):
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('${', '\\${')
    return s


def main():
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lyrics_path = os.path.join(script_dir, 'taylor_swift_lyrics.txt')
    out_path = os.path.join(script_dir, 'src', 'data', 'bridgeLyrics.js')

    print(f"Parsing {lyrics_path} ...")
    bridges = parse_lyrics(lyrics_path)

    total = sum(len(v) for v in bridges.values())
    print(f"Found bridge lyrics for {total} songs across {len(bridges)} albums.")

    print("\nSongs with NO bridge lyrics found:")
    for album_id in ['tv','fe','st','rd','89','rp','lv','fl','ev','ml','tp','ls']:
        for idx, song in enumerate(SONGS.get(album_id, [])):
            if idx not in bridges.get(album_id, {}):
                print(f"  {album_id}[{idx}] {song}")

    # ── Build JS output ───────────────────────────────────────────────────
    out = [
        '// Auto-generated by parse_bridges.py — do not edit by hand.',
        '// Bridge lyrics for every Taylor Swift song, keyed by albumId + songIndex.',
        '// A missing entry means the song has no labelled bridge section.',
        '',
        'const BRIDGE_LYRICS = {',
    ]

    for album_id in ['tv','fe','st','rd','89','rp','lv','fl','ev','ml','tp','ls']:
        album_data = bridges.get(album_id, {})
        if not album_data:
            continue
        out.append(f'  {repr(album_id)}: {{')
        for idx in sorted(album_data.keys()):
            lyrics = escape_js(album_data[idx])
            if '\n' in lyrics:
                indented = lyrics.replace('\n', '\n      ')
                out.append(f'    {idx}: `{indented}`,')
            else:
                out.append(f'    {idx}: `{lyrics}`,')
        out.append('  },')

    out += [
        '};',
        '',
        '/**',
        ' * Returns the bridge lyrics for a song, or null if the song has no bridge.',
        ' * @param {string} albumId',
        ' * @param {number} songIndex',
        ' * @returns {string|null}',
        ' */',
        'export function getBridgeLyrics(albumId, songIndex) {',
        '  return BRIDGE_LYRICS[albumId]?.[songIndex] ?? null;',
        '}',
    ]

    content = '\n'.join(out) + '\n'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"\nWrote {out_path}")


if __name__ == '__main__':
    main()
