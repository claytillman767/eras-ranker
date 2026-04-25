#!/usr/bin/env python3
"""
fetch_anthology.py — Fetch the 15 TTPD Anthology tracks and append them
to the existing taylor_swift_lyrics.txt.

Fetches via album search ("The Tortured Poets Department: The Anthology")
using the same method that works for all other albums, then filters down
to only the 15 Anthology-only tracks.
"""

import os
import re
import sys
import time
from pathlib import Path

def _require(pip_name: str, import_name: str | None = None):
    import importlib
    mod_name = import_name or pip_name
    try:
        return importlib.import_module(mod_name)
    except ModuleNotFoundError:
        print(f"[setup] '{pip_name}' not found — installing…")
        import subprocess
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", pip_name],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return importlib.import_module(mod_name)

lyricsgenius = _require("lyricsgenius")
_dotenv = _require("python-dotenv", "dotenv")
_dotenv.load_dotenv(Path(__file__).parent / ".env")

TOKEN = os.getenv("GENIUS_API_TOKEN") or os.getenv("GENIUS_ACCESS_TOKEN")
if not TOKEN:
    TOKEN = input("Paste your Genius API token: ").strip()
if not TOKEN:
    sys.exit("No token provided — exiting.")

# Only the 15 tracks not in the standard album
ANTHOLOGY_SONGS = [
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
]

OUTPUT_FILE   = Path(__file__).parent / "taylor_swift_lyrics.txt"
SLEEP_BETWEEN = 0.8
MAX_RETRIES   = 3
BACKOFF_BASE  = 2

genius = lyricsgenius.Genius(
    TOKEN,
    sleep_time=SLEEP_BETWEEN,
    timeout=20,
    retries=2,
    remove_section_headers=False,
    skip_non_songs=True,
    excluded_terms=["(Remix)", "(Live)", "(Demo)", "(Karaoke)", "(Instrumental)"],
)
genius.verbose = False


def _fetch(fn, *args, label="request", **kwargs):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:
            wait = BACKOFF_BASE ** attempt
            print(f"    [error] {label}: {exc} — retrying in {wait}s (attempt {attempt}/{MAX_RETRIES})")
            time.sleep(wait)
    print(f"    [skip] giving up on {label}")
    return None


def _clean(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"^\d+\s+Contributors.*?\n", "", text, flags=re.DOTALL)
    text = re.sub(r"\n?\d*\s*Embed$", "", text.strip())
    return text.strip()


def _song_block(title: str, lyrics: str | None) -> str:
    if not lyrics:
        return f"### {title}\n    [lyrics not found on Genius]\n\n"
    cleaned = _clean(lyrics)
    has_chorus = bool(re.search(r"\[Chorus", cleaned, re.IGNORECASE))
    has_bridge = bool(re.search(r"\[Bridge", cleaned, re.IGNORECASE))
    return "\n".join([
        f"### {title}",
        f"    chorus: {'labelled' if has_chorus else 'not labelled by Genius'}",
        f"    bridge: {'labelled' if has_bridge else 'not labelled by Genius'}",
        "",
        cleaned,
        "",
        "",
    ])


def normalize(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def main():
    print(f"\nAppending Anthology tracks to: {OUTPUT_FILE}\n")

    # ── Try fetching the full Anthology album object ──────────────────────────
    print("Searching Genius for 'The Tortured Poets Department: The Anthology'...")
    album_obj = _fetch(
        genius.search_album,
        "The Tortured Poets Department: The Anthology", "Taylor Swift",
        label="Anthology album",
    )

    # Build a lookup of title → lyrics from whatever the album returned
    found: dict[str, str] = {}

    if album_obj and getattr(album_obj, "tracks", None):
        print(f"  Found album on Genius ({len(album_obj.tracks)} tracks)")
        for track in album_obj.tracks:
            if isinstance(track, tuple):
                song = track[1] if len(track) > 1 else track[0]
            elif hasattr(track, "song"):
                song = track.song
            else:
                song = track
            title = song.title if hasattr(song, "title") else str(song)
            lyrics = song.lyrics if (song and song.lyrics and len(song.lyrics) > 50) else None
            if lyrics:
                found[normalize(title)] = (title, lyrics)
            time.sleep(SLEEP_BETWEEN)
    else:
        print("  Album not found on Genius — will mark all as missing.")

    # ── Write only the 15 Anthology-only tracks ───────────────────────────────
    missing = []
    with OUTPUT_FILE.open("a", encoding="utf-8") as out:
        out.write("\n# ── TTPD Anthology tracks (appended by fetch_anthology.py) ──\n\n")

        for title in ANTHOLOGY_SONGS:
            match = found.get(normalize(title))
            if match:
                actual_title, lyrics = match
                print(f"  ✓ {title}")
                out.write(_song_block(title, lyrics))
            else:
                print(f"  [missing] {title}")
                missing.append(title)
                out.write(_song_block(title, None))

    print(f"\nDone.")
    if missing:
        print(f"\nMissing ({len(missing)}):")
        for t in missing:
            print(f"  • {t}")
    else:
        print("All 15 Anthology tracks retrieved successfully.")


if __name__ == "__main__":
    main()
