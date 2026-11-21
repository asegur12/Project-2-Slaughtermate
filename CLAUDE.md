# CLAUDE.md: standing rules for every session

## Project
**Magic Rush** (called Slaughtermate until Round 4) is a fantasy medieval hack'n'slash game for
CSC299 (project 2 of 3), developed in rounds. The original chess look is still available as an
optional theme (R62).

- `Project_2.txt` is the source problem statement with the Round 1 and 2 requirements. The user
  has added later rounds' requirements elsewhere:
  - Round 3: the "==ROUND 3 RUN==" section of `handoff-round-2.md`.
  - Round 4: the "==ROUND 4 CHANGES AND ADDITIONS==" section of `handoff-round-3.md`.
  - Round 5: the "==ROUND 5 CHANGES AND ADDITIONS==" section of `handoff-round-4.md`.

  Check `spec.md`'s source list for where each round came from. The user's prompt may mention a
  `problem.md`; it doesn't exist. Look in the latest handoff file and ask if the requirements
  aren't there.
- `Project_2_CLAUDE_rules.txt` holds the client's agent rules (Rule 1–10). Rules 2 and 9 (chess
  designs, chess UI) now apply only to the chess theme (see `spec.md`).
- `spec.md` is the numbered requirement list (R1, R2, ...) derived from them.

## Source of truth
- Use only what is in this repository. If a requirement file seems to be missing, ask the user;
  don't search elsewhere or guess, unless the user names a place to look.
- Read `spec.md`, `docs/decisions/` and the latest `handoff-round-N.md` before starting a round.
- Requirement IDs never change. A requirement that a later round changes keeps its ID and gets an
  "Amended in Round N" note in `spec.md`. New requirements continue the numbering.
- If a new requirement is unclear, ask the user and wait for answers before writing code.

## Hard constraints on the game
- The whole game stays in one offline file, `index.html` (inline CSS and JS, no external URLs,
  no network calls). R16 and Rule 5 require this, and `tests/round1.test.js` (R16) checks it.
- `desktop/build.ps1` embeds `index.html` into `dist\MagicRush.exe`. Don't add extra runtime
  files the launcher wouldn't ship. The launcher's data folder stays
  `%LOCALAPPDATA%\Slaughtermate` so old saves carry over. Don't rename it.
- Controls in Rule 6 must keep working: WASD to move, left click to attack, hold left click to
  charge, and number keys for spells (1–5 since R76). Space is the dash (R32). Esc pauses and
  closes the shop cart (R47).
- Rebuild the exe (`powershell -ExecutionPolicy Bypass -File desktop\build.ps1`) after changing
  `index.html`. `dist\` is git-ignored, so the exe is local only.
- localStorage keys keep their `slaughtermate_` prefix: `scores`, `name`, `logbook`, `crowns`,
  `look`, and since Round 5 `bells`, `gmcrowns`, `bestiary` and `face`. Renaming them would wipe
  players' saves.

## Code conventions in `index.html`
- Line endings: the repository stores **LF**, but `core.autocrlf=true` makes the working copy
  **CRLF**. Scripts that patch files must handle CRLF (normalise to LF, edit, write back as CRLF).
  Git's LF→CRLF warnings are harmless.
- **Two looks (R55/R62, `docs/decisions/0005`):**
  - The global `LOOK` is `'fantasy'` (the default) or `'chess'`. Only drawing and user-facing text
    may depend on it. Gameplay, stats and AI must not.
  - Code that runs only for one look must never call `Math.random()`. That would change the
    shared random sequence, and the R55 test compares the two themes' enemy behaviour.
  - Pick texts with `L(fantasyText, chessText)`. Every new piece of art or text needs both
    versions.
  - The internal names are still the chess ones: enemy types `pawn`…`king`, `FORMS`, `P.form`,
    `FLOOR_THEMES` (the chess floors). Fantasy looks come from lookup tables: `ENEMY_LOOK`,
    `BOSS_LOOK`, `CLASS_OF`/`playerClass()`, `RANKS`/`rankName()`, `bossName()` and
    `FANTASY_FLOORS` (which copy the chess floors' structure counts). `themeFor()` picks the floor
    list.
  - Fantasy figures are drawn by `drawFigure(kind, x, y, s, o)` using the `FIG` table. Chess
    pieces still use `drawPiece`.
- **Currency:** the internal field is `P.gold`, and the pickup kind is still `'frag'`.
  - Fantasy text says "gold" (gold bars, R64). Chess text says "fragments" and never "gold" (R48).
  - Use `money(n)` for HTML and `drawLoot(...)` on the canvas. Don't call `drawShard` or
    `drawGoldBar` directly.
- `SPELLS` holds tiers 1–5 only: exactly 75 spells, 15 per tier, one per element (R33). The
  Grandmaster spells (tier 6, currently 9) are in `GM_SPELLS`. Use `ALL_SPELLS` / `SPELL_BY_ID`
  for "every spell" (see `docs/decisions/0003`).
- **Grandmaster spells are timed rituals in `G.rituals`.** They are created in the
  `castGrandmaster` switch, advanced in `updateRituals`, and drawn by `drawRitualGround` (under
  the units) and `drawRituals` (above them). A new Grandmaster spell needs a `GM_SPELLS` entry
  plus a case in each of these.
- **Boss Grandmaster spells (R82, `docs/decisions/0006`):** the Grandmaster casts the same rituals
  with `foe:true` through `bossGM`, and `updateRituals` has a `foe` branch that hurts the player.
  A new Grandmaster spell also needs a foe version, or must stay out of `GM_FOE_SPELLS`. Tier 1–5
  boss spells go through `bossCast` (telegraphed enemy attacks).
- **Pinned lists:** earlier tests require that `FLOOR_THEMES`, `BOSSES` and `SPAWN_W` keep 6
  entries, that `ENEMY_LOOK` keeps its 6 keys, and that `Object.keys(AI)` stays
  `pawn,knight,bishop,rook,queen,watchtower,king`.
  - Put new enemies in `AI5`/`EXTRA_LOOK` (looked up through `enemyFig()`).
  - Put new floors behind `themeFor()`/`bossDef()`. Floor 7 is `DOMAIN_THEME`.
  - Build new bosses as separate definitions with `makeBoss`.
  - `pieceLook()` is the "draw enemies as chess pieces" check (the chess theme, or floor 7). Use
    it instead of `LOOK==='chess'` for enemies.
- **Weapons:** weapon damage is `wdmg()`, which includes the weapon tier (R86). Tier 1 of every
  weapon must keep its pre-Round 5 behaviour, which older tests check.
- Every player damage shape (`damageCircle`/`Arc`/`Rect`/`Line` and player projectiles) calls
  `pokeMerchants`, so a new damage path should too (R77).
- Level-up cards have three types: `'spell'`, `'gm'` and `'stat'`.
- Spell visuals go through the element helpers: `elPart`, `elementFx`, `elRing`, `elLine`, and
  `glint` for white glints. Area effects go through `drawArea(el, ...)`. A spell must not emit
  `'spark'` particles in its element colour (R36–R45). The plain `sparkle`/`sparkRing`/`sparkLine`
  are for enemy and weapon effects only.
- Spell icons (R65) come from the `ICONS` table: `drawIcon` on the canvas, `iconSVG` in the HTML,
  and `spellIcon(d)` to choose the icon.
- Enemy and boss attacks read `edmg(e)` / `edmg(b)`, not `e.dmg`, so that weakening (R52) applies.
  Call `damagePlayer(d, source)` with the attacking enemy as `source`, because Fog of the
  Nightmare (R72) needs it. `shootE`/`hzCircle`/`hzLine` record the source automatically
  through `curShooter`.
- Anything that loops over enemies should decide how to treat enemies that are mind-controlled
  (`e.charmT>0`), asleep (`e.sleepT>0`), static towers (`e.static`), sweeping rook-wall rooks
  (`e.sweep`), enraged (`e.kamikaze>0`), or a dying Grandmaster (`e.dying>=0`).
- The real canvas throws on negative `arc`/`ellipse` radii, but the test stub doesn't. Keep radii
  positive and check new visuals in a real browser. Additive blending (`'lighter'`) of yellow on
  the green floors turns lime, so avoid it there.

## Tests
- Run with `npm test` (same as `node --test tests/`). No npm dependencies; keep it that way
  unless the user agrees.
- Every test name starts with the requirement ID(s) it checks, e.g. `test('R27 ...')`.
- All earlier rounds' tests must still pass at the end of a round.
- New requirements get tests, preferably written and committed before the implementation.
- If a later requirement changes behaviour that an older test pins down, update only that
  assertion, add an "Amended in Round N" comment, and tell the user.
- Tests of chess-only requirements load the chess theme:
  `loadGame({ seed, storage: { slaughtermate_look: 'chess' } })`. The default is fantasy.
- How the harness works (`tests/harness.js`, `docs/decisions/0001`):
  - Tests run the real game script inside a Node `vm` with a stubbed DOM and canvas.
  - Tests evaluate global names (`G`, `P`, `spawnEnemy`, ...), so renaming a top-level function
    or state field breaks tests even if the game still works.
  - `var`/`let` declarations inside `g.run(...)` share the game's global scope. A name like `L`,
    `G`, `P` or `T` clashes with a game global and throws. Use longer test variable names.
  - Arrays returned from the `vm` come from another realm, so compare
    `JSON.stringify(...)` / `.join()` output instead of using `deepEqual`.
  - `step()` mimics `frame()`: update, then the camera follows the player. Effects only spawn
    on-screen. `startRun()` doesn't set the camera, so call `aimAt()` or set `cam` before
    testing anything that checks `onScreen`.
  - Stub DOM elements keep their children across re-renders. For example, `shSpells` and `shGm`
    accumulate cards with each `renderShop()`.
- Visual check:
  - Use headless Edge (`msedge --headless=new --window-size=1280,800
    --virtual-time-budget=1500 --user-data-dir=<scratch> --screenshot=out.png file:///…`) on a
    scratch copy of `index.html` with a scenario script injected. Never edit the real file for
    this.
  - Set `slaughtermate_look` in a script that runs before the game script to choose the theme.
  - Check both themes.
  - `--virtual-time-budget` can freeze forever on scenes with many boss telegraphs on screen. This
    is a headless quirk, not a game hang. Use `--timeout=2500` for those scenes, and give every
    Edge call a process timeout.
  - The cart and the portal appear at the map centre, where the player starts. Move the player
    away first, or the shop opens.
  - To test the Grandmaster's face, pass random images from
    `C:\Users\aidan\OneDrive\Pictures\Reaction images` through `setFace`. The user asked for this.

## Tooling on this Windows machine
- In the Bash tool, heredocs containing emoji fail, and so do long heredocs with many quotes. Write
  scripts to the scratchpad with the Write tool and run them from there.
- `VAR=x cmd "$VAR"` in one command expands `$VAR` before it is assigned.
- Edge is at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Python has no Pillow. To make a contact sheet, screenshot an HTML grid of the PNGs with Edge.

## Git
- Never undo, amend, rebase or force-push a commit. Fix forward with a new commit.
- Commit in small steps. Messages say what changed and why.
- End commit messages with the attribution line the session provides.
- Push only when the user asks.
- Don't commit handoff files or this file until the user has reviewed them and asks for a commit.
  The permission check may refuse such a commit unless the user's message explicitly asks for it.

## Decision records
- Store them in `docs/decisions/NNNN-short-title.md`, numbered 0001, 0002, ...
- Write each as a Y-statement: "In the context of …, facing …, we decided for … and neglected …,
  to achieve …, accepting …".
- Write at least one per round, for a decision that had real alternatives.

## End of a round
- List for the user every decision made that they didn't ask for.
- Write `handoff-round-N.md` only when the user asks for it.
