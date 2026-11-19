# Slaughtermate — Specification

Source documents (in this repository):

- `Project_2.txt`: the problem statement, the Round 1 requirements and the Round 2 requirements.
  It acts as both the problem file and the spec source.
- `Project_2_CLAUDE_rules.txt`: rules the generating agent must follow (cited below as Rule 1–10).

Requirement IDs are stable across rounds. Round 1 requirements had no IDs in the source; they were
numbered R1–R16 in Round 2 so tests can refer to them. A requirement that a later round changes keeps
its ID and gets an "Amended in Round N" note.

## Problem

A client who enjoys chess and hack'n'slash games wants a game that combines both: chess for the look,
hack'n'slash for the gameplay. The player gains weapons and spells and fights waves of enemies and
bosses. The game must run fully offline.

## Round 1 requirements (baseline, already implemented)

- **R1** The player is a white chess pawn, enemies are black chess pieces, and bosses are giant
  checkered pieces (Rule 2).
- **R2** The game has a large map with structures such as cities or castles.
- **R3** Large swarms of enemies spawn on the outskirts of the map and come toward the player from all
  sides.
- **R4** Each enemy piece type has its own movement and attacks (Rule 10).
- **R5** There are 6 bosses, one giant piece of each kind. Each ends a wave and must be killed before
  the next wave begins.
- **R6** The player is promoted through the other 5 pieces as the waves go on.
- **R7** The player picks 1 weapon class per run. Round 1 classes: Sword (melee slashes, spin slash
  charged attack), Bow (ranged shots, big arrow charged attack), Staff (ranged area attacks, big magic
  blast charged attack), Hammer (melee area attacks, giant slam charged attack).
  *Amended in Round 2:* four more classes are added (R28–R31).
- **R8** Spells come in 5 rarity tiers: tiers 1–2 are small-scale, tiers 3–4 deal large damage in
  larger areas, tier 5 deals massive damage over massive areas.
- **R9** The player can equip 3 spells at once. Each tier has 5 to 8 spells.
  *Amended in Round 2:* the 5–8 cap is replaced by R33 (every tier has one spell of every element).
- **R10** The highest-tier spells include sun, moon, darkness, light, tech and hyper types.
- **R11** Enemies scale up in HP and strength with each floor and level gained, survive powerful
  attacks, and can kill the player in the late game.
- **R12** Rewards are random but fair: every spell has a fair chance of being offered.
- **R13** A shop sells spells and other items.
- **R14** Controls: W A S D move, left click is a basic attack aimed at the mouse, holding and releasing
  left click is a charged attack, 1 2 3 cast the equipped spells (Rule 6).
  *Amended in Round 2:* Space dashes (R32).
- **R15** Before playing, the menu shows a scoreboard with each run's highest floor and score (Rule 8).
- **R16** The game runs fully offline with no internet connection (Rule 5).

## Round 2 requirements

### Visual effects

- **R17** Spells are flashier: sparkles, particle effects and slight extra detail (trails, glints,
  element-specific particles). Effects scale with spell tier.
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

## Testing

- Tests run with Node's built-in runner (`npm test` or `node --test tests/`), with no dependencies.
- The tests load the game script from `index.html` into a Node `vm` context with a stubbed DOM and
  canvas (see `docs/decisions/0001-test-game-in-node-vm.md`).
- Every test name starts with the requirement ID it checks. Round 1 regression tests (R1–R16) live in
  `tests/round1.test.js`, Round 2 tests (R17–R35) in `tests/round2.test.js`.
