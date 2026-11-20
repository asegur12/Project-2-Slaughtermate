# 0005. Make the fantasy and chess looks a render-time switch over one shared game

- Status: accepted
- Date: 2026-11-20
- Round: 4
- Requirements: R55–R64 (fantasy theme, Magic Rush), R62 (switch back to the chess theme), with
  R1, R4–R6, R19–R26, R46 and R48 (the chess look and the earlier gameplay)

## Context

Round 4 replaces every chess part of the game with a fantasy medieval look: class-based player
figures, goblins and skeletons, new bosses, six new maps, a new UI, gold bars and a new name. It
also asks for a start-screen button that switches back to the chess theme, and says enemy
behaviour stays the same. The earlier rounds' tests and code use the chess type names
everywhere: `pawn` … `king` in `ETYPES`, `AI`, `BOSSES`, `SUMMONS` and `FORMS`, `FLOOR_THEMES` for
the floors, and `P.gold` for the currency.

## Options considered

1. **One global `LOOK` ('fantasy' or 'chess'), read only by drawing and text code.** Internal type
   names, AI, stats, floors' structure counts and random numbers stay shared. Fantasy art is
   chosen through lookup tables (`ENEMY_LOOK`, `BOSS_LOOK`, `CLASS_OF`, `RANKS`, `FANTASY_FLOORS`)
   and drawn by `drawFigure`. Texts go through a small helper, `L(fantasy, chess)`. (chosen)
2. **Rename everything to fantasy names** (`goblin`, `skeleton` …) and rebuild chess as the
   special case. The code would read better in fantasy terms, but every AI branch, every test
   and the R4/R5 behaviour checks would change, and the chess theme would need a reverse mapping
   anyway.
3. **Two separate games or files** (`index.html` plus a chess copy). Each would be simple, but the
   two would drift apart with every change. It also breaks R16/Rule 5's single offline file and
   the launcher, which embeds exactly one page.
4. **A full theme object holding every colour, string and draw function**, swapped as a whole.
   It's the cleanest separation, but it means routing hundreds of scattered strings and draw
   calls through one object for a single toggle. That's a lot of churn in a single-file game.

## Decision (Y-statement)

In the context of **reskinning a chess hack'n'slash into a fantasy one while keeping the chess
look one button away**, facing **chess type names baked into the AI, data and tests, and a
requirement that behaviour stays the same**, we decided for **a single `LOOK` switch that only
the renderer and the UI text read, with lookup tables from the internal chess types to fantasy
figures, ranks, boss names and floors**, and neglected **renaming the internals, maintaining two
copies of the game, and a full theme object**, to achieve **identical gameplay and random
sequences in both themes (checked by test R55), untouched AI and earlier tests, and one offline
file**, accepting **that internal names no longer match what the player sees (a 'pawn' is drawn
as a goblin, `P.gold` and pickup kind `'frag'` hold gold in fantasy), that drawing and text code
has `LOOK` branches, and that tests for chess-only requirements must switch to the chess theme
first**.

## Consequences

- `FLOOR_THEMES` stays the chess list. `FANTASY_FLOORS` copies each chess floor's castles, towns,
  houses, towers and maze flag, so map generation, difficulty and R20–R25's layouts are unchanged.
  `themeFor()` picks the list for the current look.
- Decorations (trees, gnomes, shelves, gems, statues…) don't block movement. They come from a
  generator seeded by the map layout and never call `Math.random()`, so turning the theme on or
  off doesn't change the game's random sequence.
- The chess theme restores the Round 3 look and text, including the name Slaughtermate and
  fragments. Death animations differ by look: pieces shatter, figures fall over and poof.
- The choice is saved under `slaughtermate_look`. The other storage keys and the launcher's data
  folder keep their Slaughtermate names, so earlier saves carry over to Magic Rush.
- Older tests that check the chess look (R1, R19, R26, R48) load with the chess theme and carry an
  "Amended in Round 4" note.
