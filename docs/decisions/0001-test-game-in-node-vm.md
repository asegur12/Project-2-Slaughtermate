# 0001. Test the single-file game by loading its script into a Node `vm` with a stubbed browser

- Status: accepted
- Date: 2026-11-19
- Round: 2
- Requirements: all (R1–R35); enables the per-requirement tests

## Context

Round 2 asks for a test for every new or changed requirement, plus the earlier rounds' tests,
which didn't exist. The whole game is one inline `<script>` in `index.html`. That keeps it
offline and double-clickable (R16), and the Windows launcher embeds exactly that one file
(`desktop/build.ps1`). The game code calls `document`, a 2D canvas, `localStorage` and input
events directly.

## Options considered

1. **Load the inline script into a Node `vm` context with stub DOM, canvas and storage objects**
   (chosen). The tests run the real shipped code and need no dependencies (`node --test`).
2. **Split the logic into a separate `game.js` module** imported by both the page and the tests.
   This is cleaner for unit testing, but the launcher embeds only `index.html`, so it would need
   changing, and the game would no longer be a single file.
3. **Browser end-to-end tests (Playwright or Puppeteer)** that drive the real page. This is the
   most realistic option, but it needs npm packages and a downloaded browser, it's slow, and
   precise checks such as "this dummy took damage" are hard to make.
4. **Copy the formulas into the tests.** Fast, but it tests a copy instead of the game, so the
   two drift apart.

## Decision (Y-statement)

In the context of **adding requirement-level tests to a single-file, offline HTML5 canvas game**,
facing **game code that touches the DOM, canvas and storage directly, with no build step or module
boundary**, we decided for **extracting the inline script from `index.html` and running it in a
Node `vm` context with a minimal stubbed browser (`tests/harness.js`)** and neglected **splitting
the code into modules, browser automation with Playwright, and re-implementing formulas in the
tests**, to achieve **tests that exercise the exact shipped code, run in under a second with zero
dependencies, and leave the single-file and offline design (R16) and the desktop launcher
untouched**, accepting that **rendering is only checked for "no crash" and for which colours and
blend modes are set (the stub canvas draws nothing), that tests rely on global names inside the
script, and that real-browser visuals still need a manual or screenshot check**.

## Consequences

- Each `loadGame()` gives an isolated game with an optional seeded `Math.random`, so tests that
  depend on randomness repeat exactly.
- `step()` copies the game's `frame()` (update, then the camera follows the player), so on-screen
  effect logic behaves as it does in play.
- Renaming top-level functions or state fields in `index.html` can break tests even when the game
  still works. That is the price of testing without a module API.
- Visual quality (R17–R18, R20–R25) is checked in tests as particle counts, shapes, colours and
  additive blending, plus a manual headless-Edge screenshot pass.
