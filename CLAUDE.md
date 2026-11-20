# CLAUDE.md: standing rules for every session

## Project
Slaughtermate is a chess-themed hack'n'slash game for CSC299 (project 2 of 3), developed in rounds.

- `Project_2.txt` is the source problem statement and holds every round's requirements.
- `Project_2_CLAUDE_rules.txt` holds the client's agent rules (Rule 1–10).
- `spec.md` is the numbered requirement list (R1, R2, ...) derived from them.

## Source of truth
- Use only what is in this repository. If a requirement file seems to be missing, ask the user;
  don't search elsewhere or guess.
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
  charge, 1/2/3 for spells. Space is the dash (R32).

## Tests
- Run with `npm test` (same as `node --test tests/`). No npm dependencies; keep it that way
  unless the user agrees.
- Every test name starts with the requirement ID(s) it checks, e.g. `test('R27 ...')`.
- All earlier rounds' tests must still pass at the end of a round.
- New requirements get tests, preferably written and committed before the implementation.

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
