# Handoff: end of Round 3 → start of Round 4

Standing rules for every session are in `CLAUDE.md`. Read that first. This file only covers the
state at the end of Round 3.

## Current state

- Branch `main` is pushed to `origin` (github.com/asegur12/Project-2-Slaughtermate). The last
  Round 3 commit is `2354348`, which commits the user's Round 3 requirements section in
  `handoff-round-2.md`. This file is deliberately left uncommitted until the user reviews it.
- `npm test` passes **69/69**: 16 Round 1 tests (R1–R16), 28 Round 2 tests (R17–R35) and 25
  Round 3 tests (R36–R54, in `tests/round3.test.js`). A full run takes about 2 seconds.
- Round 3 requirements R36–R54 (see `spec.md`) are all implemented:
  - **Element designs (R36–R45):** `EL_PART` (particle shape per element) and `EL_AREA` (area
    style per element), helpers `elPart`, `elementFx`, `elRing`, `elLine` and `glint`, particle
    renderers in `PART_DRAW`, area renderer `drawArea(el,x,y,r,alpha,progress,flash)`, and bolt
    looks via `boltLook`/`drawBolt` (ice snowflake, lightning thunderbolt, fire flame). Sun is now
    `#c8231e`. Hyper, light and earth keep the Round 2 area look (`'plain'`).
  - **Merchant cart (R46–R47):** `G.cart` appears `CART_DELAY` (1 s) after a boss dies on floors
    1–5 (`spawnCart`, `updateCart`, `drawCart`). Touching it calls `openShop()`. Esc or the
    advance button calls `closeShop()`, which starts the next floor. Beating the floor 6 King
    still ends the run.
  - **Fragments (R48):** pickups are `k:'frag'`, drawn by `drawShard`. The HTML uses
    `SHARD_SVG`/`frags(n)`. **The internal field is still `P.gold`** (and `ETYPES[*].gold`).
  - **Logbook (R49):** `showLogbook`, `unlockSpell`, `loadLog`, stored in localStorage under
    `slaughtermate_logbook`. A spell unlocks when the player obtains it: the starting spell, a
    level-up, a slot replacement or a shop purchase. A discarded spell does not unlock.
  - **Crowns (R50):** `awardCrown` in `endRun(true)`, `crownHTML` on the weapon cards, sizes in
    `CROWN_PX`, stored under `slaughtermate_crowns` as `{weapon: difficulty}`. A crown is never
    downgraded.
  - **Grandmaster (R51–R54):** `GM_SPELLS` (tier 6), `ALL_SPELLS = SPELLS + GM_SPELLS`, a
    `drawGM` shuffle bag, `rollGM` with `GM_ODDS` and `G.gmPity`, and a `'gm'` reward card type.
    The cart's GM slot (`G.shop.gm`, `GM_PRICE`) appears from floor 4. Casting goes
    `fireSpell` → `castGrandmaster` → `G.rituals` → `updateRituals` / `drawRitualGround` /
    `drawRituals`. Mind control is `e.charmT` with `charmUpdate`, and victims explode through
    `inversionBoom`. Weakening uses `e.despairT` and `edmg(e)`, and freezing uses `e.frozenT`.
- `dist\Slaughtermate.exe` was rebuilt locally from the final `index.html`. It is git-ignored.

## How to run

- **Browser:** open `index.html` by double-clicking it. It works offline.
- **Windows app:** run `powershell -ExecutionPolicy Bypass -File desktop\build.ps1`, then
  `dist\Slaughtermate.exe`.
- **Tests:** `npm test` (any Node ≥ 18; Node 26 is installed here). This should report 69 passing.
- **Screenshot check:** see "Visual check" in `CLAUDE.md`. Edge is at
  `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. Tips from Round 3:
  - Add a `window.onerror` hook that prints errors on the page, so they show in the screenshot.
  - In a scenario, set `cam.x`/`cam.y` before setting `mouse`, or casts land off-centre.
  - Set `G.pendingLevels=0` after killing a boss, or the level-up panel covers the scene.

## Code map additions (all in `index.html`)

| Section marker | Round 3 additions |
|---|---|
| `DATA` | `TIER_COL[6]`, `TIER_NAME`, `EL_COL.grandmaster`, `EL_PART`, `EL_AREA`, `GM_SPELLS`, `GM_PRICE`, `GM_ODDS`, `ALL_SPELLS` |
| `STATE` | `G.cart`, `G.cartT`, `G.rituals`, `G.gmPity`, `G.screenFlash`, `G.bags[6]` |
| `FAIR RANDOMNESS` | `drawSpell` reads `ALL_SPELLS`; `drawGM`, `rollGM`; `'gm'` cards in `makeCards` |
| `EFFECTS` | `elPart`, `glint`, `elementFx` (rewritten), `elRing`, `elLine` |
| `DAMAGE` | `applyDot` carries the element; `hitEnemy` flags kills by mind-controlled pieces (`o.charm`, `e.invBoom`); `killEnemy` calls `inversionBoom` |
| `SPELLS` | `spellCol`, `edmg`, `castGrandmaster`, `updateRituals`, `charmUpdate`, `inversionBoom` |
| `ENEMIES` / `BOSSES` | AI and boss attacks read `edmg(e)` / `edmg(b)`; `updateEnemy` branches to `charmUpdate`; mind-controlled pieces never damage the player |
| `UI: MENUS` | `loadLog`, `unlockSpell`, `showLogbook`, crown helpers; `#logBtn` and `#logbook` in the HTML |
| `SHOP` | `CART_R`, `CART_DELAY`, `spawnCart`, `updateCart`, `closeShop`, `SHARD_SVG`, `frags` |
| `RENDER` | `hsh`, `flamePath`, `starPath`, `PART_GLOW`, `PART_DRAW`, `drawParticles` (rewritten), `drawArea`, `boltLook`, `drawBolt`, `drawRitualGround`, `drawChain`, `drawRituals`, `drawCart`, `drawShard`; screen flash in `render()` |

## Decisions made in Round 3, and why

Recorded as decision records:
- **0003:** the Grandmaster spells are a separate tier 6 list with their own reward card, so the
  tier 1–5 rules and tests (R8, R9, R12, R17, R33) are untouched.
- **0004:** element looks come from two lookup tables and simple canvas shapes, not per-spell
  art or sprites.

Agreed with the user before coding (also in `spec.md`):
- **R46/R47:** the cart only appears after the boss dies, and closing the shop starts the next
  floor.
- **R51:** Grandmaster spells are rare rewards from floor 4 on (shuffle bag plus pity), and the
  cart sells one from floor 4 on.
- **R53:** the *victim* explodes when a mind-controlled piece kills it.
- **R49:** a logbook entry unlocks when the player obtains the spell in a run.

Made without being asked (all reported to the user at the end of Round 3):
- **Requirements and tests:**
  - The Round 3 source is the requirements section in `handoff-round-2.md`; `Project_2.txt`
    stops at Round 2. IDs are R36–R54.
  - Earth keeps its Round 2 look. "Rigged crescents" was read as jagged crescents.
  - The R5 test's automatic-shop assertion now checks the cart instead (see the amendment note in
    `spec.md`).
- **Visuals:**
  - Sun is `#c8231e`.
  - "Area effect" covers zones plus the bursts from novas, strikes and explosions.
  - White glints remain on every spell, which keeps R17's test valid.
  - Fire bolts are drawn as flames, and light spells throw twice as many streaks.
  - Enemy attacks keep the Round 2 sparkles.
- **Cart and shop:**
  - The HUD shows a hint, an off-screen arrow and a minimap marker for the cart.
  - The cart doesn't block movement, and closing the shop always advances.
  - Esc is ignored while the replace-spell dialog is open.
  - Fragment amounts and prices are unchanged from gold.
- **Logbook and crowns:**
  - An in-run "New logbook entry" message appears, and Esc closes the logbook.
  - Crowns are 16, 24 and 34 px in bronze, silver and gold, and the end screen shows a
    "new crown" line.
- **Grandmaster numbers:**
  - At most one GM card per level-up. The chance per card is 2% / 3.5% / 5% on floors 4–6,
    plus 0.3% for each card since the last one. The cart charges 900 fragments, and the GM slot
    survives a reroll.
  - Game of Despair: 3200 damage, 540 px radius, bursts after 2.8 s, enemies slowed inside.
    Survivors take 15% more damage and deal 35% less for 8 s; the "deal less" part also applies
    to bosses. Cooldown 42 s.
  - Mental Inversion: 620 px pulse, 10 s of control, 600-damage explosions in a 130 px radius
    that don't chain. Controlled pieces move 40% faster and hit every 0.5 s for
    max(3 × their damage, 35% of the target's max HP), or 6 × their damage against a boss. The
    pulse doesn't hurt the pieces it controls; bosses and towers resist and take 900. The
    player's own attacks can still hit controlled pieces. Cooldown 40 s.
  - Grand Seal: 2600 damage, 560 px radius, 5 portals at 55% of the radius pulling at 280 px/s
    from 0.3 s to 2.6 s, then a 3 s freeze. Cooldown 45 s.
  - Grandmaster spells level up like the others (+25% per level), and casting one flashes the
    screen.
- **Repository:** decision record 0004 (on top of the one required), README updates, and the exe
  rebuild.

## Unresolved / not verified

- **No real playtesting.** Round 3 was checked by tests, a simulated playthrough (3 seeded runs to
  victory casting every Grandmaster spell, 5 cart visits each) and headless-Edge screenshots.
  Nobody has played it by hand. Balance hotspots:
  - Mental Inversion, which with many controlled pieces can clear a whole screen.
  - Grandmaster drop rates and the 900-fragment price against what a run actually earns.
  - Game of Despair's "-35% damage dealt" on bosses.
- **Performance:** the new area styles draw more shapes than Round 2's flat circles. Game of
  Despair draws about 256 tiles per frame, and the fire and ice styles draw dozens of paths. The
  particle cap (1100) and fx cap (260) are unchanged. Not profiled on a slow machine.
- **Wind fog** is still fairly faint on the light floor 1 and 2 boards.
- **Menu overflow** from Round 2 is unchanged. The logbook button sits under BEGIN THE GAME, so
  the menu panel still needs scrolling at 1280×800.
- **Commit message slip:** the `e1e75bf` message says "a 3200... no, 2600 detonation". The
  correct value is 2600, and the correction is in the `e7e6251` message. The commit can't be
  amended.
- **Leftover file:** the stray `First commit` file is still in the repo root. It's the user's file.
- **Requirement source:** Round 3's requirements were added to the previous handoff file. Round 4's
  will presumably be added to this file or to `Project_2.txt`. If neither has them, ask the user
  (they may also be in an outside folder; in Round 3 the user said to check there first).

## Warnings for the next session

Standing rules and code conventions (CRLF, `SPELLS` vs `ALL_SPELLS`, element helpers, `edmg`,
harness quirks, rebuilding the exe, tooling) are now in `CLAUDE.md`, which this round updated.
Specific to the state Round 3 left behind:

- **Changes to old behaviour players will notice:**
  - The shop no longer opens on its own after a boss; the player must walk to the cart.
  - Closing the shop always advances to the next floor; there is no "close and stay".
  - Mental Inversion's pulse deals no damage to the pieces it controls. This was changed after
    the screenshot pass, because a damaging pulse killed weak pieces before they could be
    controlled.
- **Grandmaster spells are timed rituals in `G.rituals`, not zones or strikes.** `startFloor`
  clears them, but `onBossDown` doesn't. A Game of Despair or Grand Seal still running when a
  boss dies keeps going during the floor-clear phase. This is harmless (no enemies are left), but
  worth knowing.
- **A mind-controlled piece is still an enemy in `G.enemies`.** It counts toward the spawn cap and
  the player's attacks can kill it. Anything that iterates enemies (new AI, new spells) should
  decide whether to skip `e.charmT>0`.
- **`GM_ODDS` and `GM_PRICE` were never tuned against real income.** Check them before balancing
  the shop.
- **CLAUDE.md's project section** now says later rounds' requirements may be outside
  `Project_2.txt`. Find out from the user where Round 4's are before starting.
