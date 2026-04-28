# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- **Vertical slice: "Wake me up when [September] ends."** — building layer by layer toward a running demo page with one enum chip
  - ~~Stage 1: enumDomain factory~~ — done
  - ~~Stage 2: State initializer + reducer (SET_CHIP_VALUE)~~ — done
  - ~~Stage 3: React hooks~~ — done
  - ~~Stage 4: Interactive components~~ — done
  - ~~Stage 5: Demo page v0.1~~ — done

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — needed for AA, deferred from vertical slice
- ~~Interleaved text/chip rendering in clauses~~ — done, segments model added to ClauseDefinition

## Next up

- Remaining domain archetypes (keyword-expr, multi-select, composite, reference, alt-coordinate)
- TOGGLE_CLAUSE, SET_CONTEXT, SET_LIVE_VALUE action handlers
- Default chipperPalette with general-purpose domains
- ~~Headless API (chipper/headless entry point)~~ — hooks are the headless API, exported from Stage 3

## Roadmap

1. ~~Core data model + builder + palette~~ (types done, enumDomain + reducer done)
2. React components + hooks (in progress via vertical slice)
3. Default palette + remaining domain archetypes
4. Demo page on philbas.com
5. Documentation
6. Publicity article
7. npm publish
8. Embed in Praxis as React island
