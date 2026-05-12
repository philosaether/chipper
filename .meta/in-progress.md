# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

Theming engine (designs/theming-engine.md, feature/styling-pass):
- [x] Add sass devDependency, build script
- [x] Create SASS file architecture (_base, _tokens, _mixins, _components)
- [x] Define token contract (surface, accent, semantic, chip colors, structural)
- [x] Build praxis-theme from color-scheme.md
- [x] Refactor chipper.css → SASS partials
- [x] Update Chip.tsx (three-var color bridge: text, bg, hover)
- [x] Update package.json exports (styles.css, base.css, themes/praxis.css)
- [x] Update demo page to use theme tokens
- [x] Update demo vite alias
- [x] Verify: 66 tests passing, 3 CSS files generated, dev server running

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — needed for AA compliance, deferred from vertical slice. Deserves its own focused session.

## Next up

- Remaining domain archetypes (keyword-expr, multi-select, composite, reference, alt-coordinate)
- TOGGLE_CLAUSE, SET_CONTEXT, SET_LIVE_VALUE action handlers
- Default chipperPalette with general-purpose domains
- Demo page v0.2: multiple example sentences (simple/intermediate)

## Roadmap

1. ~~Core data model + builder + palette~~ (done)
2. ~~React components + hooks~~ (done — vertical slice)
3. Default palette + remaining domain archetypes
4. Demo page on philbas.com
5. Documentation
6. Publicity article
7. npm publish
8. Embed in Praxis as React island
