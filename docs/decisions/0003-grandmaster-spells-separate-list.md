# 0003. Keep the Grandmaster spells in their own list, as a sixth tier with its own reward card

- Status: accepted
- Date: 2026-11-19
- Round: 3
- Requirements: R51–R54 (Grandmaster tier), with R8, R9, R12 and R33 (tier rules and fair
  randomness) and R49 (logbook)

## Context

Round 3 adds a Grandmaster tier above tier 5 with three special spells that have no shared theme.
The earlier rounds' rules and tests all assume that `SPELLS` holds exactly tiers 1–5:
- every tier has 15 spells, one per element (R33);
- tier medians rise from 1 to 5 (R8);
- the R17 test buckets particle counts by tiers 1–5;
- the R12 test checks that level-up cards eventually offer exactly `SPELLS.length` distinct spells.

The new spells must still be obtainable fairly (R12), equippable in the 1/2/3 slots, sold at the
cart, and listed in the logbook.

## Options considered

1. **A separate `GM_SPELLS` list with `tier: 6`, joined with `SPELLS` into `ALL_SPELLS` for lookups
   and the logbook. Level-ups offer them as their own card type (`'gm'`).** (chosen)
2. **Add the three spells to `SPELLS` with `tier: 6`.** One list and fewer special cases, but every
   tier loop and the R17 and R12 tests would need changing, and R33's "every tier covers every
   element" would be false unless it were reworded.
3. **Make them tier 5 spells with a "grandmaster" flag.** No new tier number, but the requirement
   says they rank *above* tier 5, and they would also flood the tier 5 shuffle bag and break R33's
   one-per-element rule.
4. **Make them a separate ability kind outside the spell system** (a fourth button, or a one-shot
   item). Clear separation, but it adds a control that Rule 6 doesn't define, and they couldn't
   level up, be sold, or appear in the logbook like other spells.

## Decision (Y-statement)

In the context of **adding a sixth, Grandmaster spell tier to a game whose tier 1–5 spell table
is pinned by earlier requirements and tests**, facing **the need to make the new spells
obtainable, fair, equippable and listed in the logbook without breaking the tier 1–5 rules**, we
decided for **a separate `GM_SPELLS` list (tier 6) joined with `SPELLS` into `ALL_SPELLS`, with
its own shuffle bag, a rare `'gm'` reward card from floor 4 on, and one cart slot from floor 4
on** and neglected **folding them into `SPELLS`, disguising them as flagged tier 5 spells, and a
separate ability button**, to achieve **untouched tier 1–5 behaviour and tests, normal
slot/level-up/shop/logbook handling, and a clear "Grandmaster" identity on cards and in the HUD**,
accepting **two spell lists to keep in mind (code that needs every spell must use `ALL_SPELLS` and
`SPELL_BY_ID`, not `SPELLS`) and a special case in `fireSpell` that sends tier 6 to
`castGrandmaster`**.

## Consequences

- `drawSpell(t)` now draws from `ALL_SPELLS`, so `drawSpell(6)` (`drawGM`) uses the same
  shuffle-bag fairness as the other tiers.
- `makeCards` offers at most one Grandmaster card per level-up. The chance per card is 2%, 3.5%
  or 5% on floors 4, 5 and 6, plus 0.3% for each card since the last one (`G.gmPity`).
- The three spells run as timed "rituals" (`G.rituals`) instead of the generic zone and strike
  objects, because each has a multi-stage animation (gathering, then the burst).
