# Handoff: end of Round 5 → start of Round 6

Standing rules for every session are in `CLAUDE.md`. Read that first. This file only covers the
state at the end of Round 5.

## Current state

- **Branch `main`.** Every Round 5 change is committed locally. **Nothing has been pushed.**
- **Uncommitted files:**
  - `handoff-round-4.md` holds the Round 5 requirements ("==ROUND 5 CHANGES AND ADDITIONS=="). The
    user added that section. It is the Round 5 source.
  - This file and the `CLAUDE.md` edits await the user's review.
- **Round 5 commits, in order:**

  | Commit | What it did |
  |---|---|
  | `b854302` | spec: R77–R97, with the user's answers |
  | `a8b3337` | tests, written before the code |
  | `d015e83` | boss spells (R84) |
  | `9b8ea6b` | the Merchant (R77–R79) |
  | `fa7101e` | grand disciple, draft, portal, floor 7, Grandmaster, his design (R80–R83, R96) |
  | `494c549` | enemy logbook (R85) |
  | `c0e4fa8` | weapon tiers 2–5 (R86–R94) |
  | `bdfb627` | bullseye cursor and face upload (R95, R97) |
  | `3f10625` | two logbook fixes found by screenshots |
  | `65110cb` | decision record 0006 and README |

- **`npm test` passes 140/140** (about 11 s):

  | File | Tests | Requirements |
  |---|---|---|
  | `tests/round1.test.js` | 16 | R1–R16 |
  | `tests/round2.test.js` | 28 | R17–R35 |
  | `tests/round3.test.js` | 25 | R36–R54 |
  | `tests/round4.test.js` | 33 | R55–R76 |
  | `tests/round5.test.js` | 38 | R77–R97 |

  No test from an earlier round was changed in Round 5.
- **`dist\MagicRush.exe`** was rebuilt from the final `index.html`.

## Where the Round 5 features live in `index.html`

- **Boss spells (R84).**
  - Data: `BOSS_SPELL_TIERS`, `BOSS_SPELL_FIRST` (4 s) and `BOSS_SPELL_EVERY` (7 s).
  - Code: `bossSpellPool(b)` and `bossCast(b, id)`, which turns each spell kind into
    `shootE`, `hzCircle`, `hzLine` or `G.ezones` attacks, tagged with `el` and `slow`.
  - Enemy zones are updated by `updateEZones`.
  - The player's slow is `P.slowT`: 40% slower while it lasts.
  - Bosses get `b.bi` (the boss index), `b.spellT` and `b.castLog`.
- **The Merchant (R77–R79).**
  - Hit detection: `pokeMerchants(test)` is called from `damageCircle`, `damageArc`,
    `damageRect`, `damageLine` and the player projectile loop. It feeds `merchantHit()`, which uses
    the fields `G.cart.hits`, `hitCd`, `hurtT` and `say`.
  - The boss: `MERCHANT_BOSS`, `spawnMerchantBoss`, `spawnHelpers`, `onMerchantDown`. Its attacks
    are `ram`, `helpers` and `goods`.
  - State: `G.merchantFight` stops the swarm, `G.merchantFought` allows one fight per run, and
    `G.robbed` with `G.clearT` starts the next floor without a shop.
  - Drawing: `drawCartBody`, `drawMerchantBoss` and `speech`.
  - The shop helper is `ETYPES.helper`, with its AI in `AI5.helper`. Its fantasy look is
    `FIG.shopHelper` (through `EXTRA_LOOK` and `enemyFig()`); in chess it is a light pawn.
  - Bells: `awardBell`, `loadBells`, `marksHTML` and `BELL_SVG`.
- **Disciple and draft (R80).**
  - `ETYPES.disciple` and `AI5.disciple`. The spawn is in `spawnTick` (floor 3, at 35% of the wave,
    once per run through `G.discipleDone`).
  - `discipleBlast` (radius 320) sets `G.draftAt`. `onBossDown` turns that into `G.draft`, and
    `updateDraft` handles drinking it, which sets `G.hasDraft`.
- **Floor 7 (R81).**
  - Data: `DOMAIN_THEME`, `DOMAIN_SPAWN` and `GM_BOSS`. Lookups go through `themeFor(f)` and
    `bossDef(f)`.
  - Elites: `spawnSwarm` and `makeElite` (`e.elite`).
  - `pieceLook()` is true in the chess theme and on floor 7.
  - The portal: `updatePortal`, `G.portal` and `G.portalT`. `G.kingSlain` is set when the floor 6
    boss falls with the draft.
- **The Grandmaster (R82, R83, R96).**
  - Attacks (`BOSS_ATTACKS.grandmaster`): `rookWall` and `sweepRook` (`e.sweep`), `promoteNear`,
    `enrageAll` (`e.kamikaze`), and `bossGM(b, id)`, which casts from `GM_FOE_SPELLS`.
  - `bossGM` pushes normal rituals with `foe:true` and `src:b`. `updateRituals` has a `foe` branch
    in despair, inversion, seal, doom, slumber, nightfog, calamity and excalibur.
  - The player is hit through `inFoe(x, y, r)`. Doom chases the player through the proxy `PT`.
    Enemies he buffs get `e.gmBuffT`, which `edmg` reads as ×1.35.
  - Death: `startGmDeath`, `gmDying` (`e.dying`, `GM_DYING` = 2.6 s) and `onGmDown`, which sets
    `G.gmSlain` and saves `slaughtermate_gmcrowns`.
  - Drawing: `drawGrandmaster(x, y, s, o)` returns the parts it drew. `checkerFill` draws the
    checkered hands and halo. Also `drawDraft`, `drawPortal` and `edgeArrow`.
- **Enemy logbook (R85).** `BESTIARY` (18 entries, each with `f` and `c` name/text pairs),
  `unlockBeast` (called from `spawnEnemy`, `makeBoss` and `makeElite`), `showBestiary` and
  `drawBeastPic`, which temporarily points `ctx` at the entry's own canvas.
- **Weapon tiers (R86–R94).**
  - Data: `WEAPON_UP_PRICE`, `WEAPON_MAT`, `WT_COL`, `WEAPON_PERKS` and `P.wtier`. Helpers:
    `weaponTierName` and `wdmg()`.
  - Attacks: `basicAttack` calls `basicStrike(a, dmg, T)`, and `chargedAttack` dispatches by
    weapon.
  - Helpers: `swordWave`, `throwScythe`, `clubBlast`, `hammerSlam`, `addPulse`/`updatePulses`
    (`G.pulses`, `G.pulseCount`), `updateMPillars` (`G.mpillars`), `pickArrowTarget`, `clubSwing`,
    `dash` (`P.dashDist`, `P.dashHit`, `P.dashDrag`) and `shieldRadius`.
  - New state:
    - on the player: `P.leap` and `P.z` (hammer crush), `P.dualT` (club)
    - on structures: `s.broken` (they stop blocking and are drawn as rubble)
    - in `hitEnemy` options: `o.steal`
    - on projectiles: `p.flyT`, `p.stopT` and `p.zoneDur` (spirits); `p.home`, `p.stopped` and
      `p.tgt` (arrows); `p.lock` (spirits)
    - on zones: `z.nodmg` and `z.plain`
  - The shop section is `#shForge`.
- **Cursor and face (R95, R97).**
  - The cursor is an inline SVG data URL in the `canvas{...}` CSS rule.
  - The face: `FACE_SIZE`, `FACE_URL`, `FACE_IMG`, `mkImg`, `faceReady`, `setFace`, `clearFace`,
    `faceFromFile` and `faceUI`. The menu elements are `#faceBtn`, `#faceIn`, `#faceClear` and
    `#faceThumb`.

## How to run

- **Browser:** double-click `index.html`. It works offline.
- **Windows app:** `powershell -ExecutionPolicy Bypass -File desktop\build.ps1`, then
  `dist\MagicRush.exe`.
- **Tests:** `npm test` (Node ≥ 18; Node 26 is installed). Expect 140 passing.
- **Screenshot check:** see "Visual check" in `CLAUDE.md`. The Round 5 generator was
  `<scratchpad>\shots\gen.js` (it may have been cleared). It wrote one scratch copy of
  `index.html` per scene with a scene script injected after the game script, shot each in both
  themes, and fed a random Reaction image through `setFace`. It used contact sheets (an HTML grid
  of PNGs, screenshotted by Edge) because Pillow isn't installed. Scenes that end with a
  telegraphed attack still on screen should use `--timeout` (see the warnings below).

## Decisions made in Round 5, and why

**Decision record:**
- **0006:** bosses cast spells through `bossCast`, which turns each spell kind into the existing
  telegraphed enemy attacks. The Grandmaster replays the player's Grandmaster rituals with
  `foe:true`. This keeps the player's spell code and the earlier tests untouched, gives readable
  telegraphs in the element's colours, and ties damage to the boss's own `edmg`. The cost is
  simplified tier 1–5 boss spells and a `foe` branch in every shared ritual.

**Agreed with the user before coding** (also in `spec.md`; the user accepted every proposed
default except the ones marked):
- Any hit on a merchant counts, at most one per 0.5 s. The Merchant is one boss scaled to the
  floor, the normal swarm pauses during the fight, and robbing him gives 500 gold, skips the
  shop and moves on to the next floor. The bell is saved per weapon, for any difficulty.
- One disciple per run on floor 3. If he's alive when the boss dies, no draft appears. His blast
  doesn't hurt the player. The draft costs 30% of max HP and can't kill. *User:* it is called
  "Draft".
- *User:* after the floor 6 boss with the draft there is **no shop**, only a portal to floor 7.
  The crown is still awarded.
- Floor 7 enemies are chess pieces in both themes. Elites are 1.3× size with 2.5× HP. The
  Grandmaster has about 1.7× the King's HP, promotion reaches about 500 px, and enraged enemies
  die on contact.
- Boss spells are telegraphs based on the boss's own damage and cast about every 7 s. Freeze,
  stun and sleep become a short (1.5 s) 40% slow.
- The enemy logbook follows the current theme. Entries unlock on first encounter.
- Weapon tiers cost 150/300/500/800 and add +20% damage each. They last for the run, perks build
  on each other, and the materials are gold, obsidian, enchanted and mirror. Interpretations:
  - Sword tier 4: the basic attack is slower but sweeps a massive arc.
  - Hammer tier 5: the map is flattened for 8 s.
  - Club tier 5: double-wield for 8 s.
  - Shield tier 3: 30% less ranged damage, and a dash shield worth 25% of max HP.
  - Staff tier 2: a free random slot spell.
- The cursor is a black bullseye with a white outline.
- The face upload is shrunk to 128 px and the same design is used in both themes. *User:* the
  image replaces the **whole eye**, not just the iris. For testing, use random images from
  `C:\Users\aidan\OneDrive\Pictures\Reaction images`.

**Made without being asked** (all reported to the user at the end of Round 5):
- **Merchant:**
  - HP 1,800 + 1,500 × floor, damage 14 + 5 × floor.
  - Attacks: ram, call 3 + floor helpers, throw a fan of wares. First spell at 3 s.
  - Robbing him also gives +3,000 × floor score and collects the pickups on the ground.
  - Helpers have 95 HP (goblins have 28). Their names are "Shop Helper" and "Bazaar Pawn".
- **Disciple:** 1,100 base HP, appears at 35% of the wave, blast radius 320. On floor 7 at most
  3 are alive, with a spawn weight of 2, and they leave no draft. The draft is a checkered flask
  with a HUD hint and an arrow.
- **Portal and floor 7:**
  - The portal appears 1 s after the floor 6 boss dies, in the centre.
  - Floor 7 has 200 px squares, 10 pillars, no decorations and a 165 s wave.
  - Elites: 10% of swarm spawns, +25% damage, 3× score.
  - Dying on floor 7 after beating the floor 6 boss still records a win (`G.kingSlain`).
- **Grandmaster:**
  - 31,500 HP, damage 46, speed 62. An attack every 3.2–4.2 s, with `gmspell` weighted ×2.
    Only one of his spells is active at a time.
  - Rook wall: 360 px/s, rooks 72 px apart with no gap, rook damage 1.2 × his × 1.5.
  - Enrage: 6 s, contact damage ×2.2, speed at least 300, no kill credit.
  - His spells cover 18% less area. Wind-ups: Despair bursts at 3.6 s, Seal at 3.4 s, Doom
    after 5.5 s, Slumber after 3.6 s, Calamity at 9 s, and Excalibur lands at 1.3 s and fires at
    2.5 s, re-aimed at the player when it lands. His fog lasts 10 s and follows him.
  - Score: +8,000 × floor when he dies, and +25,000 in the final score.
- **Boss spell numbers:**
  - Damage is `edmg(b) × (0.55 + 0.12 × tier)` times a per-kind factor up to ×2; the Merchant's
    is ×0.45.
  - The cast timer is deterministic, so the random sequence is unchanged.
  - Heal and shield spells are excluded. The spell's name floats above the boss.
- **Weapon tier numbers:** every radius, count and timing. Key interpretations:
  - The staff's random spell excludes Grandmaster spells (a free one every charge would break the
    game) and falls back to Arcane Blast.
  - The staff's tier 5 laser replaces the random spell.
  - The club's tier 5 charged attack only grants double-wield.
  - The hammer flattens structures within 420 px.
  - The shield's dash shield is worth 40% of max HP at tier 5.
  - The HUD shows the material name, and tier 4–5 weapons sparkle.
- **UI:**
  - The logbook names and texts.
  - The face is centre-cropped and saved as JPEG at quality 0.88, with a thumbnail and a Remove
    face button.
  - The bell and the pink upside-down crown sit beside the existing crown on the weapon card.
- **Code:**
  - The new tables (`AI5`, `EXTRA_LOOK`, `DOMAIN_*`, `GM_BOSS`, `MERCHANT_BOSS`) are separate
    because earlier tests pin the six-entry lists.
  - `ctx` became `let`.
  - Decision record 0006, and the README was updated.
- **Test fixes**, in my own Round 5 tests only:
  - The helper AI check now looks at `AI5`.
  - The Grandmaster's drawn parts are compared in any order.
  - The shield checks reset the player away from the world edge, and the club check waits for the
    tier 4 bursts to finish.

## Unresolved / not verified

- **No hand playtesting.** Round 5 was checked by tests and about 60 headless-Edge screenshots in
  both themes. Balance hotspots:
  - The Grandmaster's rook wall has no gap and hits for about 83 per rook before multipliers.
  - Enrage can stack many hits.
  - Tier 5 weapons together with five spell slots.
  - The staff's tier 2–4 free spell on every charged attack.
  - The tier 5 hammer flattening the floor 6 maze.
- **Spell timing while paused:** boss spells and Grandmaster rituals don't advance while paused,
  which is correct. But particles from telegraphs fill up to the 1,100 cap while the game is
  paused, because pausing only renders. This existed before Round 5.
- **Pausing during the 2.6 s Grandmaster death** wasn't tested by hand.
- **The Merchant can be triggered by stray AoE**, for example a lingering zone left near the cart
  after the boss dies, which is something the player might not intend. At most one hit counts per
  0.5 s, so it takes several seconds of hits.
- **The face upload** was checked in Edge with the real shrink path. The exe uses Edge `--app`
  mode, so it should work there too, but the picker wasn't opened by hand in the exe.
- **Spell descriptions** still use chess words in the fantasy theme (unchanged since Round 4).
- **Menu overflow:** the start menu now has three rows of buttons (two logbooks, then the face
  buttons and the theme switch), and the panel scrolls at 1280×800.
- **The stray `First commit` file** and the old `dist\Slaughtermate.exe` are still there. Both
  are the user's to delete.

## Warnings for the next session

- **Headless Edge's `--virtual-time-budget` can freeze forever** on scenes that end paused with
  many boss telegraphs on screen. The existing Round 2 "cannon" pattern does it too. It is not a
  game hang: the same page shoots fine with `--timeout=2500` (a real-time wait), and Node drives
  `frame()` for hundreds of frames without trouble. Use `--timeout` for such scenes, and give the
  Edge call a process timeout so a stuck run doesn't block everything.
- **Scenario scripts:** the cart and the portal appear at the map centre where the player starts.
  Move the player away before the cart appears, or the shop opens. In scripted runs, boss deaths
  also queue level-ups (`G.pendingLevels`).
- **Pinned lists:** `FLOOR_THEMES`, `BOSSES` and `SPAWN_W` must keep 6 entries, `ENEMY_LOOK` must
  keep its 6 keys, and `Object.keys(AI)` must stay
  `pawn,knight,bishop,rook,queen,watchtower,king`. Earlier tests check them. Add new enemies to
  `AI5` and `EXTRA_LOOK`, new floors through `themeFor`/`bossDef`, and new bosses as separate
  definitions built with `makeBoss`.
- **A new Grandmaster spell** now also needs a foe version (a `bossGM` case plus `foe` branches in
  `updateRituals`) if the Grandmaster should cast it. Otherwise leave it out of `GM_FOE_SPELLS`.
- **Weapon tier 1 must stay exactly as it was before Round 5.** The R7 and R28–R31 tests check
  it. Use `wdmg()` for weapon damage, not `WEAPONS[w].dmg * P.dmgMult`.
- **Kills vs. removals:** sweep rooks, enraged enemies that die on contact, promoted enemies and
  `toGoblin` mark enemies dead without `killEnemy` (no kill, score or loot). The Grandmaster
  ignores damage while `e.dying >= 0`, and `killEnemy` on him starts the glow instead.
- **Committing handoff files and `CLAUDE.md`:** as in Round 4, only do it when the user explicitly
  asks.
