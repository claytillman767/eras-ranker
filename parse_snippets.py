"""
Parses taylor_swift_lyrics.txt and extracts a lyric snippet for every song.
Priority: Bridge > Chorus > Verse 1 > whatever comes first.
Outputs src/data/snippetLyrics.js keyed by albumId + songIndex.
Used as floating background text on the shuffle (Play/Skip) screen.
"""

import re

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

# Section rank: lower = preferred. Bridge first, then chorus, then verse 1, then anything.
SECTION_RANK = {}

def section_rank(label):
    l = label.lower()
    if l.startswith('bridge'):        return 0
    if l.startswith('chorus'):        return 1
    if re.match(r'pre.?chorus', l):   return 2
    if l.startswith('verse 1'):       return 3
    if l.startswith('verse'):         return 4
    if l.startswith('intro'):         return 5
    return 6


def normalize(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def album_id_for_header(header_line):
    matches = []
    for pattern, aid in ALBUM_PATTERNS:
        if pattern.search(header_line):
            matches.append((aid, pattern.pattern))
    if not matches:
        return None
    matches.sort(key=lambda x: len(x[1]), reverse=True)
    return matches[0][0]


def match_song(title, album_id):
    songs = SONGS.get(album_id, [])
    norm_title = normalize(title)
    for i, s in enumerate(songs):
        if normalize(s) == norm_title:
            return i
    for i, s in enumerate(songs):
        ns = normalize(s)
        if ns in norm_title or norm_title in ns:
            return i
    return -1


def pick_best(sections):
    """
    sections: list of (rank, lines[])
    Returns up to 10 non-empty lines from the best-ranked section.
    """
    if not sections:
        return None
    sections.sort(key=lambda x: x[0])
    best_lines = sections[0][1]
    result = [l.strip() for l in best_lines if l.strip()]
    return '\n'.join(result[:10]) if result else None


def parse_lyrics(path):
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()

    # result[album_id][song_index] = best snippet string
    result = {}

    current_album = None
    current_song_index = -1
    # per-song accumulation: list of (rank, lines[])
    song_sections = []
    current_section_rank = None
    current_section_lines = []

    DIVIDER_CHAR = '\u2550'

    def flush_section():
        nonlocal current_section_rank, current_section_lines
        if current_section_rank is not None and current_section_lines:
            song_sections.append((current_section_rank, list(current_section_lines)))
        current_section_rank = None
        current_section_lines = []

    def flush_song():
        nonlocal song_sections
        flush_section()
        if song_sections and current_album and current_song_index >= 0:
            snippet = pick_best(song_sections)
            if snippet:
                result.setdefault(current_album, {})[current_song_index] = snippet
        song_sections = []

    i = 0
    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()

        # Album divider
        if stripped and all(c == DIVIDER_CHAR for c in stripped):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                candidate = lines[j].strip()
                aid = album_id_for_header(candidate)
                if aid and aid != current_album:
                    flush_song()
                    current_album = aid
                    current_song_index = -1
            i += 1
            continue

        # Song header
        if stripped.startswith('### '):
            flush_song()
            song_title = stripped[4:].strip()
            current_song_index = match_song(song_title, current_album) if current_album else -1
            i += 1
            continue

        # Section label
        if stripped.startswith('[') and ']' in stripped:
            flush_section()
            label = stripped[stripped.index('[') + 1: stripped.rindex(']')].strip()
            current_section_rank = section_rank(label)
            i += 1
            continue

        # Content lines
        if current_section_rank is not None and current_song_index >= 0:
            current_section_lines.append(raw)

        i += 1

    flush_song()
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
    out_path = os.path.join(script_dir, 'src', 'data', 'snippetLyrics.js')

    print(f"Parsing {lyrics_path} ...")
    snippets = parse_lyrics(lyrics_path)

    total = sum(len(v) for v in snippets.values())
    print(f"Found snippets for {total} songs across {len(snippets)} albums.")

    print("\nSongs with NO snippet found:")
    for album_id in ['tv','fe','st','rd','89','rp','lv','fl','ev','ml','tp','ls']:
        for idx, song in enumerate(SONGS.get(album_id, [])):
            if idx not in snippets.get(album_id, {}):
                print(f"  {album_id}[{idx}] {song}")

    out = [
        '// Auto-generated by parse_snippets.py — do not edit by hand.',
        '// Best lyric snippet per song (bridge > chorus > verse 1 > first section).',
        '// Used as floating background text on the shuffle (Play/Skip) screen.',
        '',
        'const SNIPPET_LYRICS = {',
    ]

    for album_id in ['tv','fe','st','rd','89','rp','lv','fl','ev','ml','tp','ls']:
        album_data = snippets.get(album_id, {})
        if not album_data:
            continue
        out.append(f"  '{album_id}': {{")
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
        ' * Returns a lyric snippet for a song, or null if none found.',
        ' * @param {string} albumId',
        ' * @param {number} songIndex',
        ' * @returns {string|null}',
        ' */',
        'export function getSnippetLyrics(albumId, songIndex) {',
        '  return SNIPPET_LYRICS[albumId]?.[songIndex] ?? null;',
        '}',
    ]

    content = '\n'.join(out) + '\n'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"\nWrote {out_path}")


if __name__ == '__main__':
    main()
