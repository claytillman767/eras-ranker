#!/usr/bin/env python3
"""
fetch_lyrics.py — Download every Taylor Swift song's lyrics from Genius
and write them to taylor_swift_lyrics.txt organised by album.

Sections such as [Verse 1], [Chorus], [Bridge] are sourced directly from
Genius and preserved as-is in the output.

Requirements:
    pip install lyricsgenius python-dotenv

Token:
    Put GENIUS_API_TOKEN=<your token> in a .env file in this directory,
    or the script will prompt you to paste it at runtime.
    Get a token at https://genius.com/api-clients
"""

import os
import re
import sys
import time
from pathlib import Path

# ── Dependency bootstrap ──────────────────────────────────────────────────────

def _require(pip_name: str, import_name: str | None = None):
    """Import a package, installing it via pip if missing."""
    import importlib
    mod_name = import_name or pip_name
    try:
        return importlib.import_module(mod_name)
    except ModuleNotFoundError:
        print(f"[setup] '{pip_name}' not found — installing…")
        import subprocess
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", pip_name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return importlib.import_module(mod_name)

lyricsgenius = _require("lyricsgenius")
_dotenv = _require("python-dotenv", "dotenv")
_dotenv.load_dotenv(Path(__file__).parent / ".env")

# ── Token ─────────────────────────────────────────────────────────────────────

TOKEN = os.getenv("GENIUS_API_TOKEN") or os.getenv("GENIUS_ACCESS_TOKEN")
if not TOKEN:
    TOKEN = input("Paste your Genius API token: ").strip()
if not TOKEN:
    sys.exit("No token provided — exiting.")

# ── Album manifest ────────────────────────────────────────────────────────────
# Kept in sync with src/data/albums.js. Tuple: (Genius search title, year).
# Taylor's Version albums are listed under both names so the Genius search
# finds whichever version is indexed.

ALBUMS: list[tuple[str, int]] = [
    ("Taylor Swift",                  2006),
    ("Fearless",                      2008),
    ("Speak Now",                     2010),
    ("Red",                           2012),
    ("1989",                          2014),
    ("Reputation",                    2017),
    ("Lover",                         2019),
    ("Folklore",                      2020),
    ("Evermore",                      2020),
    ("Midnights",                     2022),
    ("The Tortured Poets Department", 2024),
    ("The Life of a Showgirl",        2026),
]

# Songs that aren't in the Genius album object (e.g. Anthology bonus tracks)
# and need to be fetched individually. Keyed by album title.
SUPPLEMENTAL: dict[str, list[str]] = {
    "The Tortured Poets Department": [
        "The Black Dog",
        "imgonnagetyouback",
        "The Albatross",
        "Chloe or Sam or Sophia or Marcus",
        "How Did It End?",
        "So High School",
        "I Hate It Here",
        "thanK you aIMee",
        "I Look in People's Windows",
        "The Prophecy",
        "Cassandra",
        "Peter",
        "The Bolter",
        "Robin",
        "The Manuscript",
    ],
}

OUTPUT_FILE     = Path(__file__).parent / "taylor_swift_lyrics.txt"
SLEEP_BETWEEN   = 0.8   # seconds between song fetches (be polite)
MAX_RETRIES     = 5
BACKOFF_BASE    = 2     # seconds; doubles each retry

# ── Genius client ─────────────────────────────────────────────────────────────

genius = lyricsgenius.Genius(
    TOKEN,
    sleep_time=SLEEP_BETWEEN,
    timeout=20,
    retries=3,
    remove_section_headers=False,   # keep [Chorus], [Bridge], etc.
    skip_non_songs=True,
    excluded_terms=["(Remix)", "(Live)", "(Demo)", "(Karaoke)", "(Instrumental)"],
)
genius.verbose = False

# ── Helpers ───────────────────────────────────────────────────────────────────

def _fetch(fn, *args, label: str = "request", **kwargs):
    """Call fn with exponential backoff; returns None after MAX_RETRIES failures."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:
            wait = BACKOFF_BASE ** attempt
            msg = str(exc)
            if "429" in msg or "rate" in msg.lower():
                print(f"    [rate limit] sleeping {wait}s… (attempt {attempt}/{MAX_RETRIES})")
            elif "timeout" in msg.lower():
                print(f"    [timeout] {label} — retrying in {wait}s (attempt {attempt}/{MAX_RETRIES})")
            else:
                print(f"    [error] {label}: {exc} — retrying in {wait}s (attempt {attempt}/{MAX_RETRIES})")
            time.sleep(wait)
    print(f"    [skip] giving up on {label} after {MAX_RETRIES} attempts")
    return None


def _clean(text: str) -> str:
    """Strip Genius boilerplate that appears before/after scraped lyrics."""
    if not text:
        return ""
    # "123 ContributorsSome Song Lyrics..." header added by Genius
    text = re.sub(r"^\d+\s+Contributors.*?\n", "", text, flags=re.DOTALL)
    # Trailing "1234Embed" or just "Embed"
    text = re.sub(r"\n?\d*\s*Embed$", "", text.strip())
    return text.strip()


def _has_section(lyrics: str, section: str) -> bool:
    return bool(re.search(rf"\[{section}", lyrics, re.IGNORECASE))


def _song_block(title: str, lyrics: str | None) -> str:
    """Format one song's output block."""
    if not lyrics:
        return f"### {title}\n    [lyrics not found on Genius]\n\n"

    cleaned = _clean(lyrics)
    has_chorus = _has_section(cleaned, "Chorus")
    has_bridge = _has_section(cleaned, "Bridge")

    lines = [
        f"### {title}",
        f"    chorus: {'labelled' if has_chorus else 'not labelled by Genius'}",
        f"    bridge: {'labelled' if has_bridge else 'not labelled by Genius'}",
        "",
        cleaned,
        "",
        "",
    ]
    return "\n".join(lines)


def _ensure_lyrics(song) -> str | None:
    """
    lyricsgenius Album tracks sometimes lack full lyrics.
    If so, refetch the song individually.
    """
    if song and song.lyrics and len(song.lyrics) > 50:
        return song.lyrics
    if song:
        refetched = _fetch(
            genius.search_song,
            song.title, "Taylor Swift",
            label=f"song '{song.title}'",
        )
        return refetched.lyrics if refetched else None
    return None

# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    missing: list[str] = []

    print(f"\nOutput → {OUTPUT_FILE}\n")

    with OUTPUT_FILE.open("w", encoding="utf-8") as out:

        out.write("Taylor Swift — Complete Lyrics\n")
        out.write("Sourced from Genius. Sections ([Verse], [Chorus], [Bridge], etc.)\n")
        out.write("are preserved exactly as labelled by Genius contributors.\n")
        out.write("=" * 70 + "\n")

        for album_title, album_year in ALBUMS:
            print(f"\n{'─' * 55}")
            print(f"  {album_title} ({album_year})")
            print(f"{'─' * 55}")

            out.write(f"\n{'═' * 70}\n")
            out.write(f"  {album_title} ({album_year})\n")
            out.write(f"{'═' * 70}\n\n")

            # ── Try fetching as a Genius album object first ───────────────
            album_obj = _fetch(
                genius.search_album,
                album_title, "Taylor Swift",
                label=f"album '{album_title}'",
            )

            songs_written = 0

            if album_obj and getattr(album_obj, "tracks", None):
                print(f"  Found album on Genius ({len(album_obj.tracks)} tracks)")
                for track in album_obj.tracks:
                    # Handle both object-style and tuple-style track formats
                    if isinstance(track, tuple):
                        song = track[1] if len(track) > 1 else track[0]
                    elif hasattr(track, "song"):
                        song = track.song
                    else:
                        song = track
                    title = song.title if hasattr(song, "title") else str(song)
                    print(f"  · {title}")
                    lyrics = _ensure_lyrics(song)
                    if lyrics:
                        out.write(_song_block(title, lyrics))
                        songs_written += 1
                    else:
                        print(f"    [missing] no lyrics for '{title}'")
                        missing.append(f"{album_title} — {title}")
                        out.write(_song_block(title, None))
                    time.sleep(SLEEP_BETWEEN)

            else:
                # ── Fallback: search songs individually by title ───────────
                print("  Album not found on Genius — searching songs individually")
                # Pull the known tracklist from our local manifest if available,
                # otherwise just note the gap.
                out.write("  [album not indexed on Genius — no tracks written]\n\n")
                print("  No fallback tracklist available; skipping album.")

            # ── Supplemental songs (not in Genius album object) ───────────
            for supp_title in SUPPLEMENTAL.get(album_title, []):
                print(f"  · {supp_title} (supplemental)")
                supp_song = _fetch(
                    genius.search_song,
                    supp_title, "Taylor Swift",
                    label=f"song '{supp_title}'",
                )
                supp_lyrics = supp_song.lyrics if supp_song else None
                if supp_lyrics:
                    out.write(_song_block(supp_title, supp_lyrics))
                    songs_written += 1
                else:
                    print(f"    [missing] no lyrics for '{supp_title}'")
                    missing.append(f"{album_title} — {supp_title}")
                    out.write(_song_block(supp_title, None))
                time.sleep(SLEEP_BETWEEN)

            print(f"  → {songs_written} song(s) written")

        # ── Footer ────────────────────────────────────────────────────────
        out.write(f"\n{'═' * 70}\n")
        out.write("END OF FILE\n")
        if missing:
            out.write(f"\n— Missing lyrics ({len(missing)}) —\n")
            for entry in missing:
                out.write(f"  • {entry}\n")

    # ── Console summary ───────────────────────────────────────────────────
    print(f"\n{'=' * 55}")
    print(f"Done. Saved to:\n  {OUTPUT_FILE.resolve()}")
    if missing:
        print(f"\nMissing / no lyrics found ({len(missing)}):")
        for entry in missing:
            print(f"  • {entry}")
    else:
        print("\nAll songs retrieved successfully.")


if __name__ == "__main__":
    main()
