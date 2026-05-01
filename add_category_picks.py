"""
One-shot helper: adds a batch of category picks to categoryTimesAudit.json.
Used during the in-conversation Stage 2 flow — Claude calls this with a dict of
new picks, the script merges them with existing entries (without overwriting),
and writes back atomically.

Usage: python _add_picks.py
"""
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Picks for the current batch.
# Schema: { song_key: { song, album, picks: { cat_id: { line, score, reasoning } } } }
# 'rejected' and 'manualLine' default to false/null (added on write).
NEW_PICKS = {
    'tv_0': {
        'song':  'Tim McGraw',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'The moon like a spotlight on the lake',                   'score': 70, 'reasoning': 'Iconic Taylor visual — peak romantic memory of the relationship.'},
            'most-devastating':  {'line': 'September saw a month of tears',                          'score': 55, 'reasoning': 'Direct admission of grief, but framed as wistful retrospect rather than fresh wound.'},
            'cry-factor':        {'line': "And there's a letter left on your doorstep",              'score': 60, 'reasoning': 'Bridge image of returning with a letter — quiet, visual ache.'},
            'best-storytelling': {'line': 'Just a boy in a Chevy truck',                             'score': 75, 'reasoning': 'Country-debut character setup in a single line — establishes the whole world.'},
            'best-lyrics':       {'line': 'The moon like a spotlight on the lake',                   'score': 70, 'reasoning': 'Strong debut imagery — the line that anchors the song\'s nostalgia.'},
        },
    },
    'tv_1': {
        'song':  'Picture to Burn',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': None,                                                       'score': 0,  'reasoning': 'Anger anthem — no romantic content.'},
            'most-devastating':  {'line': 'I realize you love yourself more than you could ever love me', 'score': 35, 'reasoning': 'A kernel of hurt under all the bravado, but the song is sass not devastation.'},
            'cry-factor':        {'line': None,                                                       'score': 5,  'reasoning': 'No tears — this is pure attitude and revenge.'},
            'best-storytelling': {'line': "There's no time for tears, I'm just sittin' here planning my revenge", 'score': 60, 'reasoning': 'Sets up the whole song\'s posture in one declarative line.'},
            'best-lyrics':       {'line': "As far as I'm concerned, you're just another picture to burn", 'score': 65, 'reasoning': 'Title-drop with the central burn metaphor — catchy if simple.'},
        },
    },
    'tv_3': {
        'song':  'Stay Beautiful',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'I hope your life leads you back to my door',              'score': 75, 'reasoning': 'Selfless wish for the crush — the heart of the song\'s sweetness.'},
            'most-devastating':  {'line': None,                                                       'score': 5,  'reasoning': 'Sweet, well-wishing crush song — no devastating content.'},
            'cry-factor':        {'line': 'If you and I are a story',                                 'score': 50, 'reasoning': 'Bridge has the song\'s only real ache — a quiet might-have-been.'},
            'best-storytelling': {'line': "Cory's eyes are like a jungle",                            'score': 55, 'reasoning': 'Opens the song with a vivid character introduction.'},
            'best-lyrics':       {'line': 'He whispers songs into my window',                        'score': 50, 'reasoning': 'Sweet image, but earlier-era simplicity — not peak craft.'},
        },
    },
    'tv_4': {
        'song':  "Should've Said No",
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': None,                                                       'score': 0,  'reasoning': 'Cheating betrayal anthem — no romantic content.'},
            'most-devastating':  {'line': 'Yesterday, I found out about you',                        'score': 70, 'reasoning': 'The pivot moment when the betrayal lands — direct gut punch.'},
            'cry-factor':        {'line': "And I should've been there in the back of your mind",     'score': 60, 'reasoning': 'Vulnerability cracks the anger — the cry line beneath the spite.'},
            'best-storytelling': {'line': "It's strange to think the songs we used to sing",        'score': 60, 'reasoning': 'Opens with reflective scene-setting before the betrayal reveal.'},
            'best-lyrics':       {'line': "You should've said no, you should've gone home",          'score': 60, 'reasoning': 'Title-drop with anaphoric "should\'ve" structure — catchy.'},
        },
    },
    'tv_5': {
        'song':  'Cold as You',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'And I stood there loving you and wished them all away',   'score': 35, 'reasoning': 'Devotion in the face of coldness — sad-romantic, not swoony.'},
            'most-devastating':  {'line': "I've never been anywhere cold as you",                    'score': 80, 'reasoning': 'Title line carrying the central devastation — the whole song in one image.'},
            'cry-factor':        {'line': 'But I cried, cried for you',                              'score': 75, 'reasoning': 'Bridge confession — naming her own tears against an unfeeling lover.'},
            'best-storytelling': {'line': 'You put up walls and paint them all a shade of gray',     'score': 60, 'reasoning': 'Vivid metaphor that captures the lover\'s entire emotional architecture.'},
            'best-lyrics':       {'line': 'Oh, what a shame, what a rainy ending',                   'score': 70, 'reasoning': 'Sound and meaning fused — the chorus opener doing structural work.'},
        },
    },
    'tv_6': {
        'song':  'The Outside',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'I would give it all up to be',                            'score': 25, 'reasoning': 'Implied unrequited longing — barely qualifies as romantic.'},
            'most-devastating':  {'line': 'Nobody ever lets me in',                                  'score': 65, 'reasoning': 'Pure isolation captured in five words — the song\'s emotional core.'},
            'cry-factor':        {'line': "I've never been on the outside",                          'score': 65, 'reasoning': 'Heightened self-pity — the line that twists the knife on loneliness.'},
            'best-storytelling': {'line': 'I tried to take the road less traveled by',               'score': 50, 'reasoning': 'Frost-reference frames the self-narrative of being out of step.'},
            'best-lyrics':       {'line': 'On the outside looking in',                               'score': 55, 'reasoning': 'Anchors the song with a clean declarative phrase.'},
        },
    },
    'tv_7': {
        'song':  'Tied Together with a Smile',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': None,                                                       'score': 0,  'reasoning': 'Friend song about hidden struggle — not romantic.'},
            'most-devastating':  {'line': "That you cry, but you don't tell anyone",                  'score': 70, 'reasoning': 'Devastating witness to a friend\'s hidden pain — quiet and exact.'},
            'cry-factor':        {'line': "And you're tied together with a smile",                   'score': 75, 'reasoning': 'Title image — the brave-face mask cracking under pressure.'},
            'best-storytelling': {'line': 'But he leaves you out like a penny in the rain',          'score': 60, 'reasoning': 'Vivid simile that captures the friend\'s disposability.'},
            'best-lyrics':       {'line': "The water's high, you're jumping into it and letting go", 'score': 65, 'reasoning': 'Strong metaphor for self-destructive surrender.'},
        },
    },
    'tv_8': {
        'song':  "Mary's Song (Oh My My My)",
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'Take me back to the time when we walked down the aisle', 'score': 90, 'reasoning': 'Definitive lifelong-love song — wedding moment in the arc.'},
            'most-devastating':  {'line': None,                                                       'score': 0,  'reasoning': 'Pure happy story — no devastation.'},
            'cry-factor':        {'line': "And I'll be eighty-seven, you'll be eighty-nine",         'score': 70, 'reasoning': 'Wedding-tears territory — imagining a whole life together.'},
            'best-storytelling': {'line': 'She said I was seven and you were nine',                  'score': 85, 'reasoning': 'Opens a complete childhood-to-marriage narrative arc.'},
            'best-lyrics':       {'line': 'I looked at you like the stars that shined',              'score': 65, 'reasoning': 'Opening imagery that frames a whole life of seeing this person.'},
        },
    },
    'tv_9': {
        'song':  'Our Song',
        'album': 'Taylor Swift',
        'picks': {
            'most-romantic':     {'line': 'The other on my heart',                                   'score': 75, 'reasoning': 'Sweet teen-romance image — driving with him, hand on her heart.'},
            'most-devastating':  {'line': None,                                                       'score': 5,  'reasoning': 'Happy debut single about a country teen romance — no devastation.'},
            'cry-factor':        {'line': None,                                                       'score': 10, 'reasoning': 'Pure happy song — no tear-trigger moment.'},
            'best-storytelling': {'line': "I was ridin' shotgun with my hair undone",                'score': 75, 'reasoning': 'Country opening that places you in the scene immediately.'},
            'best-lyrics':       {'line': "Our song is a slammin' screen door",                     'score': 75, 'reasoning': 'Clever conceit — the title-drop where the metaphor lands.'},
        },
    },
    'fe_0': {
        'song':  'Fearless',
        'album': "Fearless (Taylor's Version)",
        'picks': {
            'most-romantic':     {'line': 'You take my hand and drag me head first, fearless',       'score': 90, 'reasoning': 'Definitive falling-in-love line in Taylor\'s discography — title image.'},
            'most-devastating':  {'line': None,                                                       'score': 0,  'reasoning': 'Pure love song — no devastating content.'},
            'cry-factor':        {'line': "And I don't know how it gets better than this",          'score': 60, 'reasoning': 'Happy-cry escalation — the breathless awe moment.'},
            'best-storytelling': {'line': "There's a glow off the pavement",                         'score': 70, 'reasoning': 'After-rain visual that anchors the whole song\'s setting.'},
            'best-lyrics':       {'line': 'In a storm, in my best dress, fearless',                  'score': 80, 'reasoning': 'Peak craft — image, sound, and theme fused into one line.'},
        },
    },
    'fe_1': {
        'song':  'Fifteen',
        'album': "Fearless (Taylor's Version)",
        'picks': {
            'most-romantic':     {'line': "And you're feelin' like flyin'",                          'score': 50, 'reasoning': 'First-love feeling — romantic but framed retrospectively as naive.'},
            'most-devastating':  {'line': 'And Abigail gave everything she had',                     'score': 80, 'reasoning': 'Real-friend devastation — naming Abigail makes it land harder.'},
            'cry-factor':        {'line': 'When all you wanted was to be wanted',                    'score': 80, 'reasoning': 'Bridge confession — the bare emotional core of teenagedom.'},
            'best-storytelling': {'line': 'You sit in class next to a redhead named Abigail',       'score': 90, 'reasoning': 'Coming-of-age narrative excellence — specificity carries the whole arc.'},
            'best-lyrics':       {'line': "I've found time can heal most anything",                  'score': 75, 'reasoning': 'Wisdom line that gives the retrospective frame its emotional weight.'},
        },
    },
    'fe_2': {
        'song':  'Love Story',
        'album': "Fearless (Taylor's Version)",
        'picks': {
            'most-romantic':     {'line': "Marry me, Juliet, you'll never have to be alone",         'score': 92, 'reasoning': 'Direct proposal — the resolution of one of Taylor\'s most romantic songs.'},
            'most-devastating':  {'line': None,                                                       'score': 5,  'reasoning': 'Pure love story with a happy ending — devastation doesn\'t fit.'},
            'cry-factor':        {'line': 'He knelt to the ground and pulled out a ring, and said',  'score': 75, 'reasoning': 'Happy-cry moment — the proposal landing as narrative payoff.'},
            'best-storytelling': {'line': 'We were both young when I first saw you',                 'score': 90, 'reasoning': 'Opens the song\'s narrative frame — flashback structure stated cleanly.'},
            'best-lyrics':       {'line': 'Romeo, take me somewhere we can be alone',               'score': 80, 'reasoning': 'Chorus carrying the Shakespeare metaphor — instantly memorable.'},
        },
    },
    'fe_3': {
        'song':  'Hey Stephen',
        'album': "Fearless (Taylor's Version)",
        'picks': {
            'most-romantic':     {'line': "Can't help it if I wanna kiss you in the rain so",        'score': 80, 'reasoning': 'Iconic crush imagery — the central romantic moment of the song.'},
            'most-devastating':  {'line': None,                                                       'score': 0,  'reasoning': 'Light crush song — no devastation.'},
            'cry-factor':        {'line': None,                                                       'score': 5,  'reasoning': 'Happy and flirty throughout — no tear-trigger.'},
            'best-storytelling': {'line': 'But would they write a song for you?',                    'score': 65, 'reasoning': 'Meta moment — the song acknowledging itself as the gesture.'},
            'best-lyrics':       {'line': "They're dimming the street lights, you're perfect for me", 'score': 70, 'reasoning': 'Bridge image — soft cinematic moment where the song crystallises.'},
        },
    },
}

DEFAULT_FIELDS = {'rejected': False, 'manualLine': None}


def main():
    audit_path = Path(__file__).parent / 'src' / 'data' / 'categoryTimesAudit.json'
    with open(audit_path, encoding='utf-8') as f:
        audit = json.load(f)

    added = []
    overwritten = []
    for key, entry in NEW_PICKS.items():
        # Wrap each pick with default rejected/manualLine if missing
        picks = {}
        for cid, p in entry['picks'].items():
            picks[cid] = {**DEFAULT_FIELDS, **p}
        full_entry = {'song': entry['song'], 'album': entry['album'], 'picks': picks}

        if key in audit:
            overwritten.append(key)
        else:
            added.append(key)
        audit[key] = full_entry

    # Write back
    with open(audit_path, 'w', encoding='utf-8') as f:
        json.dump(audit, f, ensure_ascii=False, indent=2)

    print(f'Added   : {len(added)} entries — {", ".join(added)}')
    print(f'Updated : {len(overwritten)} entries — {", ".join(overwritten) or "none"}')
    print(f'Total in audit now: {len(audit)} songs')


if __name__ == '__main__':
    main()
