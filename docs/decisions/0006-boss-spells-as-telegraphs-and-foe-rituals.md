# 0006. Let bosses cast spells by translating each spell kind into telegraphed enemy attacks, and reuse the Grandmaster rituals with a `foe` flag

- Status: accepted
- Date: 2026-11-20
- Round: 5
- Requirements: R84 (bosses cast weaker spells of their tiers), R78 (the Merchant's weakened tier 1-4
  spells), R82 (the Grandmaster casts every Grandmaster spell except Hellfire, with a longer wind-up
  and a smaller area, and his Mental Inversion buffs enemies)

## Context

Round 5 makes every boss a spellcaster. The six floor bosses and the Merchant draw from the 75 tier
1–5 spells, and the Grandmaster draws from 8 of the 9 Grandmaster spells. The player's spells were
written for one direction only:
- `fireSpell` aims at the mouse and damages `G.enemies` through `damageCircle` / `damageLine` /
  `chain`.
- Bolts are `G.pproj`, zones are `G.zones`, and strikes are `G.pstrikes`. All of them hit enemies.
- The Grandmaster spells are multi-stage rituals in `G.rituals`. `updateRituals` pulls, slows,
  freezes, puts to sleep and damages enemies, and `drawRitualGround` / `drawRituals` draw them.

Enemy attacks have their own path: `shootE` (`G.eproj`), `hzCircle` / `hzLine` (`G.hazards`), and
`damagePlayer(d, source)`, which also applies armour, iframes and Fog of the Nightmare retaliation
(R72). The client asked for the boss spells to be *weaker*, and the user agreed that freeze, stun
and sleep become a short slow on the player.

## Options considered

1. **Translate each tier 1–5 spell *kind* into existing enemy attacks, and run the Grandmaster
   spells as the same rituals with `foe:true`** (chosen).
   - `bossCast(b, id)` maps the spell's kind to attacks:
     - bolt: `shootE`
     - nova and psystrike: `hzCircle` around the boss
     - meteor and rain: `hzCircle` at the player
     - beam and chain: `hzLine`
     - zone: a new `G.ezones` entry
     - orbit: a ring of shots
   - Each attack is tagged with the element so it keeps the element's colours and particles. Damage
     comes from the boss's own `edmg(b)`, and stun, freeze, sleep and slow become `P.slowT`.
   - `bossGM(b, id)` pushes the normal ritual objects with `foe:true` and an 18% smaller radius.
     Inside `updateRituals`, every place that touches enemies has a `foe` branch that hurts, drags
     or slows the player instead. The Grandmaster's Mental Inversion buffs enemies.
2. **Generalise the spell system around a "caster" and a "target team"**, so `fireSpell(d, lvl,
   caster, team)` works both ways. It's the most uniform option, but every damage helper, zone,
   strike, beam and the 9 rituals would need a team parameter. The earlier rounds' spell code and
   its 40+ tests would all be touched, and player-only behaviour (cursor aim, `P.spellMult`, crits,
   weaken, toGoblin, mind control) would need guarding everywhere.
3. **A separate, hand-made enemy spell list** (for example 10–15 "boss spells" per tier). It's
   simple to balance, but the requirement says the bosses use the game's own tiers. Their spells
   would no longer be recognisable as Fireball or Earthquake, and the Grandmaster's "casts any of
   the grandmaster tier spells" couldn't be met without the rituals anyway.
4. **Call `fireSpell` as-is, with a fake mouse pointing at the player**, and a flag that redirects
   damage. It's cheap at first, but the spells would still damage enemies (other bosses' minions)
   and would get the player's spell multipliers and crits. The redirect flag would leak into every
   damage helper.

## Decision (Y-statement)

In the context of **making bosses cast the player's tiered and Grandmaster spells in a single-file
game whose spell code only targets enemies**, facing **75 tiered spells in about 11 kinds, 8
multi-stage rituals, and a requirement that boss spells be weaker and recognisable**, we decided
for **translating each spell kind into the existing telegraphed enemy attacks (`bossCast`), tagged
with the element, and replaying the Grandmaster rituals with a `foe` flag (`bossGM`) whose branches
hurt the player instead of enemies**, and neglected **a caster/team abstraction over the whole spell
system, a separate hand-made boss spell list, and redirecting `fireSpell` with a fake cursor**, to
achieve **the readable red telegraphs players already dodge, element looks that show which spell is
coming, damage tied to each boss's own strength (so weakening and difficulty carry over through
`edmg`), identical ritual visuals for the Grandmaster, and untouched player spell code and earlier
tests**, accepting **that tier 1–5 boss spells are simplified (a Fireball is a slower glowing bolt, a
zone is a damaging circle, chains become a line strike), that `updateRituals` now has a `foe`
branch in every ritual it shares with the Grandmaster, and that a new Grandmaster spell needs a foe
version written alongside its player version**.

## Consequences

- `BOSS_SPELL_TIERS` is the single table for "boss N casts tiers …". The Merchant uses tiers 1–4
  with a 0.45 multiplier, and the Grandmaster uses `GM_FOE_SPELLS` (Hellfire left out) through his
  `gmspell` attack.
- Spells are cast about every 7 s (`BOSS_SPELL_FIRST` = 4, then `BOSS_SPELL_EVERY` = 7) on top of
  each boss's own attack timer. The timer is deterministic, so the random sequence at boss spawn is
  unchanged and older seeded tests still pass.
- `G.ezones` (enemy zones) and `P.slowT` (the player's slow) are new state. Hazards and enemy bolts
  carry `el` and `slow` fields.
- The player's own Fog of the Nightmare helpers (`inNightFog`, `fogRetaliate`, the one-fog rule)
  ignore foe rituals, so the boss's fog can't be mistaken for the player's.
- The doom pillars chase the player through a small proxy object (`PT`), so the doom ritual's
  drawing code is shared unchanged.
