# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- **Mode-switching** (designs/mode-switching.md) — trigger keywords enter expression mode, regular keywords exit. Branch: feature/mode-switching.

## Next Session

- **Demo sentence v0.3** — continue the cadence sentence with chip-level contingency. App.tsx has a WIP sentence that needs the `contingentOn('cadence', ...)` fix (clause ID, not chip ID). Test the full flow: cadenceType → cadencePeriod visibility → dayOfWeek contingency.
- **KOE mode-switching keywords** — "custom interval" needs to flip the chip into expression mode. Partially addressed by chip-level contingency (cadencePeriod appears/disappears), but the KOE popup behavior when switching modes is still undesigned. May need `/draft`.
- **Builder DX wishlist** — remaining items in `.meta/inbox/devex-wishlist.md`: palette rename, clause definition ergonomics, `.chip()` positional arg footgun, architecture doc refresh, contingency at clause/chip/text level (partially done).

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — AA compliance
- Screen reader support (aria-live, aria-invalid, role=option)
- `useReferenceDisplay` hook — eager display resolution on chip mount for saved reference values. Without it, restored references show raw IDs until popup interaction. Needed before async consumer workflows ship.
- Clause definition index — `definition.clauses.find()` and `.filter()` called repeatedly in reducer and context resolution. Precompute `Map<clauseId, ClauseDefinition>` and `Map<superclauseId, ClauseDefinition[]>` on the store for O(1) lookups. Not urgent at sentence scale (5-15 clauses).
- Architecture doc refresh — chipper-architecture.md §3 and §4 are stale (still show `clause()`, `domains:`, no mention of lines, `displayLabel`, `default`, expression helpers, chip-level contingency).

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
7. ~~Builder DX + chip-level contingency + line grouping~~ (done)
8. KOE mode-switching + demo page v0.3
9. Additional themes
10. Documentation + publicity article
11. npm publish
12. Embed in Praxis as React island
