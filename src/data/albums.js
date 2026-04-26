// All 12 Taylor Swift albums with display data.
// color = background tint for album card, icon = emoji used instead of cover art (legal requirement).
export const ALBUMS = [
  { id: 'tv',  name: 'Taylor Swift (Debut)',             year: 2006, icon: '🎀', color: '#faeeda' },
  { id: 'fe',  name: 'Fearless',                       year: 2008, icon: '✨', color: '#fef3c7' },
  { id: 'st',  name: 'Speak Now',                      year: 2010, icon: '💜', color: '#f3e8ff' },
  { id: 'rd',  name: 'Red',                            year: 2012, icon: '❤️', color: '#fee2e2' },
  { id: '89',  name: '1989',                           year: 2014, icon: '🌊', color: '#dbeafe' },
  { id: 'rp',  name: 'Reputation',                     year: 2017, icon: '🐍', color: '#f1f0eb' },
  { id: 'lv',  name: 'Lover',                          year: 2019, icon: '🌈', color: '#fdf2f8' },
  { id: 'fl',  name: 'Folklore',                       year: 2020, icon: '🌲', color: '#ecfdf5' },
  { id: 'ev',  name: 'Evermore',                       year: 2020, icon: '🍂', color: '#fff7ed' },
  { id: 'ml',  name: 'Midnights',                      year: 2022, icon: '🌙', color: '#e0e7ff' },
  { id: 'tp',  name: 'The Tortured Poets Department',  year: 2024, icon: '📖', color: '#f5f5f0' },
  { id: 'ls',  name: 'The Life of a Showgirl',        year: 2026, icon: '🎭', color: '#fdf4ff' },
];

// Non-album Taylor Swift tracks (features, soundtracks, standalone singles).
export const OTHER_ALBUM = { id: 'ot', name: 'Other', year: null, icon: '🎵', color: '#f0f4f8' };

// Full list of all album entries including Other — use this wherever a lookup by id is needed.
export const ALL_ALBUMS = [...ALBUMS, OTHER_ALBUM];

// Full song lists per album. Index within each array = songIndex used in rating keys.
// Key format: albumId + '_' + songIndex (0-based)
export const SONGS = {
  tv: [
    'Tim McGraw', 'Picture to Burn', 'Teardrops on My Guitar', 'Stay Beautiful',
    "Should've Said No", 'Cold as You', 'The Outside', 'Tied Together with a Smile',
    "Mary's Song (Oh My My My)", 'Our Song',
  ],
  fe: [
    'Fearless', 'Fifteen', 'Love Story', 'Hey Stephen', 'White Horse',
    'You Belong with Me', 'Breathe', 'Tell Me Why', "You're Not Sorry",
    'The Way I Loved You', 'Forever & Always', 'The Best Day', 'Change',
    // Fearless (Taylor's Version) vault tracks
    'You All Over Me (feat. Maren Morris) (From The Vault)',
    'Mr. Perfectly Fine (From The Vault)',
    'We Were Happy (From The Vault)',
    'That\'s When (feat. Keith Urban) (From The Vault)',
    'Don\'t You (feat. Trombone Shorty) (From The Vault)',
    'Bye Bye Baby (From The Vault)',
  ],
  st: [
    'Mine', 'Sparks Fly', 'Back to December', 'Speak Now', 'Dear John',
    'Mean', 'The Story of Us', 'Never Grow Up', 'Enchanted',
    'Better than Revenge', 'Innocent', 'Haunted', 'Last Kiss', 'Long Live',
    // Speak Now (Taylor's Version) vault tracks
    'Electric Touch (feat. Fall Out Boy) (From The Vault)',
    'When Emma Falls in Love (From The Vault)',
    'I Can See You (From The Vault)',
    'Castles Crumbling (feat. Hayley Williams) (From The Vault)',
    'Timeless (From The Vault)',
    'Foolish One (From The Vault)',
  ],
  rd: [
    'State of Grace', 'Red', 'Treacherous', 'I Knew You Were Trouble',
    'All Too Well', '22', 'I Almost Do', 'We Are Never Getting Back Together',
    'Stay Stay Stay', 'The Last Time', 'Holy Ground', 'Sad Beautiful Tragic',
    'The Lucky One', 'Everything Has Changed', 'Starlight', 'Begin Again',
    // Red (Taylor's Version) vault tracks
    'Better Man (From The Vault)',
    'Nothing New (feat. Phoebe Bridgers) (From The Vault)',
    'Babe (From The Vault)',
    'Message in a Bottle (From The Vault)',
    'I Bet You Think About Me (feat. Chris Stapleton) (From The Vault)',
    'Forever Winter (From The Vault)',
    'Run (feat. Ed Sheeran) (From The Vault)',
    'The Very First Night (From The Vault)',
    'All Too Well (10 Minute Version) (From The Vault)',
  ],
  '89': [
    'Welcome to New York', 'Blank Space', 'Style', 'Out of the Woods',
    'All You Had to Do Was Stay', 'Shake It Off', 'I Wish You Would',
    'Bad Blood', 'Wildest Dreams', 'How You Get the Girl', 'Clean',
    'Wonderland', 'You Are in Love', 'New Romantics',
    // 1989 (Taylor's Version) vault tracks
    'Slut! (From The Vault)',
    'Say Don\'t Go (From The Vault)',
    'Now That We Don\'t Talk (From The Vault)',
    'Suburban Legends (From The Vault)',
    'Is It Over Now? (From The Vault)',
  ],
  rp: [
    '...Ready for It?', 'End Game', 'I Did Something Bad', "Don't Blame Me",
    'Delicate', 'Look What You Made Me Do', 'So It Goes...', 'Gorgeous',
    'Getaway Car', 'King of My Heart', 'Dancing with Our Hands Tied',
    'Dress', "This Is Why We Can't Have Nice Things", 'Call It What You Want',
    "New Year's Day",
  ],
  lv: [
    'I Forgot That You Existed', 'Cruel Summer', 'Lover', 'The Man',
    'The Archer', 'I Think He Knows', 'Miss Americana & the Heartbreak Prince',
    'Paper Rings', 'Cornelia Street', 'Death by a Thousand Cuts',
    'London Boy', "Soon You'll Get Better", 'False God', 'You Need to Calm Down',
    'Afterglow', 'Me!', "It's Nice to Have a Friend", 'Daylight',
  ],
  fl: [
    'the 1', 'cardigan', 'the last great american dynasty', 'exile',
    'my tears ricochet', 'mirrorball', 'seven', 'august',
    'this is me trying', 'illicit affairs', 'invisible string',
    'mad woman', 'epiphany', 'betty', 'peace', 'hoax',
  ],
  ev: [
    'willow', 'champagne problems', 'gold rush', "'tis the damn season",
    'tolerate it', 'no body no crime', 'happiness', 'dorothea',
    'coney island', 'ivy', 'cowboy like me', 'long story short',
    'marjorie', 'closure', 'evermore',
  ],
  ml: [
    'Lavender Haze', 'Maroon', 'Anti-Hero', 'Snow on the Beach',
    'Midnight Rain', 'Question...?', 'Vigilante Shit', 'Bejeweled',
    'Labyrinth', 'Karma', 'Sweet Nothing', 'Mastermind',
    'The Great War', 'Bigger Than the Whole Sky', 'Paris',
    'High Infidelity', 'Glitch', "Would've, Could've, Should've", 'Dear Reader',
  ],
  tp: [
    // The Tortured Poets Department (standard, tracks 1–16)
    'Fortnight (feat. Post Malone)', 'The Tortured Poets Department', 'My Boy Only Breaks His Favorite Toys',
    'Down Bad', 'So Long, London', 'But Daddy I Love Him', 'Fresh Out the Slammer',
    'Florida!!! (feat. Florence and the Machine)', 'Guilty as Sin?', "Who's Afraid of Little Old Me?",
    'I Can Fix Him (No Really I Can)', 'loml', 'I Can Do It With a Broken Heart',
    'The Smallest Man Who Ever Lived', 'The Alchemy', 'Clara Bow',
    // The Anthology (tracks 17–31)
    'The Black Dog', 'imgonnagetyouback', 'The Albatross',
    'Chloe or Sam or Sophia or Marcus', 'How Did It End?', 'So High School',
    'I Hate It Here', 'thanK you aIMee', 'I Look in People\'s Windows',
    'The Prophecy', 'Cassandra', 'Peter', 'The Bolter', 'Robin', 'The Manuscript',
  ],
  ls: [
    'The Fate of Ophelia', 'Elizabeth Taylor', 'Opalite', 'Father Figure',
    'Eldest Daughter', 'Ruin the Friendship', 'Actually Romantic', 'WI$SHLI$T',
    'Wood', 'CANCELLED!', 'Honey', 'The Life of a Showgirl (feat. Sabrina Carpenter)',
  ],
  // Songs Taylor Swift appears on that aren't part of a main album.
  // Includes soundtrack songs, standalone singles, and features on other artists' tracks.
  ot: [
    'Crazier',
    'Today Was a Fairy Tale',
    'Safe & Sound (feat. The Civil Wars)',
    'Eyes Open',
    'Sweeter Than Fiction',
    'Both of Us (feat. Taylor Swift)',
    'Highway Don\'t Care (feat. Taylor Swift)',
    'Only the Young',
    'Beautiful Ghosts',
    'Carolina',
    'Christmas Tree Farm',
    'All of the Girls You Loved Before',
  ],
};
