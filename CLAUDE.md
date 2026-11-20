# CLAUDE.md: standing rules for every session

## Project
Slaughtermate is a chess-themed hack'n'slash game for CSC299 (project 2 of 3), developed in rounds.

- `Project_2.txt` is the source problem statement with the Round 1 and 2 requirements. Later
  rounds' requirements have been added by the user elsewhere: Round 3's are in the
  "==ROUND 3 RUN==" section of `handoff-round-2.md`. Check `spec.md`'s source list for where each
  round came from.
- `Project_2_CLAUDE_rules.txt` holds the client's agent rules (Rule 1–10).
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
- `desktop/build.ps1` embeds `index.html` into `dist\Slaughtermate.exe`. Don't add extra runtime
  files the launcher wouldn't ship.
- Controls in Rule 6 must keep working: WASD to move, left click to attack, hold left click to
  charge, 1/2/3 for spells. Space is the dash (R32). Esc pauses, and closes the shop cart (R47).
- Rebuild the exe (`powershell -ExecutionPolicy Bypass -File desktop\build.ps1`) after changing
  `index.html`. `dist\` is git-ignored, so the exe is local only.

## Code conventions in `index.html`
- `index.html` uses CRLF line endings. The Edit tool handles this; ad-hoc scripts that replace
  multi-line text must match `\r\n`.
- `SPELLS` holds tiers 1–5 only: exactly 75 spells, 15 per tier, one per element (R33). The
  Grandmaster spells (tier 6) are in `GM_SPELLS`. Use `ALL_SPELLS` / `SPELL_BY_ID` for "every
  spell" (see `docs/decisions/0003`).
- Level-up cards have three types: `'spell'`, `'gm'` and `'stat'`.
- Spell visuals go through the element helpers: `elPart`, `elementFx`, `elRing`, `elLine`, and
  `glint` for white glints. Area effects go through `drawArea(el, ...)`. A spell must not emit
  `'spark'` particles in its element colour (R36–R45). The plain `sparkle`/`sparkRing`/`sparkLine`
  are for enemy and weapon effects only.
- Enemy and boss attacks read `edmg(e)` / `edmg(b)`, not `e.dmg`, so that weakening (R52) applies.
- The real canvas throws on negative `arc`/`ellipse` radii, but the test stub doesn't. Keep radii
  positive and check new visuals in a real browser.
- The player's currency is chess-piece fragments (R48), but the internal field is still `P.gold`.
  User-facing text must never say "gold".
## Tests
- Run with `npm test` (same as `node --test tests/`). No npm dependencies; keep it that way
  unless the user agrees.
- Every test name starts with the requirement ID(s) it checks, e.g. `test('R27 ...')`.
- All earlier rounds' tests must still pass at the end of a round.
- New requirements get tests, preferably written and committed before the implementation.
- If a later requirement changes behaviour that an older test pins down, update only that
  assertion, add an "Amended in Round N" comment, and tell the user.
- How the harness works (`tests/harness.js`, `docs/decisions/0001`):
  - Tests run the real game script inside a Node `vm` with a stubbed DOM and canvas.
  - Tests evaluate global names (`G`, `P`, `spawnEnemy`, ...), so renaming a top-level function
    or state field breaks tests even if the game still works.
  - Arrays returned from the `vm` come from another realm, so compare
    `JSON.stringify(...)` / `.join()` output instead of using `deepEqual`.
  - `step()` mimics `frame()`: update, then the camera follows the player. Effects only spawn
    on-screen.
  - Stub DOM elements keep their children across re-renders. For example, `shSpells` and `shGm`
    accumulate cards with each `renderShop()`.
- Visual check: use headless Edge (`msedge --headless=new --window-size=1280,800
  --virtual-time-budget=1300 --user-data-dir=<scratch> --screenshot=out.png file:///…`) on a
  scratch copy of `index.html` with a scenario script injected. Never edit the real file for
  this.

## Tooling on this Windows machine
- In the Bash tool, heredocs containing emoji fail. Write scripts to the scratchpad with the
  Write tool and run them from there.
- `VAR=x cmd "$VAR"` in one command expands `$VAR` before it is assigned.
- Git prints LF→CRLF warnings on new files; they are harmless.

## Git
- Never undo, amend, rebase or force-push a commit. Fix forward with a new commit.
- Commit in small steps. Messages say what changed and why.
- End commit messages with the attribution line the session provides.
- Push only when the user asks.
- Don't commit handoff files or this file until the user has reviewed them and asks for a commit.

## Decision records
- Store them in `docs/decisions/NNNN-short-title.md`, numbered 0001, 0002, ...
- Write each as a Y-statement: "In the context of …, facing …, we decided for … and neglected …,
  to achieve …, accepting …".
- Write at least one per round, for a decision that had real alternatives.

## End of a round
- List for the user every decision made that they didn't ask for.
- Write `handoff-round-N.md` only when the user asks for it.
