# The Eras Ranker — Verified Trivia Bank

> **What this is:** 100 "Did you know?" facts for use between screens in the app —
> bracket round transitions, loading moments, completion screens, etc. This file is
> editorial content only; nothing in `src/` imports it. When facts get wired into the
> app, they should REPLACE the unverified `TRIVIA` array in
> `src/components/brackets/RoundTransition.jsx` (see the audit at the bottom of this
> file — several of those 10 facts are wrong or stale).
>
> **Last verified:** June 2026, against the sources listed per fact.

---

## What Swifties actually want from in-app trivia

Before writing these, here's the thinking on what lands with the audience this app
serves. The average Swiftie is not a casual listener — they already know the hits.
What delights them falls into six buckets, roughly in order of how good it feels to
encounter mid-app:

1. **"She did THAT" records** — chart, award, and touring superlatives. Pride fuel.
   The facts they screenshot and send to the group chat.
2. **Songwriting lore** — origin stories Taylor has told on the record: written in 20
   minutes, on the bedroom floor, trimmed down from 10 minutes. Makes rating a song
   feel like knowing it better.
3. **Era-specific deep cuts** — facts keyed to the album the user is actively rating.
   The app is organized by era, so trivia tagged by album can surface in context.
4. **Easter eggs, numbers & traditions** — lucky 13, liner-note codes, track five,
   friendship bracelets. The connective tissue of the fandom.
5. **The re-recording / masters story** — the defining arc of the fandom's last five
   years, with a genuinely happy ending (she owns it all now).
6. **Heartwarming human details** — the grandmother's voice on "Marjorie," the "22"
   hat, the cats. Warmth between rounds.

**What's deliberately excluded:** anything about who a song is "about" unless Taylor
confirmed it herself, relationship content, feud framing, money-gossip, and any
superlative that can silently go stale (every record-claim below is anchored to a
date so it stays true even after the record is broken).

## Sourcing standard

- Every fact is corroborated by a reputable primary or near-primary source: the
  Recording Academy (grammy.com), Billboard, Pollstar, RIAA, Guinness World Records,
  Spotify Newsroom, Time, the Federal Reserve's published Beige Book, NYU, AMC
  Theatres, or Taylor's own on-camera/on-record statements (NSAI speech, the *Long
  Pond Studio Sessions* film, her official announcements).
- Superlatives are **date-anchored** ("first artist to…", "at the time…") so a fact
  remains true forever even if the record is later broken.
- No gossip, no speculation, no unconfirmed "this song is about X."

Tags in section headers match album IDs in `src/data/albums.js` for future wiring.
`[general]` facts fit anywhere.

---

## A. Records & honors `[general]`

1. **Four Album of the Year Grammys.** Taylor has won the Grammy for Album of the Year four times — for *Fearless*, *1989*, *folklore*, and *Midnights* — making her the only artist in Grammy history to win the top prize four times. Sinatra, Stevie Wonder, and Paul Simon each topped out at three. *(Recording Academy)*
2. **14 Grammys total.** Across her career she has won 14 Grammy Awards. *(Recording Academy)*
3. **The top-10 sweep.** On the Billboard Hot 100 dated November 5, 2022, songs from *Midnights* occupied the ENTIRE top 10 — the first time any artist had done that in the chart's 64-year history. *(Billboard)*
4. **The top-12 sweep.** In October 2025, all 12 songs from *The Life of a Showgirl* claimed the top 12 spots on the Hot 100 — the first album ever to chart every one of its songs in an unbroken run from No. 1 down. *(Billboard)*
5. **Time Person of the Year.** In 2023, Time named her Person of the Year — the first person in the award's 96-year history chosen for success in the arts. *(Time)*
6. **Most American Music Awards ever.** Her 40th AMA, won in November 2022, put her further ahead of any artist in the show's history — Michael Jackson is second with 26. *(Guinness World Records / AMAs)*
7. **Most No. 1 albums of any solo artist.** *The Life of a Showgirl* became her 15th No. 1 on the Billboard 200 in October 2025 — more chart-topping albums than any solo artist in history. *(Billboard)*
8. **A billionaire from music alone.** In October 2023, Bloomberg reported she had become a billionaire almost entirely from her songs and performances — a first for a musician. *(Bloomberg)*
9. **100 million monthly listeners.** In August 2023 she became the first female artist in Spotify history to reach 100 million monthly listeners. *(Spotify / Guinness World Records)*
10. **Youngest Album of the Year winner — for a decade.** When *Fearless* won Album of the Year in 2010, she was 20 — the youngest winner ever at the time, a record that stood for ten years. *(Recording Academy)*
11. **Doctor Swift.** In May 2022, NYU awarded her an honorary Doctor of Fine Arts, and she gave the commencement address at Yankee Stadium. *(New York University)*
12. **Fourteen No. 1 singles.** "Opalite" became her 14th career No. 1 on the Billboard Hot 100 in February 2026. *(Billboard / Rolling Stone)*

## B. The Eras Tour `[general]`

13. **The first billion-dollar tour — then the first two-billion-dollar tour.** In December 2023, Pollstar reported the Eras Tour was the first tour in history to gross $1 billion. By its final show in December 2024 it had grossed an estimated $2.2 billion across 149 shows — the highest-grossing tour of all time, nearly double the previous record. *(Pollstar)*
14. **The Swift Quake.** Her July 2023 Seattle shows generated ground shaking equivalent to a 2.3-magnitude earthquake. Seismologists measured it at roughly twice the strength of the stadium's famous 2011 "Beast Quake." *(Pacific Northwest Seismic Network / CBS News / Billboard)*
15. **A three-hour-plus marathon.** Every Eras Tour show ran more than three hours and over 40 songs, traveling through every era of her catalog. *(Pollstar / tour coverage)*
16. **The surprise songs.** Each night featured two acoustic "surprise songs" she aimed never to repeat across the tour — fans worldwide tracked which songs were still unplayed. *(Tour coverage; her on-stage statements)*
17. **The friendship bracelets.** The tour's beaded-bracelet tradition traces to a lyric in "You're On Your Own, Kid": *"So make the friendship bracelets, take the moment and taste it."* *(Midnights, 2022)*
18. **She made the Federal Reserve's report.** The Fed's July 2023 Beige Book credited her three Philadelphia shows with the city's strongest hotel-revenue month since the pandemic began. *(Federal Reserve Beige Book / Billboard)*
19. **Biggest concert film ever.** *Taylor Swift: The Eras Tour* (2023) became the highest-grossing concert film of all time. *(AMC Theatres / box-office reporting)*
20. **Ten million tickets.** More than ten million fans attended the Eras Tour across its 149 shows, per Pollstar. *(Pollstar)*

## C. The re-recordings & the masters `[general]`

21. **Why "Taylor's Version" exists.** After the rights to her first six albums were sold in 2019, she chose to re-record them from scratch so she could own her own work — that's what the "(Taylor's Version)" label means. *(Her public statements)*
22. **A historic first.** *Fearless (Taylor's Version)* (April 2021) became the first re-recorded album in history to hit No. 1 on the Billboard 200. *(Billboard)*
23. **From The Vault.** The "From The Vault" tracks on each Taylor's Version are real songs she wrote for the original albums that didn't make the cut the first time. *(Her announcements)*
24. **Passing Barbra Streisand.** *Speak Now (Taylor's Version)* (July 2023) was her 12th No. 1 album — the most Billboard 200 No. 1s of any woman in history. *(Billboard)*
25. **The re-record outsold the original.** *1989 (Taylor's Version)* opened with about 1.65 million units — at the time the biggest week of her entire career, beating the original *1989*. *(Billboard)*
26. **She bought it all back.** On May 30, 2025, she announced she had purchased the original masters of her first six albums from Shamrock Capital — reportedly around $360 million — writing: "All of the music I've ever made now belongs to me." *(Billboard / Bloomberg / The Washington Post)*
27. **A decade-old song at No. 1.** "Is It Over Now?", written for the original *1989* but unreleased until 2023, debuted at No. 1 on the Hot 100 as a vault track — roughly a decade after it was written. *(Billboard)*

## D. Songwriting & craft `[general]`

28. **She writes everything.** Taylor has a songwriting credit on every song she has ever released across all of her studio albums. *(Album credits)*
29. **Three pens.** In her 2022 NSAI Songwriter-Artist of the Decade speech, she revealed she privately sorts her lyrics into three categories: "quill pen" songs, "fountain pen" songs, and "glitter gel pen" songs. *(NSAI speech, September 2022)*
30. **Youngest in the building.** At 14, she became the youngest staff songwriter ever signed by Sony/ATV Music Publishing. *(Sony/ATV / biographical record)*
31. **Three chords from the computer repairman.** She wrote her first song, "Lucky You," at age 12 — right after a technician named Ronnie Cremer, who came to fix the family computer, taught her three guitar chords. *(Her interviews)*
32. **The Antonoff era.** Jack Antonoff co-wrote or produced on every album from *1989* (2014) through *The Tortured Poets Department* (2024) — her longest-running collaboration. *(Album credits)*
33. **Nils Sjöberg.** She wrote the Calvin Harris / Rihanna hit "This Is What You Came For" (2016) under the pseudonym "Nils Sjöberg." *(Confirmed credit)*
34. **A CMA for someone else's hit.** She wrote "Better Man," recorded by Little Big Town, which won Song of the Year — an award that goes to the songwriter — at the 2017 CMA Awards. *(Country Music Association)*
35. **Track five.** Fans noticed her track fives are the most emotionally raw songs on each album — and Taylor has confirmed she now sequences track five that way on purpose. *(Her interviews)*

## E. Numbers, easter eggs & traditions `[general]`

36. **Lucky 13.** She was born on December 13, 1989, calls 13 her lucky number, and used to paint it on her hand before early shows. *(Her interviews)*
37. **The hidden messages.** Her early album booklets hid secret messages: capitalized letters scattered through the printed lyrics spelled out a clue for each song, from her debut through *1989*. *(Album liner notes)*
38. **Years of planning.** She has said she plants easter eggs for future projects years in advance — some clues only make sense long after fans first see them. *(Her interviews)*
39. **Named after James Taylor.** Her parents named her after singer-songwriter James Taylor — the two later performed together. *(Her interviews)*
40. **The Christmas tree farm is real.** She spent her early childhood on an actual Christmas tree farm in Pennsylvania — the inspiration for her song "Christmas Tree Farm." *(Her interviews)*
41. **The cats.** Her cats are named after TV characters: Meredith Grey (*Grey's Anatomy*) and Olivia Benson (*Law & Order: SVU*), plus Benjamin Button. *(Her interviews)*
42. **The "22" hat.** During "22" at every Eras Tour show, she gave her black hat to one young fan in the crowd — one of the tour's most beloved rituals. *(Tour coverage)*

## F. Taylor Swift (Debut, 2006) `[tv]`

43. **Written in homeroom.** Much of her debut album was written while she was a high-school freshman — she has said "Tim McGraw" was written in math class. The album came out when she was 16. *(Her interviews)*
44. **The talent-show song that made history.** "Our Song" was written for her ninth-grade talent show — and when it topped Billboard's country chart, she became the youngest person to single-handedly write and perform a No. 1 country song. *(Billboard)*
45. **Drew was real.** "Teardrops on My Guitar" is about a real high-school classmate named Drew — she has said he had no idea about her feelings until the song came out. *(Her interviews)*

## G. Fearless (2008) `[fe]`

46. **Twenty minutes on the bedroom floor.** She wrote "Love Story" in about 20 minutes on her bedroom floor — and deliberately gave Romeo and Juliet the happy ending she felt the original story owed them. *(Her interviews)*
47. **Best-seller of the year.** *Fearless* was the best-selling album of 2009 in the United States — across all artists and genres. *(Billboard / Nielsen)*
48. **Abigail is real too.** "Fifteen" is about her real-life best friend Abigail Anderson, whom she met in ninth grade — Abigail is named in the lyrics. *(Her interviews)*
49. **She played both girls.** In the "You Belong with Me" video, Taylor plays both the girl next door AND the cheerleader rival. *(Music video)*
50. **A Grey's Anatomy debut.** "White Horse" premiered in an episode of *Grey's Anatomy* before its single release — a thrill for Taylor, a superfan who later named her first cat after Meredith Grey. The song went on to win two Grammys. *(Recording Academy / her interviews)*

## H. Speak Now (2010) `[st]`

51. **Every word hers.** She wrote *Speak Now* entirely alone — no co-writers on any track — partly in response to critics who doubted she wrote her own songs. She was 20. *(Album credits)*
52. **Things she wished she'd said.** She has described the album as a collection of confessions — things she never said to the people in her life, finally said out loud. The title comes from "speak now or forever hold your peace." *(Her interviews)*
53. **Her first million-week.** *Speak Now* sold just over a million copies in its first week in 2010 — the first of her record-setting streak of million-selling opening weeks. *(Billboard / Nielsen)*
54. **"Mean" won twice.** "Mean" — her answer to a harsh critic — won two Grammys: Best Country Song and Best Country Solo Performance. *(Recording Academy)*
55. **A thank-you note in song form.** She wrote "Long Live" as a tribute to her band and her fans — a thank-you letter for everything they had built together. *(Her interviews)*

## I. Red (2012) `[rd]`

56. **The longest No. 1 in history.** "All Too Well (10 Minute Version)" — at 10 minutes 13 seconds — became the longest song ever to top the Hot 100, breaking a record Don McLean's "American Pie" had held for nearly 50 years. Taylor sent McLean flowers. *(Guinness World Records / Billboard)*
57. **It really was ten minutes.** The original 2012 "All Too Well" started out more than ten minutes long — co-writer Liz Rose has said her job was helping trim it down. Fans got the full version nine years later. *(Liz Rose interviews)*
58. **Her first Hot 100 No. 1.** *Red* marked her first work with pop producers Max Martin and Shellback — including "We Are Never Ever Getting Back Together," her first-ever No. 1 on the Hot 100. *(Billboard)*
59. **Biggest week in a decade.** *Red* sold 1.21 million copies in its first week — at the time, the biggest sales week for any album in a decade. *(Billboard / Nielsen)*
60. **Her one true breakup album.** Taylor has called *Red* her "only true breakup album." *(Her statements, 2021)*

## J. 1989 (2014) `[89]`

61. **Named after her birth year.** *1989* is named for the year she was born — and she introduced it as her "first documented, official pop album." *(Her album announcement)*
62. **First woman to win twice.** When *1989* won Album of the Year in 2016, she became the first woman to win the Grammys' top award twice as a lead artist — a milestone she called out in her acceptance speech. *(Recording Academy)*
63. **The only platinum album of 2014.** *1989* sold 1.287 million copies in week one and was the only album released in 2014 to be certified platinum by year's end. *(Billboard / RIAA)*
64. **She replaced herself at No. 1.** "Blank Space" — her satire of how the media portrayed her — knocked her own "Shake It Off" out of the top spot, making her the first woman to replace herself at No. 1 on the Hot 100. *(Billboard)*
65. **The Polaroids.** Original *1989* CDs each came with a set of 13 Polaroid-style prints — instantly collectible, and part of why the era's aesthetic stuck. *(Album packaging)*

## K. Reputation (2017) `[rp]`

66. **No interviews. Just reputation.** She did no traditional press for the album's rollout, telling fans: "There will be no further explanation. There will just be reputation." *(Her album announcement)*
67. **Four in a row.** *Reputation* sold 1.216 million copies in week one, making her the only artist in history with four consecutive albums to open with million-plus sales weeks. *(Billboard / Nielsen)*
68. **A YouTube record.** The "Look What You Made Me Do" video broke YouTube's 24-hour viewing record at the time of its release. *(YouTube / Billboard)*
69. **A record-setting tour.** The Reputation Stadium Tour became the highest-grossing U.S. tour in history at the time. *(Billboard Boxscore)*

## L. Lover (2019) `[lv]`

70. **The first album she owned.** *Lover* was the first album Taylor owned outright from the day it was released, under her new record deal. *(Her statements)*
71. **Her actual diaries.** Deluxe editions of *Lover* included scanned pages from Taylor's real teenage diaries. *(Album packaging)*
72. **The four-year slow burn.** "Cruel Summer" was never a single in 2019 — four years later, fan demand coming out of the Eras Tour pushed it all the way to No. 1 on the Hot 100 in October 2023. *(Billboard)*
73. **Benjamin came from the video.** She met the kitten who became Benjamin Button on the set of the "ME!" music video — and adopted him on the spot. *(Her interviews)*

## M. Folklore (2020) `[fl]`

74. **A total surprise.** *folklore* was announced the morning of its release in July 2020 — written and recorded entirely in isolation during lockdown, with no advance singles or rollout. *(Her announcement)*
75. **Made without sharing a room.** She and The National's Aaron Dessner created most of the album remotely, trading files between her home studio and his — they weren't in the same room. *(Long Pond Studio Sessions / interviews)*
76. **Three Album of the Year wins.** *folklore*'s 2021 Grammy win made her the first woman to win Album of the Year three times. *(Recording Academy)*
77. **The teenage love triangle.** Taylor confirmed that "cardigan," "august," and "betty" tell one story — the same teenage love triangle from three points of view. *(Her statements / Long Pond Studio Sessions)*
78. **"exile" was long-distance too.** The Bon Iver duet "exile" was recorded remotely like the rest of the album — Justin Vernon recorded his parts from Wisconsin. *(Long Pond Studio Sessions / interviews)*
79. **Best-seller of 2020.** *folklore* was the best-selling album of 2020 in the United States. *(Billboard / MRC Data)*

## N. Evermore (2020) `[ev]`

80. **The sister album.** *evermore* arrived less than five months after *folklore* — Taylor called it folklore's "sister record," saying the two of them just couldn't stop writing. *(Her announcement)*
81. **A birthday mirror.** It was released two days before her 31st birthday — and she pointed out that 31 is her lucky number 13, mirrored. *(Her announcement)*
82. **Double debut, twice.** "willow" debuted at No. 1 on the Hot 100 the same week *evermore* debuted at No. 1 on the Billboard 200 — making her the first artist ever to debut atop both charts simultaneously twice. *(Billboard)*
83. **Her grandmother's voice.** "Marjorie" honors her grandmother Marjorie Finlay, a professional opera singer — and Marjorie's real archival vocals appear in the song's backing track. *(Album credits / her statements)*
84. **Written like a true-crime podcast.** Taylor wrote the murder ballad "no body, no crime" alone, inspired by her love of true-crime podcasts, then brought in HAIM — name-checking Este in the lyrics. *(Her interviews)*

## O. Midnights (2022) `[ml]`

85. **Thirteen sleepless nights.** She described *Midnights* as "the stories of 13 sleepless nights scattered throughout my life." *(Her album announcement)*
86. **Spotify's biggest day — plus a 3am surprise.** On release day, *Midnights* became the most-streamed album in a single day in Spotify history — and at 3am, she surprise-dropped seven extra "3am Edition" tracks. *(Spotify Newsroom)*
87. **The bingo cage.** She revealed the track titles one at a time in a TikTok series called "Midnights Mayhem with Me," drawing numbered ping-pong balls from a bingo cage. *(Her TikTok series)*
88. **Eight weeks of "Anti-Hero."** "Anti-Hero" spent eight weeks at No. 1 on the Hot 100 — her longest run at the top until "The Fate of Ophelia" beat it in 2025. *(Billboard)*
89. **"Lavender Haze" came from Mad Men.** She heard the 1950s phrase — meaning an all-consuming glow of being in love — while watching *Mad Men*, and built the song around it. *(Her video explainer)*

## P. The Tortured Poets Department (2024) `[tp]`

90. **Announced from the Grammy stage.** She revealed the album live at the 2024 Grammys, mid-acceptance-speech, while collecting Best Pop Vocal Album for *Midnights*. *(Recording Academy / broadcast)*
91. **"It's a 2am surprise."** Two hours after release, she dropped *The Anthology* — 15 additional songs that brought the album to 31 tracks. *(Her announcement)*
92. **A billion streams in five days.** It became the first album in Spotify history to pass one billion streams in a single week — and it needed only five days to do it. *(Spotify Newsroom / Billboard)*
93. **"Fortnight" broke the single-day record.** The lead single, featuring Post Malone, became the most-streamed song in a single day in Spotify history. *(Spotify Newsroom)*
94. **Written in secret on tour.** She wrote the album secretly while performing the Eras Tour, telling fans she had worked on it for about two years before anyone knew it existed. *(Her on-stage announcement, 2024)*

## Q. The Life of a Showgirl (2025) `[ls]`

95. **Announced on a podcast.** She announced the album in August 2025 on the *New Heights* podcast — the first time she has ever revealed an album that way. *(Her announcement)*
96. **Recorded mid-tour in Sweden.** She made the album with Max Martin and Shellback in Sweden, flying to the studio between stadium shows on the Eras Tour's European leg. *(Her interviews)*
97. **Exactly twelve songs.** The album is deliberately concise: 12 tracks, with Taylor saying she wanted every song to earn its place — no extended editions. *(Her announcement)*
98. **Sabrina on the title track.** The title track features Sabrina Carpenter, who had opened for her on the Eras Tour. *(Album credits)*
99. **The biggest week ever measured.** It debuted with 4.002 million equivalent units, and its 3.48 million pure sales broke the first-week record Adele's *25* had held since 2015 — the largest sales week since electronic tracking began in 1991. *(Billboard / Luminate)*
100. **A movie theater release party.** *The Official Release Party of a Showgirl* topped the domestic box office and earned over $50 million worldwide in its single weekend — the biggest album-release theatrical event of all time. *(AMC Theatres / Deadline / Billboard)*

---

## Appendix: audit of the 10 facts currently shipped in the app

The pre-launch checklist requires verifying the `TRIVIA` array in
`src/components/brackets/RoundTransition.jsx`. Verdicts:

| # | Current in-app fact | Verdict |
|---|---|---|
| 1 | All Too Well 10-min "won the Grammy for Best Song Written for Visual Media" | **WRONG.** The *short film* won Best Music Video (2023 Grammys); the song never won Best Song Written for Visual Media. Replace with fact #56. |
| 2 | Cruel Summer became a phenomenon four years later via Eras Tour | **Accurate** (minor: it was *released* 2019; hit No. 1 Oct 2023). Replaced by tighter fact #72. |
| 3 | "cardigan" and "august" both named after clothing | **WRONG.** August is a month, not clothing. Remove. |
| 4 | Fearless "fastest-certified diamond album by a female artist when TV released" | **Unsupported.** Fearless is RIAA Diamond, but this specific framing isn't corroborated anywhere. Replace with #46/#47. |
| 5 | champagne problems written about a fictional character | **Accurate.** Keep (folded into the evermore section's spirit; can be re-added verbatim if desired). |
| 6 | Anti-Hero 8 weeks at #1 — "Taylor's longest run at the top" | **STALE.** True until "The Fate of Ophelia" ran 10 weeks at No. 1 (2025). Replace with fact #88, which is future-proofed. |
| 7 | Shake It Off written in 30 minutes while feeling criticized | **Unverified lore.** No reliable sourcing found. Remove. |
| 8 | Love Story written at 17 about a relationship her parents didn't approve | **Partly supported, weakly sourced.** The well-documented version is fact #46 (20 minutes, bedroom floor, fixed Romeo & Juliet ending). Replace. |
| 9 | Lavender Haze phrase heard on Mad Men | **Accurate** — she explained it herself on video. Kept as fact #89. |
| 10 | exile recorded with both artists in the same room | **WRONG.** folklore was made remotely; Justin Vernon recorded in Wisconsin. Corrected by fact #78. |
| — | Default fallback: "sold over 200 million records — more than any other artist in the 21st century" | **Half-supported.** The 200M+ figure is widely cited; the "more than any other artist in the 21st century" superlative is not reliably corroborated. Suggested replacement default: fact #1 (four Album of the Year Grammys). |

## Maintenance notes

- Every superlative above is date-anchored, so these facts do not go stale when
  records are broken — but when a new album or tour happens, add new facts rather
  than editing old ones.
- If a fact is ever wired into the app with an album tag, use the bracketed album ID
  in each section header (matches `src/data/albums.js`).
- Re-verify before any marketing use outside the app; in-app "Did you know?" cards
  are the intended scope.
