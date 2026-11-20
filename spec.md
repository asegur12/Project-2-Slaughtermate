# Magic Rush (formerly Slaughtermate) — Specification

Source documents (in this repository):

- `Project_2.txt`: the problem statement, the Round 1 requirements and the Round 2 requirements.
  It acts as both the problem file and the spec source.
- `Project_2_CLAUDE_rules.txt`: rules the generating agent must follow (cited below as Rule 1–10).
- Round 3 requirements: the "==ROUND 3 RUN==" section that the user added to `handoff-round-2.md`.
  `Project_2.txt` stops at Round 2.
- Round 4 requirements: the "==ROUND 4 CHANGES AND ADDITIONS==" section that the user added to
  `handoff-round-3.md`, plus the user's answers to the clarifying questions (marked *Clarified*
  below). There is no `problem.md`.

Requirement IDs are stable across rounds. Round 1 requirements had no IDs in the source; they were
numbered R1–R16 in Round 2 so tests can refer to them. A requirement that a later round changes keeps
its ID and gets an "Amended in Round N" note.

## Problem

A client who enjoys chess and hack'n'slash games wants a game that combines both: chess for the look,
hack'n'slash for the gameplay. The player gains weapons and spells and fights waves of enemies and
bosses. The game must run fully offline.

*Amended in Round 4:* the client found that the chess look clashed with the spells and weapons. The
game is now **Magic Rush**, a fantasy medieval hack'n'slash (R55–R64). The chess look remains as an
optional theme chosen on the start screen (R62). Requirements below that describe the chess look (R1,
R6, R13, R20–R25, R46, R48) still hold in the chess theme. Their fantasy counterparts are R55–R64.

## Round 1 requirements (baseline, already implemented)

- **R1** The player is a white chess pawn, enemies are black chess pieces, and bosses are giant
  checkered pieces (Rule 2).
  *Amended in Round 4:* this applies to the chess theme only. The default fantasy theme uses R56–R58.
- **R2** The game has a large map with structures such as cities or castles.
- **R3** Large swarms of enemies spawn on the outskirts of the map and come toward the player from all
  sides.
- **R4** Each enemy piece type has its own movement and attacks (Rule 10).
- **R5** There are 6 bosses, one giant piece of each kind. Each ends a wave and must be killed before
  the next wave begins.
  *Amended in Round 3:* after the boss dies, the floor ends at the merchant cart (R46, R47), not with
  an automatic shop screen.
- **R6** The player is promoted through the other 5 pieces as the waves go on.
  *Amended in Round 4:* in the fantasy theme, promotion gives a rank title for the player's class
  (for example Squire → … → Champion) with the same stat bonuses. Each rank adds a small visual
  upgrade (R56).
- **R7** The player picks 1 weapon class per run. Round 1 classes: Sword (melee slashes, spin slash
  charged attack), Bow (ranged shots, big arrow charged attack), Staff (ranged area attacks, big magic
  blast charged attack), Hammer (melee area attacks, giant slam charged attack).
  *Amended in Round 2:* four more classes are added (R28–R31).
- **R8** Spells come in 5 rarity tiers: tiers 1–2 are small-scale, tiers 3–4 deal large damage in
  larger areas, tier 5 deals massive damage over massive areas.
  *Amended in Round 3:* a sixth tier, Grandmaster, ranks above tier 5 (R51).
- **R9** The player can equip 3 spells at once. Each tier has 5 to 8 spells.
  *Amended in Round 2:* the 5–8 cap is replaced by R33 (every tier has one spell of every element).
  *Amended in Round 4:* the player can equip 5 spells (R76).
- **R10** The highest-tier spells include sun, moon, darkness, light, tech and hyper types.
- **R11** Enemies scale up in HP and strength with each floor and level gained, survive powerful
  attacks, and can kill the player in the late game.
- **R12** Rewards are random but fair: every spell has a fair chance of being offered.
- **R13** A shop sells spells and other items.
  *Amended in Round 3:* the shop is a merchant cart in the centre of the map (R46, R47), it is paid in
  chess-piece fragments (R48), and it also sells a Grandmaster spell (R51).
  *Amended in Round 4:* in the fantasy theme the shop takes gold (R64) and is run by merchants (R61).
- **R14** Controls: W A S D move, left click is a basic attack aimed at the mouse, holding and releasing
  left click is a charged attack, 1 2 3 cast the equipped spells (Rule 6).
  *Amended in Round 2:* Space dashes (R32). *Amended in Round 3:* Escape closes the shop (R47).
  *Amended in Round 4:* 4 and 5 cast the two extra spell slots (R76).
- **R15** Before playing, the menu shows a scoreboard with each run's highest floor and score (Rule 8).
- **R16** The game runs fully offline with no internet connection (Rule 5).

## Round 2 requirements

### Visual effects

- **R17** Spells are flashier: sparkles, particle effects and slight extra detail (trails, glints,
  element-specific particles). Effects scale with spell tier.
  *Amended in Round 3:* coloured sparkles are replaced by each element's own particles and area effects
  (R36–R45). Only small white glints stay common to every spell.
- **R18** Enemy attacks get the same treatment: enemy projectiles leave glowing trails, and boss
  telegraphs pulse and burst with sparks and debris when they land.

Rule 3 and Rule 7 ask for simple, non-flashy effects. R17–R18 are newer client requests and override
those rules for spell and attack effects only. Piece animation stays simple (bob, sway, shake).

### Floors and maps

- **R19** Each floor has its own map. A new map, with a new layout and colour theme, is generated when
  the player enters each floor.
- **R20** Floor 1, "Opening": lighter, cool colours and minimal structures.
- **R21** Floor 2, "Early Game": slightly darker than floor 1, with more structures.
- **R22** Floor 3, "Midgame": the Round 1 map, with the same colours and structure counts
  (4 castles, 7 towns of 5–8 houses).
- **R23** Floor 4, "Middle Gambit": darker but not too dark, with slightly more structures than floor 3.
- **R24** Floor 5, "Climax": quite dark, mostly red and orange, more structures than floor 4, and
  hostile structures. *Clarified:* the hostile structures are destructible watchtowers that fire slow
  projectiles at a nearby player.
- **R25** Floor 6, "Endgame": purple with black, white and gold, and a slightly maze-like layout. The
  maze must stay fully walkable, with no sealed-off areas.
- **R26** The floor's name is shown when the player enters it (banner and HUD).

*Amended in Round 4:* R20–R25 describe the chess theme's floors. The fantasy theme replaces them with
the six maps in R59, which keep the same structure counts, the hostile towers on floor 5 and the maze
layout on floor 6. R19 and R26 apply to both themes.

### Difficulty

- **R27** The player chooses a difficulty on the menu before playing. *Clarified values:*

  | Difficulty | Enemy HP | Enemy damage | Enemy projectile speed | Score multiplier |
  |---|---|---|---|---|
  | Easy | ×0.7 | ×0.65 | ×0.9 | ×0.75 |
  | Normal | ×1 | ×1 | ×1 | ×1 |
  | Hard | ×1.4 | ×1.35 | ×1.2 | ×1.5 |

  Multipliers apply to normal enemies, bosses and hostile structures. The scoreboard shows each run's
  difficulty.

### Weapons and controls

- **R28** Scythe: the basic attack hits a semicircle (180°) in front of the player. The charged attack
  is a crude slash that heals the player for part of the damage dealt.
- **R29** Shield: the basic attack is a forward bash with heavy knockback. The charged attack is a
  wider, stronger rush forward that damages everything in its path.
- **R30** Club: the basic attack slams a rectangular area in front of the player. The charged attack
  is a wind-up swing followed by 3 chain explosions moving outward.
- **R31** Tome: the basic attack fires 3 spirits that pierce and inflict short damage over time. The
  charged attack is a large burst of 9 spirits plus pushback around the player.
- **R32** Dash: pressing Space dashes the player a short distance toward the cursor. The dash has a
  1-second cooldown.

### Spells

- **R33** Every tier has at least one spell of every element. Where a tier already had a spell of an
  element, no new one was added for it. Elements: fire, ice, lightning, earth, wind, nature, poison,
  arcane, light, sun, moon, darkness, tech, hyper and mind, so each tier has 15 spells (75 in total).
  This replaces R9's limit of 5–8 per tier.
- **R34** The new element Mind uses psychic power to deal damage over time, with one Mind spell per
  tier. The tier 1 spell is inspired by Pokémon's "Psychic" (a telekinetic wave that also weakens the
  target), and the tier 5 spell by "Psystrike" (a huge materialised psychic wave). Both have original
  names and designs.
- **R35** Some spells have slight wind-ups. *Clarified:* only heavy tier 3–5 spells, with wind-ups of
  0.2–0.6 s. The player can move during the wind-up, a visible charge-up plays, and the spell fires at
  the cursor's position when the wind-up ends. Tier 1–2 spells stay instant.

## Round 3 requirements

### Spell designs (each element is recognisable at a glance)

Every spell's particles, projectiles and area effects take their element's own look. "Area effect"
means lingering zones and the flash of novas, strikes and explosions. Earth is not mentioned in the
source, so it keeps its Round 2 look.

- **R36** Fire keeps its colour, but its particles are flames instead of sparkles and its area
  effects burn as fire. Sun turns a deeper red. Its particles are jagged crescent outlines, both
  large and small, and its area effects are a deep red domain.
- **R37** Ice projectiles are snowflakes, ice particles are snowflakes, and ice area effects are
  sheets of ice.
- **R38** Poison particles are skull outlines and poison area effects are poison puddles.
- **R39** Lightning projectiles are thunderbolts, its particles are small zigzag lines, and its area
  effects are grey with lightning flashing inside.
- **R40** Arcane particles are assorted geometric shapes, larger than other elements' particles,
  and its area effects are a periwinkle portal. Hyper particles are chess-piece outlines in the
  hyper colour, and its area effects are unchanged.
  *Note (Round 4):* the theme change doesn't affect spells, so hyper keeps chess-piece outlines in
  both themes.
- **R41** Tech area effects are a grid and its particles are pixels. Mind particles are large
  circles and its area effects warp through colours.
- **R42** Moon particles are stars and its area effects are a night sky.
- **R43** Light adds more streak lines, with area effects unchanged. Darkness particles are spirits
  and its area effects are a dark purple void with hands reaching out of it.
- **R44** Nature area effects are vines and tree spikes, and its particles are leaves.
- **R45** Wind particles are clouds and its area effects are fog.

### Shop

- **R46** The shop is a merchant cart with 3 white pawns beside it, in the centre of the map.
  *Amended in Round 4:* in the fantasy theme the pawns are merchants (R61).
  *Clarified:* the cart appears only once the floor's boss has died, on floors 1–5. Beating the
  floor 6 King still ends the run.
- **R47** Touching the cart opens the shop. Pressing Escape, or the advance button, closes the shop
  and starts the next floor. *Clarified:* the shop never opens by itself.
- **R48** The currency is chess-piece fragments. Pickups, the HUD and the shop show them as shards,
  and no text calls them gold. Amounts and prices are unchanged from Round 2.
  *Amended in Round 4:* this applies to the chess theme only. The fantasy theme uses gold bars (R64).

### New features

- **R49** The menu has a spell logbook that lists every obtainable spell (tiers 1–5 and
  Grandmaster). A locked entry shows only its tier. *Amended in Round 4:* the six new
  Grandmaster spells (R70–R75) bring the total to 84 entries. *Clarified:* a spell unlocks when the player
  obtains it in a run: the starting spell, a level-up reward or a shop purchase. Unlocks are saved
  across runs.
- **R50** Each weapon card on the menu shows a crown once a run has been won with that weapon. The
  crown is small for Easy, medium for Normal and large for Hard. Only the biggest crown earned is
  shown, and crowns are saved across runs.
- **R51** A new spell tier, Grandmaster, ranks above tier 5. Its spells are much stronger than tier
  5, hit huge areas and are very flashy, with no shared theme. *Clarified:* they are offered rarely
  as their own reward card from floor 4 on, using a separate shuffle bag and a pity counter, and the
  cart sells one at a high price from floor 4 on. They use the normal 1/2/3 slots. R33's
  one-spell-per-element rule covers tiers 1–5 only.
  *Amended in Round 4:* six more Grandmaster spells (R70–R75) bring the total to 9. They can go in
  any of the five slots (R76).
- **R52** Game of Despair: a huge black-and-white domain covers the target area. Phantom chess
  pieces circle and dance inside it, feeding a large orb at the centre, which then bursts for huge
  damage and weakens every enemy it hits. Weakened enemies take more damage and deal less.
  *Amended in Round 4:* see R67 (a second ring, the slow-down and rise, and a crown instead of an orb).
- **R53** Mental Inversion: a pulse mind-controls the normal enemies it hits, so they attack the
  other enemies instead of the player. *Clarified:* every enemy a controlled piece kills explodes
  and damages the enemies around it. The control wears off after a few seconds, and bosses are
  immune.
  *Amended in Round 4:* the pulse is more vivid (R68).
- **R54** Grand Seal: chains surround a huge area, 5 portals open and pull enemies in, and then the
  seal explodes, damaging the enemies inside and freezing them.
  *Amended in Round 4:* replaced by the R69 design: crimson, with 4 glyphs in a square chained to one
  large portal. It still pulls enemies in, explodes and freezes them.

## Round 4 requirements

### Theme: fantasy medieval replaces chess

- **R55** Every chess part of the game gets a simple fantasy medieval look, so that the magic and
  the weapons fit in. Enemy behaviour (R4) and boss attacks are unchanged. Only looks and names
  change, and designs stay simple (Rule 3, Rule 7).
- **R56** The player's look depends on the weapon class: a knight for the Sword, Hammer, Shield, Club
  and Scythe, a wizard for the Tome and Staff, and an archer for the Bow. *Clarified:* promotion (R6)
  becomes a rank title for each class with the same bonuses. Each rank adds a small visual upgrade:
  a cape, a plume, gold trim, pauldrons, then a crown.
- **R57** Enemies: pawns become goblins, knights become skeletons, bishops become apprentice mages,
  rooks become minotaurs, queens become witches and kings become royal guards.
- **R58** Bosses: the Iron Pawn becomes the Goblin Chief, the Mad Knight the Evil Prince, the
  Cardinal Bishop the Red Mage, the Siege Rook the Red Dragon, the Black Queen the Witch Queen, and
  the Checkered King the Tyrant King.
- **R59** The chess board is gone. The six floors are:
  1. **The Great Plains**: a grassy field with trees and gnome villages.
  2. **The Old Village**: a grassy town with wooden houses and structures.
  3. **The Magic School**: a vast azure library with bookshelves and study halls.
  4. **The Dragon Ruins**: a stony area covered in ruins and gems.
  5. **The Royal Witch Swamp**: a green swampy marsh just outside the royal castle.
  6. **The Evil King's Castle**: a black, gold and red castle with pillars, statues and halls.

  *Clarified:* the floor 5 watchtowers (R24) stay, as witch towers, and the floor 6 maze (R25) stays,
  as the castle's halls. The structure counts on each floor are unchanged.
- **R60** The UI gets a fantasy medieval theme, with the look chosen by the agent. Chess text such as
  "Checkmate" and "The board waits for your move" is rewritten. The game is renamed **Magic Rush**.
  *Clarified:* the exe becomes `MagicRush.exe`. Saved scores, the logbook and crowns keep their
  storage keys, so nothing is lost.
- **R61** The pawns beside the merchant cart become merchants.
- **R62** A button on the start screen switches to the chess theme, and back again.
  *Clarified:* the chess theme restores the whole Round 3 look and text: the pieces, the boards, the
  name Slaughtermate, fragments and the pawn merchants. Gameplay is the same in both themes,
  including the new spells, spell icons and slots. The game remembers the choice between sessions.

### Other changes

- **R63** Death animations: enemies and the player fall over and vanish in a puff, and bosses release
  a large burst when defeated. *Clarified:* in the chess theme, pieces shatter instead of falling
  over.
- **R64** The currency is gold again, shown as gold bars (not coins). This applies to the fantasy
  theme.

### Spells

- **R65** Each spell shows an icon for its element instead of stars:
  - fire: a flame
  - earth: rocks
  - sun: the sun
  - moon: a crescent moon
  - light: a single 4-pointed star
  - darkness: a hand
  - tech: the power (on/off) symbol
  - ice: a snowflake
  - nature: a tree
  - hyper: a circle, a triangle and a square
  - arcane: a swirl
  - wind: a tornado
  - lightning: a cloud with a thunderbolt
  - mind: an eye
  - Grandmaster: a crown

  *Clarified:* poison, which the list leaves out, is a skull. Icons appear in the HUD spell slots, on
  reward and shop cards, and in the logbook. The tier still shows, as small pips or a label.
- **R66** Earth spells: the particles are cracks and rocks, and area overlays are solid brown.
- **R67** Game of Despair: only the look changes, and it keeps its chess pieces. A second ring of
  pieces dances around the centre. Near the end the pieces slow down, then rise and fade just before
  the burst. The orb that gathers energy becomes a crown, which shatters just before the burst.
- **R68** Mental Inversion: the pulse is more vivid and easier to see.
- **R69** Grand Seal turns crimson red and gets a new design. Instead of 5 portals in a star, 4 glyphs
  (the Mental Inversion glyph design) form a large, spaced-out square. Many straight chains (not
  rings) run from the glyphs to one large central portal, which pulls enemies in before the explosion
  and the freeze.
- **R70** Doom Desire (Grandmaster): fires a weak line at every enemy on screen, which marks it with
  doom and slows it. After 5 seconds, many large pillars of grey magic repeatedly smite each marked
  enemy, dealing damage in a large area around it.
- **R71** Sweet Slumber (Grandmaster): a very strong breeze of fairy magic drags enemies into a
  vortex for 3 seconds while fairy outlines form inside it. Then the fairies crack and explode,
  dealing large damage and putting enemies to sleep for 7 seconds. *Clarified:* damage doesn't wake
  sleeping enemies. Bosses are slowed instead of put to sleep.
- **R72** Fog of the Nightmare (Grandmaster): a pitch-black fog surrounds the player, made of a swarm
  of large and very large circles. Fog hands keep attacking enemies inside it. An enemy outside the
  fog that attacks the player gets a small fog of its own.
- **R73** Artificial Calamity (Grandmaster): a futuristic reactor slows the enemies around it. After
  8 seconds it malfunctions and explodes for massive damage, turning enemies into goblins.
  *Clarified:* only enemies inside the explosion are transformed. Bosses take the damage but aren't
  transformed. Transformed enemies become goblins scaled to the floor and keep their HP percentage.
- **R74** Hellfire (Grandmaster): crimson fireballs bombard the battlefield, first flying in
  horizontally from the edge, then vertically. When a fireball touches its first enemy, it causes a
  large explosion and leaves a burning pit of fire. *Clarified:* "edge" means the edge of the screen.
- **R75** A sixth new Grandmaster spell, chosen by the agent. *Clarified:* **Excalibur**, from
  Arthurian legend. A giant golden sword falls at the cursor and plants itself with a shockwave, then
  fires a huge beam of light in the aimed direction.
- **R76** The player gets 2 extra spell slots, for 5 in total. *Clarified:* keys 4 and 5 cast them,
  and all five slots are available from the start.

## Testing

- Tests run with Node's built-in runner (`npm test` or `node --test tests/`), with no dependencies.
- The tests load the game script from `index.html` into a Node `vm` context with a stubbed DOM and
  canvas (see `docs/decisions/0001-test-game-in-node-vm.md`).
- Every test name starts with the requirement ID it checks. Round 1 regression tests (R1–R16) live in
  `tests/round1.test.js`, Round 2 tests (R17–R35) in `tests/round2.test.js`, and Round 3 tests
  (R36–R54) in `tests/round3.test.js`. Round 4 tests (R55–R76) are in `tests/round4.test.js`.
- Older tests that check the chess look switch to the chess theme first. Each of these changes
  carries an "Amended in Round 4" comment.
