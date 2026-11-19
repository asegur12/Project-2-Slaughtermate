# 0002. Generate the floor 6 "slightly maze-like" map as a loopy spanning-tree maze

- Status: accepted
- Date: 2026-11-19
- Round: 2
- Requirements: R25 (Endgame map is slightly maze-like), R19 (a new map every floor), R3 (swarms
  reach the player from all sides)

## Context

Floor 6 must feel "slightly maze-like" while still working as a hack'n'slash arena. Swarms walk
straight at the player, rooks and queens charge, and the Checkered King boss doesn't collide with
walls. The other floors are built by randomly placing castles and towns, and every floor's map is
regenerated when the player arrives (R19).

## Options considered

1. **Random spanning-tree maze on an 8×8 grid of 400px rooms, then knock out about a third of the
   remaining walls, and always open the four walls around the centre** (chosen).
2. **A perfect maze** (spanning tree only). It's clearly a maze, but every route is a single
   winding path, so enemies pile up in dead ends and the player can be cornered. That's too much
   maze for "slightly".
3. **A hand-made fixed layout.** Easy to tune, but the same every run, which goes against the
   Round 2 wish for maps to feel fresh and change between floors.
4. **Scattered pillars and short wall pieces only.** Always walkable, but it doesn't read as a
   maze.

## Decision (Y-statement)

In the context of **building the floor 6 "Endgame" map for a swarm-based hack'n'slash**, facing
**the need to look and feel maze-like while staying fully walkable, letting swarms and charging
pieces reach the player, and staying different every run**, we decided for **a randomised
depth-first spanning-tree maze over 400px rooms with about 33% of the extra walls removed and the
centre room always open** and neglected **a perfect maze, a fixed hand-made layout, and
pillars-only scatter**, to achieve **a board that reads as a maze from the minimap, has loops and
wide routes so fights don't end in dead ends, and is connected by construction**, accepting
**less control over exact corridor shapes, some long detours for enemies (helped by their existing
sidestep logic and knights hopping walls), and a flood-fill test (`walkable()`) as the guard
against sealed-off areas**.

## Consequences

- Any spanning tree connects every room, and removing walls can't disconnect anything, so the map
  is always walkable. The tests confirm this on every floor with a 20px flood fill.
- Wall segments stop 14px short at each junction for a cleaner look. The gaps are narrower than
  the player, so they don't create shortcuts.
- The same generator can be reused if a later round adds maze sections to other floors.
