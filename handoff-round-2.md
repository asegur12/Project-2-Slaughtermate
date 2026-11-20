# Handoff: end of Round 2 → start of Round 3

Standing rules for every session are in `CLAUDE.md`. Read that first. This file only covers the
state at the end of Round 2.

## Current state

- Branch `main` is pushed to `origin` (github.com/asegur12/Project-2-Slaughtermate). The last
  Round 2 commit is `59fa08f` (README update). The working tree was clean apart from this file and
  `CLAUDE.md`, which are deliberately uncommitted until the user reviews them.
- `npm test` passes **44/44**: 16 Round 1 regression tests (R1–R16) and 28 Round 2 tests (R17–R35).
- Round 2 requirements R17–R35 (see `spec.md`) are all implemented:
  - **Effects (R17–R18):** sparkle, ember, shard and debris particles; glow halos; rune circles;
    enemy shot trails; bursts when boss telegraphs land.
  - **Floors (R19–R26):** a new map and colour theme on every floor (`FLOOR_THEMES`, `genMap(floor)`).
    Floor 3 is the Round 1 map, floor 5 has destructible `watchtower` enemies, and floor 6 is a
    maze (`genMaze`). The floor name appears in the banner and the HUD.
  - **Difficulty (R27):** `DIFFICULTY` easy/normal/hard. It scales enemy HP and damage and enemy
    projectile speed, and multiplies the score. Chosen on the menu and shown on the scoreboard.
  - **Weapons and dash (R28–R32):** Scythe, Shield, Club, Tome, and a Space dash (`DASH_CD=1`).
  - **Spells (R33–R35):** 75 spells, one per element per tier across 15 elements, including the new
    Mind element. Damage over time (`applyDot`/`tickDots`), weaken (`weakT`, +15% damage taken),
    homing and multi-shot bolts. Heavy tier 3–5 spells have a `windup` (`G.casts`, `updateCasts`,
    `fireSpell`).
- `dist\Slaughtermate.exe` was rebuilt locally from the final `index.html`. It is git-ignored, so
  a fresh clone has no exe until `desktop\build.ps1` is run.

## How to run

- **Browser:** open `index.html` by double-clicking it. It works offline.
- **Windows app:** run `powershell -ExecutionPolicy Bypass -File desktop\build.ps1`, then
  `dist\Slaughtermate.exe`. The build uses the .NET Framework `csc.exe` that ships with Windows.
  The exe opens Edge or Chrome in app mode with its own profile, so scores persist.
- **Tests:** `npm test` (Node 26 is installed on this machine; any Node ≥18 should work). A full
  run takes about 2 seconds.
- **Screenshot check (optional, used in Round 2):** headless Edge works:
  `msedge --headless=new --window-size=1280,800 --virtual-time-budget=2300 --screenshot=out.png file:///…/page.html`.
  Inject a small `<script>` into a scratch copy of `index.html` to start a run on a given floor.
  Never edit the real file for this.

## Code map (all in `index.html`)

| Section marker | What's there |
|---|---|
| `DATA` | `WORLD`, `FLOOR_THEMES`, `DIFFICULTY`/`diff()`, `EL_COL`, `WEAPONS`, `DASH_*`, `SPELLS`, `UPGRADES`, `TIER_ODDS`, `ETYPES` (incl. `watchtower`), `SPAWN_W`, `BOSSES` |
| `MAP` | `themeFor`, `genMap(floor)`, `genMaze`, `placeHostiles`, collision helpers |
| `STATE` | `makeState()` (the `G` object), `makePlayer()` (the `P` object) |
| `FAIR RANDOMNESS` | per-tier shuffle bags, pity counter, `makeCards` |
| `EFFECTS` | `particle`, `sparkle`, `debris`, `elementFx`, `sparkRing`, `sparkLine`, `addFx` (an fx with negative `t` is delayed) |
| `DAMAGE` | `hitEnemy` (returns the damage dealt and adds it to `G.dealt`), `applyDot`, `tickDots`, `damageCircle`/`Arc`/`Rect`/`Line` |
| `PLAYER ATTACKS` | `basicAttack`, `chargedAttack`, `spirit`, `clubSwing`, `dash` |
| `SPELLS` | `castSpell` → `updateCasts` → `fireSpell` |
| `FLOOR FLOW` | `startFloor` (regenerates the map, recentres the player, shows the banner), `newRun(weapon, difficulty)`, `update` |
| `RENDER` | `drawGround`/`drawStructures` (themed), `drawWatchtower`, `drawParticles` (additive pass), `drawHUD` |

## Decisions made in Round 2, and why

Recorded as decision records:
- **0001:** tests load the inline script into a Node `vm` with a stubbed browser
  (`tests/harness.js`). This tests the real shipped code with no dependencies and keeps the
  single-file design and the launcher unchanged.
- **0002:** floor 6 is a randomised spanning-tree maze with about a third of the extra walls
  removed and the centre always open. It reads as a maze but has loops, and it's walkable by
  construction.

Agreed with the user before coding (also in `spec.md`):
- **R33** overrides R9's limit of 5–8 spells per tier, so there are 15 per tier (75 in total).
- **R24** hostile structures are destructible watchtowers that fire slow projectiles.
- **R27** multipliers: Easy HP ×0.7, damage ×0.65, projectiles ×0.9, score ×0.75. Hard HP ×1.4,
  damage ×1.35, projectiles ×1.2, score ×1.5.
- **R35** wind-ups only on heavy tier 3–5 spells, 0.2–0.6 s long. The player can move during the
  wind-up, and the spell aims at the cursor when it fires.
- **R34** the Pokémon-inspired Mind spells get original names ("Mind Wave", "Psionic Strike").
- R17–R18 override Rules 3 and 7 for spell and attack effects only.

Made without being asked (all reported to the user at the end of Round 2):
- **Floor themes:** colours and castle and town counts per floor (floors 1–5: 1/2/4/5/5 castles
  and 3/5/7/8/10 towns), 5 watchtowers on floor 5, and floor 6 with only maze walls and 14
  pillars.
- **Map regeneration:** the player is recentred on every new floor so they can't start inside a
  wall.
- **Weapon numbers:**
  - Scythe lifesteal is 25% of damage dealt, capped at 25% of max HP.
  - Shield gives 10% damage reduction, and Shield Rush covers about 320 px with i-frames.
  - Club winds up for 0.35 s, then fires 3 blasts 110 px apart.
  - Tome spirits apply a 2 s damage over time.
- **Dash:** 190 px over 0.15 s, with 0.2 s of i-frames.
- **The 45 new spells:** names and stats, plus the weaken, homing and multi-shot mechanics.
- **Wind-ups:** only one can run at a time, and a press that gets rejected doesn't use up the
  cooldown.
- **Repo additions:** `package.json` (test script only), and the source files `Project_2.txt` and
  `Project_2_CLAUDE_rules.txt` copied into the repo unchanged from the user's
  `CSC299-main\Final_Project` folder.

## Unresolved / not verified

- **No real playtesting.** Balance of the 45 new spells, the new weapons, the difficulty levels and
  the denser floors 4–5 was only checked by tests, a simulated soak run and screenshots. Nobody has
  played it by hand. Likely hotspots: tier 5 spells that also apply damage over time
  (`ragnarok`, `pandemic`, `psistrike`), and Shield Rush i-frames.
- **Menu overflow:** the menu panel needs to scroll at 1280×800. The Tome weapon card is cut off
  until you scroll. It works, but it isn't tidy.
- **Performance:** the particle cap is 1100 (`PART_CAP`) and the fx cap 260. Additive blending
  hasn't been profiled on a slow machine.
- **Difficulty scope:** difficulty doesn't change boss attack frequency or the swarm spawn rate.
  The spec only asked for stats and stronger attacks.
- **Watchtowers count toward the enemy spawn cap**, about 5 slots on floor 5.
- **Leftover file:** a stray file named `First commit` (one sentence, from the original setup) is
  still in the repo root. I left it alone; it's the user's file.
- **Requirement source:** `Project_2.txt` ends with "this will be all for the first run". The next
  round's requirements will presumably be added to that file by the user. If they aren't there,
  ask.

## Warnings for the next session

- **Tests depend on global names in `index.html`.** The harness evaluates code such as `G.casts`,
  `spawnEnemy`, `FLOOR_THEMES` and `selDifficulty` inside the game's scope. Renaming top-level
  functions or state fields breaks tests even if the game still works, so update both together.
- **Arrays returned from `vm` are from a different realm:** `assert.deepEqual` against Node
  arrays fails. Compare `JSON.stringify(...)` or `.join()` strings instead.
- **`step()` mimics `frame()`:** each step runs update, then the camera follows the player. A
  cursor set with `aimAt()` keeps its *screen* position, so its world position shifts when the
  player moves. That's correct game behaviour, so stop the player before re-aiming in tests.
- **Effects only spawn for on-screen objects** (`onScreen` checks). Tests that count particles
  need the camera on the action, and `aimAt`/`step` take care of that.
- **Tooling on this Windows machine:**
  - In the Bash tool, heredocs whose content includes the 📖 emoji (or similar characters) fail
    with "unexpected EOF". Write edit scripts to a file in the scratchpad with the Write tool and
    run them from there.
  - `VAR=x cmd "$VAR"` in one command expands `$VAR` before it's assigned.
  - Git prints LF→CRLF warnings on new files. They're harmless.
- **`G.timers` (`later`) is cleared when a boss dies.** That cancels pending Club blasts and
  delayed effects, which is intended. Don't use `later` for anything that must survive a floor
  clear.
- **The maze has 28 px gaps at wall junctions,** narrower than the player (30 px). Changing the
  wall thickness (`TH`) or the player radius could open shortcuts. The `walkable()` test checks
  that the map stays connected, not that it is maze-like.
- **Rebuild the exe after changing `index.html`:** the exe embeds a copy of `index.html`, so it
  must be rebuilt (`desktop\build.ps1`) for the desktop app to pick up changes.
