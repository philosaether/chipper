# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- multiSelectDomain + alternativeCoordinateDomain (feature/multi-select-alt-coordinate)

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — AA compliance
- Screen reader support (aria-live, aria-invalid, role=option)

## v1.0 Feature Inventory

Full assessment: assessments/v1-feature-scope.md. Each item is independently implementable.

### Domain Archetypes
- [x] keywordOrExpressionDomain + expressionDomain alias (done 2026-05-12)
- [x] multiSelectDomain — toggle grid, group keywords (done 2026-05-13, allowCreate deferred)
- [x] alternativeCoordinateDomain — tabbed modes with slots model (done 2026-05-13)
- [ ] compositeDomain — child chips as clause siblings, keyword collapse
- [ ] referenceDomain — async value space, navigation/search popup

### Core Engine
- [ ] TOGGLE_CLAUSE action handler (high unlock value)
- [ ] SET_CONTEXT + context propagation through contingency tree
- [ ] Contingency system — clause presence/config based on context
- [ ] Serialization/deserialization — save and restore sentence state

### Chip Modes
- [ ] Readonly mode
- [ ] Computed mode (derived from sentence state)
- [ ] Live mode (external data fetching + SET_LIVE_VALUE)

### Expression Modes (new — not in current designs, needed for forms)
- [ ] Numeric expression mode — number input, min/max, step, currency formatting
- [ ] Masked input expression mode — pattern-constrained text (SSN, EIN, ZIP)

### UI Polish
- [ ] Keyboard navigation (roving tabindex, arrow keys, Enter/Escape)
- [ ] Screen reader support
- [ ] \<ChipperDebug\> component (JSON/YAML state viewer)
- [ ] Boolean domain (yes/no toggle, thin enum wrapper)

### Palette & Presets
- [ ] Default chipperPalette — general-purpose domains out of the box
- [ ] Clause composition helpers — every(), whenever(), dueIn()

### Demo & Docs
- [ ] Demo page v0.2 — multiple example sentences, complexity toggle
- [ ] Theme toggle on demo — Chipper sentence that switches page theme
- [ ] Additional themes — "taxes" (institutional) + one fun theme
- [ ] Killer app demo — TBD (see demo-page.md open questions for candidates)
- [ ] Documentation
- [ ] Publicity article

### Integration
- [ ] Praxis palette — 16 domains from htmx prototype (lives in praxis/ repo)

## Roadmap

1. ~~Core data model + builder + palette~~ (done)
2. ~~React components + hooks~~ (done — vertical slice)
3. ~~Theming engine + praxis-theme~~ (done)
4. ~~keywordOrExpressionDomain + expressionDomain~~ (done)
5. Remaining domain archetypes + core engine features
6. Demo page v0.2 + killer app showcase
7. Additional themes
8. Documentation + publicity article
9. npm publish
10. Embed in Praxis as React island
