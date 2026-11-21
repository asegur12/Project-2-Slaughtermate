# Handoff: end of Round 4 → start of Round 5

Standing rules for every session are in `CLAUDE.md`. Read that first. This file only covers the
state at the end of Round 4.

==ROUND 5 CHANGES AND ADDITIONS==

The client is enjoying this game so far, but now he believes its time for some new systems and additions

==BOSSES==

Two new bosses will be added, both are optional but require a specific condition to be fought

-Secret boss 1: The merchant
	-Condition: if the player hits the merchant, he says "Stop that", hits him again, and the shopkeeper says "Im warning you". On the third hit, the cart disappears and a new boss appears
	-The merchant: The 3 shopkeepers now ride their cart, while attacking and ramming into the player, a new enemy spawns on this boss exclusively that being the shop helper
		-The merchant is able to use some spells up to tier 4, but these spells are largely weakened
		-The shop helpers act like pawns/goblins, but are more tanky
	-Defeating the merchant will allow you to rob him and get 500 gold from him
	-This fight can only be fought once per run
	-A new bell icon appears on the beginning screen if you defeated the merchant in a run with that weapon

-Secret final boss: The grandmaster
	-Condition: On the third floor, a grand disciple enemy will spawn, hidden amongst the swarm and has a lot of hp, defeating him will cause him to explode, killing every enemy around him, except bosses. Upon completing the floor, a grandmasters draft will appear where he died, picking it up will cause you to lose some hp, but will now allow you to fight the grandmaster and go to the 7th floor
	-Grandmaster: The evil entity of massive power, he dwells on the 7th floor, the grandmasters domain
		-A giant black and white chess board, instead of medieval enemies, chess pieces return as enemies with slightly larger checkered ones now appearing in the midst of the swarm along with grand disciples
		-The grandmaster will have the regular boss movement behavior, but he has different attacks
			-Summons a wall of checkered rooks that sweep the screen, dealing heavy damage but the rooks can be defeated as they move
			-Promotes all nearby enemies into rooks or queens
			-Enrages all enemies, making the charge headfirst towards the player, killing themselves to deal damage
			-Casts any of the grandmaster tier spells, with a longer windup and slightly reduced area, but still dealing heavy damage
				-Mental inversion will buff enemies when grandmaster casts it
				-hellfire is excluded
	-The grandmaster slowly glows light and then explodes, clearing the run
	-An upside down crown is now inplace when you defeated him with a weapon in a run

-Other bosses: bosses can now use spells, but are weaker
	-First boss: tier 1 spells
	-Second boss: tier 2 and lower spells
	-Third boss: tier 3 and lower
	-Fourth boss: tier 4 and lower
	-Fifth boss: tier 5 and lower
	-sixth boss: tier 5 and tier 4

++NEW ADDITIONS++
-Enemy logbook: a logbook for enemies, a chess themed one and the medieval themed one

-Weapon perks and upgrades: In an earlier spec, The client wanted weapons with cool perks, now its time to add them
-The shop now offers weapon upgrades for money, the weapon can be upgraded up to tier 5
	-Sword upgrades:
		-tier 1: default
		-tier 2: Gold sword, a larger slash radius and a double spin slash, more damage
		-tier 3: Obsidian sword, larger slash radius and the charged is now a wide wave slash, more damage
		-tier 4: Enchanted sword, A slower charged default that hits a massive area, a tri-wave slash for the charged and more damage
		-Tier 5; Mirror sword, A 3 hit wide slice, and the charged is now a massive wave beam
	-Designs are similar for every weapon
	-Hammer:
		-tier 2: bigger smash and now slows enemies for the charged
		-tier 3: basic attack now release a weak pulse, the charge now is a leaping crush
		-tier 4: same, but with more damage
		-Tier 5: The pulse now causes more pulses with every enemy hit, the charged now destroys the map itself for a bit
	-Archer:
		-tier 2: 3 arrows now shot at once, the charge now shoots 3 arrows
		-tier 3: shoots 5 arrows for both attacks
		-tier 4: arrows now naturally pierce enemies, the charge now causes 3 massive arrows to stop and home in on 3 enemies
		-tier 5: shoots 10 arrows for both attacks
	-Mage:
		-tier 2: magic bursts cause chain explosions on enemies, charge now casts a random spell in your inventory
		-tier 3: larger chain explosions and the charged attack now pulls enemies inwards
		-tier 4: magic bursts shoot out small orbs that explode, charge is unchanged
		-tier 5: Cause pillars of magic to slowly move away from you, the charge now causes a giant laser to smite an area
	-Scythe:
		-tier 2: basic attacks now steal hp and the charged doubles the hp stolen
		-tier 3: basic attacks through a scythe that deals dmg, the charged does the same
		-tier 4: widens and triples the scythes thrown for basic attacks, the charge now greatly enlargens your scythe and slash it around you, dealing damage and stealing hp
		-tier 5: 5 scythes thrown instead of 3, the charged now causes you to warp to the mouse and inflict large slices that steal hp
	-Club:
		-tier 2: larger area and explosions
		-tier 3: chain explosions instead for the basic attack, the charged is now a large line of bursts that travel far
		-tier 4: explosions now push enemies away and the charged is the same but weakens enemies
		-tier 5: Causes many explosions in a wide cone and the charged now lets you double-wield
	-Shield:
		-tier 2: dash farther and the charged now pushes enemies further
		-tier 3: reduces ranged damage and the dash now gives you a shield around you for 5 seconds
		-tier 4: Your dash now has a wind force, pushing enemies away and the charged will increase its shield duration
		-tier 5: Increases the wind force and your dash is a great charge that now drags enemies with your wide area and increases shield size
	-Tome:
		-tier 2: more spirits on the basic attack and the charge spirits now home in on enemies
		-Tier 3: spirits now lock on and follow an enemy, the charged now releases more spirits
		-Tier 4: spirits now stop and then fly towards an enemy, and explode, charged spirits do the same
		-Tier 5: Spirits will now explode and leave behind a small area of effect for 3 seconds, charged spirits leave a longer lasting area

-assume tier 1 is the default phase and every upgrade increases damage

++Slight changes++
-Cursor: make the cursor more visible, its too hard to see, make it a black bullseye or a black circle
-Grandmasters design: The grandmaster is a giant eye with 2 large floating hands that are checkered, he has a checkered crown halo above him, the grand disciples are the eye part alone
	-In the beginning part, the player can have the option to give the grandmaster a face, in which they can upload an image from their computer and it will be set as the face for the grandmaster and grand disciples

==END ROUND 5==

## Current state

- **The game is now called Magic Rush**, a fantasy medieval hack'n'slash. The Round 3 chess look
  (Slaughtermate) is an optional theme behind a start-screen button.
- Branch `main`, everything committed and pushed to `origin`.
- `handoff-round-3.md` (whose Round 4 requirements section is the Round 4 source), `CLAUDE.md`
  and this file were committed together in `115f16e`, at the user's request.
- Round 4 commits, in order:

  | Commit | What it did |
  |---|---|
  | `4e80e10` | spec |
  | `c110c5b` | tests, written before the code |
  | `159cf5a` | theme and rename; the message starts with "GAME RENAMED" |
  | `be4467f` | Grandmaster spells |
  | `080a2ce` | visual polish |
  | `af6f646` | decision record 0005 |
  | `84be609` | README |

- **`npm test` passes 102/102:**

  | File | Tests | Requirements |
  |---|---|---|
  | `tests/round1.test.js` | 16 | R1–R16 |
  | `tests/round2.test.js` | 28 | R17–R35 |
  | `tests/round3.test.js` | 25 | R36–R54 |
  | `tests/round4.test.js` | 33 | R55–R76 |

- All of R55–R76 (see `spec.md`) are implemented:
  - **Theme switch (R55, R62).** The `LOOK` global is saved under `slaughtermate_look`.
    `setLook`/`applyLook` live in `UI: MENUS`, and the `#lookBtn` button is on the menu.
  - **Player (R56).** Knight, wizard or archer by weapon (`CLASS_OF`). Promotion keeps `P.form`
    and `FORM_BONUS`, but the title comes from `RANKS`. `FIG.knight/wizard/archer` draw rank
    upgrades through `rankBack`/`rankFront`.
  - **Enemies and bosses (R57, R58).** `ENEMY_LOOK`, `BOSS_LOOK`, `BOSSES[*].fname`, `bossName()`.
  - **Floors (R59).**
    - `FANTASY_FLOORS` (with fields `ground`, `house` and `deco`) copy the chess floors' structure
      counts, so the floor layouts are generated exactly as before.
    - The drawing functions are `drawFantasyGround`, `drawFantasyStruct` and `drawDecor`.
    - `G.decor` comes from `genDecor`, which is seeded from the layout and never calls
      `Math.random()`.
  - **UI and name (R60).** CSS variables are on `:root`, with chess overrides under `body.chess`.
    The menu text elements are `#gameTitle`, `#gameSub`, `#hallTitle`, `#menuKeys`, `#menuHint`,
    `#pauseSub` and `#quitBtn`.
  - **Merchants (R61).** `FIG.merchant`. The cart still keeps them in `G.cart.pawns`.
  - **Death animations (R63).**
    - `G.corpses` holds falling bodies. The helpers are `corpseAngle`, `stepCorpses`, `poof` (the
      `'poof'` particle) and `drawCorpse`.
    - The chess theme uses `shatter()` instead.
    - The boss burst is in `killEnemy`.
    - `stepCorpses` also runs on the game-over screen.
  - **Gold (R64).** `drawGoldBar`, `GOLD_SVG`, `money(n)` and `drawLoot`.
  - **Spell icons (R65).** `ICONS` (SVG path parts), `drawIcon`, `iconSVG`, `spellIcon`. The HUD
    shows tier pips.
  - **Earth (R66).** `'rock'`/`'crack'` particles and the `'solid'` area style.
  - **Grandmaster (R67–R75).** Rewritten `castGrandmaster`/`updateRituals`, and new
    `drawRitualGround`/`drawRituals`/`drawGlyph`/`drawSword`. The helpers are `despairSpin`,
    `despairRise`, `despairFade`, `inFogR`, `inNightFog`, `fogRetaliate`, `fogGrab` and
    `toGoblin`. Ritual kinds:
    - Redesigned: `despair`, `inversion`, `seal`.
    - New: `doom`, `slumber`, `nightfog`, `fogmini`, `calamity`, `hellfire`, `excalibur`.
  - **Five slots (R76).** `P.spells` has 5 entries, keys 1–5 cast them, and the HUD loops over
    `P.spells.length`.
  - **New enemy state:** `e.sleepT` (asleep: no AI, no contact damage), `e.doomT`, `e.fogCd`.
    Bosses now respect `slowT`, at 55% speed and attack rate.
- `dist\MagicRush.exe` was rebuilt from the final `index.html`. The old `dist\Slaughtermate.exe`
  is still in `dist\` (git-ignored, so local only). The user can delete it.

## How to run

- **Browser:** double-click `index.html`. It works offline.
- **Windows app:** run `powershell -ExecutionPolicy Bypass -File desktop\build.ps1`, then
  `dist\MagicRush.exe`.
- **Tests:** `npm test` (any Node ≥ 18; Node 26 is installed). It should report 102 passing in
  about 3 s.
- **Screenshot check:** see "Visual check" in `CLAUDE.md`. Round 4 used a generator script that
  wrote one scenario page per shot, covering menus, all floors, bosses, the cart, deaths, the shop,
  the logbook and each Grandmaster spell. It lived in the session scratchpad, which may have been
  cleared. Tips:
  - Add a `window.onerror` hook that prints errors on the page.
  - Set `cam.x`/`cam.y` before setting `mouse`.
  - Keep `G.pendingLevels=0`, or the level-up panel covers the scene.
  - For timed spells, call `update(1/60)` in a `setInterval` to fast-forward.

## Decisions made in Round 4, and why

**Decision record:**
- **0005:** fantasy and chess are one render-time `LOOK` switch over a single shared game, with
  lookup tables from the internal chess types to fantasy looks. This keeps gameplay and the random
  sequence identical in both themes, leaves the AI and earlier tests untouched, and keeps one
  offline file. The cost is that internal names (`pawn`, `P.gold`, `'frag'`) no longer match what
  the player sees.

**Agreed with the user before coding** (also in `spec.md`):
- Promotion becomes per-class ranks with the same bonuses and a visual upgrade per rank.
- The chess theme restores the whole Round 3 look and text, gameplay is identical in both themes,
  and the choice is remembered. Chess pieces shatter instead of poofing.
- Poison's icon is a skull. The tier shows as pips.
- Sweet Slumber sleeps for **7 s** ("3 7" was a typo). Damage doesn't wake sleepers, and bosses
  are slowed instead.
- Artificial Calamity transforms only enemies inside the explosion, never bosses. Goblins keep
  their HP percentage.
- Hellfire's "edge" means the edge of the screen.
- Extra slots use keys 4 and 5 and are available from the start.
- The sixth Grandmaster spell is **Excalibur**.
- The floor 5 towers and floor 6 maze stay, reskinned.
- The exe is `MagicRush.exe`, and the storage keys are unchanged.

**Made without being asked** (all reported to the user at the end of Round 4):
- **Theme and art:**
  - The UI is dark green panels on parchment cards with gold trim, titled "⚔ MAGIC RUSH ✦".
  - New wording includes "Hall of Heroes", "VICTORY!", "DEFEATED", "Retreat (end run)",
    "Rank up!" and "The Travelling Merchants".
  - The fantasy theme's crowns and winner mark (⚜) use the crown icon instead of chess symbols.
  - Rank titles: knight Squire…Champion, wizard Novice…Grand Archmage, archer Scout…Legendary
    Archer.
  - Each floor has its own building skin: gnome mushroom houses, wooden houses, bookshelves,
    ruins, witch huts on stilts, and castle halls with red carpets.
  - Decorations don't block movement.
  - The floor 5 towers are mossy witch towers with green fire.
  - Spell descriptions are unchanged, so many still mention the "board", because the user said
    spells are unaffected. The exception is Game of Despair, whose description now mentions the
    crown.
- **Deaths:**
  - Bodies tip over in about 0.3 s and poof after 0.45 s (bosses after 0.9 s).
  - They are only kept within 1100 px of the player, up to 140 at a time.
  - In the chess theme, bosses burst but don't shatter as a piece.
- **Grandmaster numbers** (every one scales +25% per spell level, like the others):

  | Spell | Numbers | Cooldown |
  |---|---|---|
  | Doom Desire | mark 30, delay 5 s; 4 pillars per mark, 520 damage each in 150 px, 0.3 s apart | 44 s |
  | Sweet Slumber | radius 520, pull 330 px/s, 3 s; up to 14 fairies; 2400 damage, sleep 7 s | 44 s |
  | Fog of the Nightmare | 12 circles, radius 140–330, following the player for 12 s; 180 per grab every 0.45 s; the attacker's mini-fog lasts 4 s | 46 s |
  | Artificial Calamity | 600 px slow field, malfunction effects from 5 s, 3600 damage at 8 s | 48 s |
  | Hellfire | wave 1 every 64 px from the left edge, wave 2 every 80 px from the top at 1.3 s, speed 780; 1400 damage in 170 px; fire pit radius 110 for 4 s at 15% damage per second | 40 s |
  | Excalibur | lands at 0.8 s with a 900 shockwave in 240 px; fires at 1.7 s: a 3200 beam, 1600 × 200 px | 42 s |

- **Redesigns:**
  - Grand Seal: glyphs at 68% of the radius (a square about 760 px wide, whose corners can be
    off-screen), and 16 chains (3 per glyph to the portal, plus 4 sides).
  - Mental Inversion's glow lingers 0.35 s after the pulse.
  - Despair's inner ring turns the other way at 1.35× speed.
- **Repository:**
  - README and `package.json` description updated.
  - Launcher title changed.
  - `CLAUDE.md` corrected: `index.html` uses LF, not CRLF.
- **Test fixes:** three mistakes in my own Round 4 tests were fixed:
  - "Tyrant King" was wrongly flagged as chess wording.
  - The pickup text was checked after it had faded.
  - A test variable named `L` clashed with the game.

## Unresolved / not verified

- **No real playtesting.** Round 4 was checked by tests and about 30 headless-Edge screenshots.
  Nobody has played it by hand. Balance hotspots:
  - Hellfire, which can carpet the whole screen.
  - Fog of the Nightmare, which follows you for 12 s.
  - Artificial Calamity's goblin transformation, which makes elite enemies trivial.
  - Five slots make builds much stronger than before. Enemy scaling wasn't retuned.
- **Grandmaster odds and price** (`GM_ODDS`, `GM_PRICE` = 900) are unchanged, but the pool grew
  from 3 to 9, so any particular Grandmaster spell is now rarer.
- **Performance:**
  - Fog of the Nightmare draws 12 large circles three times per frame.
  - Hellfire can have about 30 fireballs plus fire pits.
  - The fantasy ground draws a few shapes per 100 px cell.
  - None of this was profiled on a slow machine.
- **Pitch-black fog** sits under the units, but it still hides spell areas and pickups inside it.
  Check that this is acceptable.
- **The HUD slots** are 68 px wide. Long spell names are cut to 13 characters and can touch the
  "Lv" label.
- **Spell descriptions** still use chess words ("board", "pieces") in the fantasy theme. The user
  said spells are unaffected; ask before rewording.
- **Menu overflow** from earlier rounds is unchanged. The menu panel scrolls at 1280×800, and the
  theme and logbook buttons are below BEGIN THE GAME.
- **Leftover file:** the stray `First commit` file is still in the repo root. It's the user's file.
- **Requirement source:** Round 5's requirements will presumably be added to this file or to
  another handoff file. If they can't be found, ask the user.

## Warnings for the next session

- **Run every visual change in both themes.** It's easy to change the fantasy look and break the
  chess one, or the other way round. Gameplay code must not read `LOOK`, and code that runs for
  only one look must not call `Math.random()`. The R55 test compares the two themes' enemy
  behaviour.
- **Internal names are still chess:**
  - Enemy types are `pawn`…`king` (a goblin is internally a `'pawn'`), and boss types likewise.
  - Promotion is still `P.form`.
  - Loot pickups are `k:'frag'` even in the fantasy theme, where they are gold bars.
  - `G.cart.pawns` holds the merchants.

  Older tests depend on these names, so don't rename them.
- **`FLOOR_THEMES` is the chess list.** The R19–R26 tests read it directly. Fantasy floors are
  `FANTASY_FLOORS`, and code should use `G.theme` or `themeFor()`. Changing the chess list's
  structure counts also changes the fantasy floors, because they copy them.
- **Grandmaster rituals** are cleared by `startFloor`, not by `onBossDown`, as in Round 3. There
  is now only one Fog of the Nightmare at a time (casting it again replaces the old one), and
  mini-fogs end when their enemy dies.
- **Sleeping enemies** (`sleepT`) still count toward the spawn cap and can be pushed by knockback
  and pulls. Mind control is cleared when an enemy falls asleep.
- **`toGoblin`** marks the old enemy dead without a kill, score or loot, and spawns a fresh
  goblin. Anything that counts kills or deaths should keep that in mind.
- **Committing handoff files and `CLAUDE.md`:** in Round 4 the permission check once refused to
  commit them. A later commit went through after the user explicitly asked for it. If it's
  refused, ask the user.
