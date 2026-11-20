# 0004. Drive each element's look from two lookup tables instead of per-spell art

- Status: accepted
- Date: 2026-11-19
- Round: 3
- Requirements: R36–R45 (element spell designs), with R17 (spell sparkles) amended

## Context

The client found the Round 2 sparkles made spell types hard to tell apart and gave each element
its own particles and area effects. There are 75 tiered spells across 15 elements, and they use
about ten mechanical kinds (bolt, nova, zone, rain, meteor, beam, orbit, chain, and so on). The
Round 2 effects called the generic `sparkle`/`sparkRing`/`sparkLine` helpers with the element's
colour from many places.

## Options considered

1. **Two tables keyed by element, `EL_PART` (particle shape) and `EL_AREA` (area style). Element
   helpers (`elPart`, `elementFx`, `elRing`, `elLine`) and one `drawArea(el, ...)` renderer replace
   the coloured sparkles in every spell path.** (chosen)
2. **Hand-made visuals per spell** (75 custom effects). The most distinctive option, but a huge
   amount of code in a single-file game, and inconsistent across the elements.
3. **Per-kind visuals with element colour tints** (keep Round 2 and only recolour). Little work,
   but it doesn't meet the request: shapes like skulls, snowflakes, hands and grids are the point.
4. **Pre-rendered sprite images embedded as data URIs.** Rich art, but much larger, harder to
   tweak, and at odds with Rule 3/Rule 7's simple shapes-and-lines style.

## Decision (Y-statement)

In the context of **making 15 spell elements recognisable at a glance across 75 spells and about
10 spell kinds**, facing **effect code spread over every spell kind and a single offline HTML file
with no assets**, we decided for **two element lookup tables (`EL_PART`, `EL_AREA`), element-aware
particle helpers, a table of particle renderers (`PART_DRAW`) and one `drawArea` function, all
drawn with simple canvas shapes**, and neglected **per-spell custom art, recolouring only, and
embedded sprites**, to achieve **a consistent look per element for every spell and kind, small
code, and tests that can check each element's particle shape and area style directly**, accepting
**that spells of one element share a look (a tier 1 and a tier 5 fire spell differ in size and
amount, not motif), and that hyper, light and earth keep the Round 2 area look as the requirements
ask**.

## Consequences

- Coloured sparkles no longer appear on spells. Small white glints remain on every spell, which
  keeps R17's "sparkles" and lets the Round 2 R17 test pass unchanged.
- Earth isn't named in the Round 3 requirements, so it keeps its debris particles and plain area.
- Enemy attacks still use the Round 2 sparkles (R18), so player spells and enemy attacks are
  easy to tell apart.
- `drawArea` returns the style it drew, so tests can check the mapping without pixel comparisons.
