/**
 * check_spotify_previews.js
 *
 * Checks how many Taylor Swift songs have Spotify preview URLs available.
 * Run: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node check_spotify_previews.js
 *
 * Does NOT write any files — read-only audit only.
 */

import https from 'https';

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars.');
  process.exit(1);
}

// Full song list (mirrors src/data/albums.js)
const ALBUMS = [
  { id: 'tv',  name: 'Taylor Swift (Debut)' },
  { id: 'fe',  name: 'Fearless' },
  { id: 'st',  name: 'Speak Now' },
  { id: 'rd',  name: 'Red' },
  { id: '89',  name: '1989' },
  { id: 'rp',  name: 'Reputation' },
  { id: 'lv',  name: 'Lover' },
  { id: 'fl',  name: 'Folklore' },
  { id: 'ev',  name: 'Evermore' },
  { id: 'ml',  name: 'Midnights' },
  { id: 'tp',  name: 'The Tortured Poets Department' },
  { id: 'ls',  name: 'The Life of a Showgirl' },
];

const SONGS = {
  tv: ['Tim McGraw','Picture to Burn','Teardrops on My Guitar','Stay Beautiful',"Should've Said No",'Cold as You','The Outside','Tied Together with a Smile',"Mary's Song (Oh My My My)",'Our Song'],
  fe: ['Fearless','Fifteen','Love Story','Hey Stephen','White Horse','You Belong with Me','Breathe','Tell Me Why',"You're Not Sorry",'The Way I Loved You','Forever & Always','The Best Day','Change'],
  st: ['Mine','Sparks Fly','Back to December','Speak Now','Dear John','Mean','The Story of Us','Never Grow Up','Enchanted','Better than Revenge','Innocent','Haunted','Last Kiss','Long Live'],
  rd: ['State of Grace','Red','Treacherous','I Knew You Were Trouble','All Too Well','22','I Almost Do','We Are Never Getting Back Together','Stay Stay Stay','The Last Time','Holy Ground','Sad Beautiful Tragic','The Lucky One','Everything Has Changed','Starlight','Begin Again'],
  '89': ['Welcome to New York','Blank Space','Style','Out of the Woods','All You Had to Do Was Stay','Shake It Off','I Wish You Would','Bad Blood','Wildest Dreams','How You Get the Girl','Clean','Wonderland','You Are in Love','New Romantics'],
  rp: ['...Ready for It?','End Game','I Did Something Bad',"Don't Blame Me",'Delicate','Look What You Made Me Do','So It Goes...','Gorgeous','Getaway Car','King of My Heart','Dancing with Our Hands Tied','Dress',"This Is Why We Can't Have Nice Things",'Call It What You Want',"New Year's Day"],
  lv: ['I Forgot That You Existed','Cruel Summer','Lover','The Man','The Archer','I Think He Knows','Miss Americana & the Heartbreak Prince','Paper Rings','Cornelia Street','Death by a Thousand Cuts','London Boy',"Soon You'll Get Better",'False God','You Need to Calm Down','Afterglow','Me!',"It's Nice to Have a Friend",'Daylight'],
  fl: ['the 1','cardigan','the last great american dynasty','exile','my tears ricochet','mirrorball','seven','august','this is me trying','illicit affairs','invisible string','mad woman','epiphany','betty','peace','hoax'],
  ev: ['willow','champagne problems','gold rush',"'tis the damn season",'tolerate it','no body no crime','happiness','dorothea','coney island','ivy','cowboy like me','long story short','marjorie','closure','evermore'],
  ml: ['Lavender Haze','Maroon','Anti-Hero','Snow on the Beach','Midnight Rain','Question...?','Vigilante Shit','Bejeweled','Labyrinth','Karma','Sweet Nothing','Mastermind','The Great War','Bigger Than the Whole Sky','Paris','High Infidelity','Glitch',"Would've, Could've, Should've",'Dear Reader'],
  tp: ['Fortnight (feat. Post Malone)','The Tortured Poets Department','My Boy Only Breaks His Favorite Toys','Down Bad','So Long, London','But Daddy I Love Him','Fresh Out the Slammer','Florida!!! (feat. Florence and the Machine)','Guilty as Sin?',"Who's Afraid of Little Old Me?",'I Can Fix Him (No Really I Can)','loml','I Can Do It With a Broken Heart','The Smallest Man Who Ever Lived','The Alchemy','Clara Bow','The Black Dog','imgonnagetyouback','The Albatross','Chloe or Sam or Sophia or Marcus','How Did It End?','So High School','I Hate It Here','thanK you aIMee','I Look in People\'s Windows','The Prophecy','Cassandra','Peter','The Bolter','Robin','The Manuscript'],
  ls: ['The Fate of Ophelia','Elizabeth Taylor','Opalite','Father Figure','Eldest Daughter','Ruin the Friendship','Actually Romantic','WI$SHLI$T','Wood','CANCELLED!','Honey','The Life of a Showgirl (feat. Sabrina Carpenter)'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';
  const result = await httpsRequest({
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
  if (!result.access_token) throw new Error(`Token error: ${JSON.stringify(result)}`);
  return result.access_token;
}

async function searchTrack(token, songName) {
  const query = encodeURIComponent(`artist:Taylor Swift track:${songName}`);
  const result = await httpsRequest({
    hostname: 'api.spotify.com',
    path: `/v1/search?q=${query}&type=track&limit=5&market=US`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const tracks = result?.tracks?.items ?? [];
  // Prefer a result with a preview URL; fall back to first result
  const withPreview = tracks.find(t => t.preview_url);
  const best = withPreview ?? tracks[0] ?? null;
  return best ? { previewUrl: best.preview_url, trackId: best.id, trackName: best.name } : null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Getting Spotify access token...');
  const token = await getAccessToken();
  console.log('Token obtained. Scanning songs...\n');

  const missing = {};   // albumId → [songName]
  let total = 0;
  let found = 0;

  for (const album of ALBUMS) {
    const songs = SONGS[album.id];
    missing[album.id] = [];

    for (const songName of songs) {
      total++;
      process.stdout.write(`  Checking: ${songName.padEnd(50)} `);
      try {
        const result = await searchTrack(token, songName);
        if (result?.previewUrl) {
          found++;
          process.stdout.write('✓ preview found\n');
        } else if (result) {
          missing[album.id].push(songName);
          process.stdout.write('✗ no preview URL\n');
        } else {
          missing[album.id].push(songName);
          process.stdout.write('✗ song not found\n');
        }
      } catch (err) {
        missing[album.id].push(songName);
        process.stdout.write(`✗ error: ${err.message}\n`);
      }
      // Small delay to stay well under Spotify's rate limit
      await sleep(120);
    }
    console.log('');
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('═'.repeat(60));
  console.log(`RESULT: ${found} / ${total} songs have preview URLs (${Math.round(found/total*100)}%)\n`);

  let anyMissing = false;
  for (const album of ALBUMS) {
    const list = missing[album.id];
    if (list.length) {
      anyMissing = true;
      console.log(`${album.name} — ${list.length} missing:`);
      list.forEach(s => console.log(`  • ${s}`));
      console.log('');
    }
  }
  if (!anyMissing) console.log('All songs have previews!');
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
