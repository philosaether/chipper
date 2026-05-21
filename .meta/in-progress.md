# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

Nothing active — mode-switching and demo-iteration both merged to main.

## Next Session

- **Demo page v0.3 polish** — the cadence sentence is functionally complete (cadenceMeasure, cadenceUnit, dayOfWeek, dayOfMonth, cadenceOffset all wired up with contingency). Remaining: restore multi-font panels, update explainer text, overall page polish. The Praxis practice config pattern is largely reproduced.
- **Builder DX wishlist** — remaining items in `.meta/inbox/devex-wishlist.md`: clause definition ergonomics, architecture doc refresh, type-checking helpers for predicates, punctuation method on clause builder.
- **Demo tsconfig** — the demo lacks a tsconfig.json, causing IDE diagnostics (implicit-any on lambdas, can't find module 'chipper'). Needs a tsconfig with path alias to match the Vite alias. Blocked by a pre-existing `Domain<string>` → `Domain<unknown>` variance issue in the library types.

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — AA compliance
- Screen reader support (aria-live, aria-invalid, role=option)
- `useReferenceDisplay` hook — eager display resolution on chip mount for saved reference values. Without it, restored references show raw IDs until popup interaction. Needed before async consumer workflows ship.
- Clause definition index — `definition.clauses.find()` and `.filter()` called repeatedly in reducer and context resolution. Precompute `Map<clauseId, ClauseDefinition>` and `Map<superclauseId, ClauseDefinition[]>` on the store for O(1) lookups. Not urgent at sentence scale (5-15 clauses).
- Architecture doc refresh — chipper-architecture.md §3 and §4 are stale (still show `clause()`, `domains:`, no mention of lines, `displayLabel`, `default`, expression helpers, chip-level contingency, mode-switching, context-aware display).
- `Domain<T>` variance — `Domain<string>` is not assignable to `Domain<unknown>` because `ExpressionMode<T>` has contravariant positions. Surfaced when adding demo tsconfig with strict mode. Needs investigation — may require making Domain/ExpressionMode covariant or using a branded approach.

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
- [x] Chip-level contingency — segment visibility, visible-only context production (done 2026-05-16)
- [x] Line grouping — LineDefinition, .line() builder method, chipper-line DOM layer (done 2026-05-16)
- [x] Mode-switching — trigger-gated expression mode (done 2026-05-20)
- [x] Context-aware display — domain.display() receives context, dynamic keyword labels (done 2026-05-20)
- [ ] Serialization/deserialization — save and restore sentence state

### Builder DX
- [x] Rename clause() → builder() (done 2026-05-16)
- [x] Chip ID as implicit domain name (done 2026-05-16)
- [x] produces() string shorthand (done 2026-05-16)
- [x] Keyword displayLabel + shared normalizer (done 2026-05-16)
- [x] defaultValue → default + first-keyword fallback (done 2026-05-16)
- [x] extendPalette({ chips, patterns }) consumer-facing rename (done 2026-05-16)
- [x] textExpression() / numericExpression() helpers (done 2026-05-16)
- [x] Keywords-only KOE domains — expression config optional (done 2026-05-16)
- [x] Expression prefix/suffix (static + context function) (done 2026-05-20)

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
- [ ] Demo page v0.3 — cadence sentence complete, needs polish + multi-font + explainer update
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
7. ~~Builder DX + chip-level contingency + line grouping~~ (done)
8. ~~KOE mode-switching + context-aware display~~ (done)
9. Demo page v0.3 polish
10. Additional themes
11. Documentation + publicity article
12. npm publish
13. Embed in Praxis as React island
