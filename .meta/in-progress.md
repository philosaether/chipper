# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

Nothing active — reference domain and contingency engine both merged to main.

## Next Session

- **KOE mode-switching keywords** — the cadence demo exposed that "custom interval" needs to flip the chip into expression mode, set a default, and change popup behavior on next open. Needs a design loop (`/draft`). Also entangled with Keyword.displayLabel (trigger text distinct from popup label) and consumer access to the default display function. Phil's builder experiments are in `.meta/inbox/builder-notes.md`.
- **Sentence layout for contingent clauses** — flex-direction: column puts each clause on its own line. Contingent clauses need to flow inline with their parent. Needs design decision before the cadence demo looks right.

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — AA compliance
- Screen reader support (aria-live, aria-invalid, role=option)
- `useReferenceDisplay` hook — eager display resolution on chip mount for saved reference values. Without it, restored references show raw IDs until popup interaction. Needed before async consumer workflows ship.
- Clause definition index — `definition.clauses.find()` and `.filter()` called repeatedly in reducer and context resolution. Precompute `Map<clauseId, ClauseDefinition>` and `Map<superclauseId, ClauseDefinition[]>` on the store for O(1) lookups. Not urgent at sentence scale (5-15 clauses).

## v1.0 Feature Inventory

Full assessment: assessments/v1-feature-scope.md. Each item is independently implementable.

### Domain Archetypes
- [x] keywordOrExpressionDomain + expressionDomain alias (done 2026-05-12)
- [x] multiSelectDomain — toggle grid, group keywords (done 2026-05-13, allowCreate deferred)
- [x] alternativeCoordinateDomain — tabbed modes with slots model (done 2026-05-13)
- [x] compositeDomain — coordination pattern via contingency engine (done 2026-05-14, KOE mode-switching deferred)
- [x] referenceDomain — navigation/search popup, display cache (done 2026-05-14)

### Core Engine
- [x] TOGGLE_CLAUSE action handler (done 2026-05-14)
- [x] SET_CONTEXT + context propagation through contingency tree (done 2026-05-14)
- [x] Contingency system — clause presence/config based on context (done 2026-05-14)
- [ ] Serialization/deserialization — save and restore sentence state

### Chip Modes
- [ ] Readonly mode
- [ ] Computed mode (derived from sentence state)
- [ ] Live mode (external data fetching + SET_LIVE_VALUE)

### Expression Modes (new — not in current designs, needed for forms)
- [x] Numeric expression mode — stepper UI with inputType: 'number' (done 2026-05-13, slider deferred)
- [ ] Slider expression mode — continuous/float values (future inputType: 'slider')
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
- [x] Demo page v0.2 — multi-font panels, 6 typefaces (done 2026-05-13)
- [ ] Demo page v0.3 — multiple example sentences, complexity toggle
- [ ] Theme toggle on demo — Chipper sentence that switches page theme
- [ ] Additional themes — "taxes" (institutional) + one fun theme
- [ ] Killer app demo — TBD (see demo-page.md open questions for candidates)
- [ ] Documentation — include contingency engine examples and sugar for common patterns (cadence, period-dependent clauses). Lambda-based `present`/`configure` is powerful but needs clear cookbook-style docs.
- [ ] Publicity article

### Integration
- [ ] Praxis palette — 16 domains from htmx prototype (lives in praxis/ repo)

## Roadmap

1. ~~Core data model + builder + palette~~ (done)
2. ~~React components + hooks~~ (done — vertical slice)
3. ~~Theming engine + praxis-theme~~ (done)
4. ~~keywordOrExpressionDomain + expressionDomain~~ (done)
5. ~~multiSelect + altCoordinate + numeric stepper + visual polish~~ (done)
6. ~~Domain archetypes (composite, reference) + core engine features~~ (done)
7. KOE mode-switching + sentence layout + demo page v0.3
8. Additional themes
9. Documentation + publicity article
10. npm publish
11. Embed in Praxis as React island
