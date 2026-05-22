# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- **KOE facade domains** (feature/koe-facades) — textDomain, numberDomain, dateDomain, keywordDomain. Delete enumDomain + EnumPopup. Add expression position option.

## Next Session

- **Demo page v0.3 polish** — cadence sentence line 1 is feature-complete (cadenceMeasure, cadenceUnit, dayOfWeek, dayOfMonth, monthOfQuarter, monthOfYear, cadenceOffset, timeOfDay all wired up). Line 2 (create task action: named, due, tagged, described, notify) not yet started. Theme toggle and date expression demo sentences added. Remaining: restore multi-font panels, update explainer text, build action line, overall page polish.
- **Builder DX wishlist** — remaining items in `.meta/inbox/devex-wishlist.md`: clause definition ergonomics, type-checking helpers for predicates, punctuation method on clause builder.
- **Demo tsconfig** — the demo lacks a tsconfig.json, causing IDE diagnostics (implicit-any on lambdas, can't find module 'chipper'). Blocked by `Domain<T>` variance issue.

See `roadmap.md` for deferred items (keyword grouping, context-aware punctuation, time picker, theming engine v2, serialization).

## Tech Debt

- Keyboard arrow navigation in popups (roving tabindex) — AA compliance
- Screen reader support (aria-live, aria-invalid, role=option)
- `useReferenceDisplay` hook — eager display resolution on chip mount for saved reference values. Without it, restored references show raw IDs until popup interaction. Needed before async consumer workflows ship.
- Clause definition index — `definition.clauses.find()` and `.filter()` called repeatedly in reducer and context resolution. Precompute `Map<clauseId, ClauseDefinition>` and `Map<superclauseId, ClauseDefinition[]>` on the store for O(1) lookups. Not urgent at sentence scale (5-15 clauses).
- Architecture doc refresh — chipper-architecture.md §3 and §4 are stale (still show `clause()`, `domains:`, no mention of lines, `displayLabel`, `default`, expression helpers, chip-level contingency, mode-switching, context-aware display). logical-architecture.md was updated this session.
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
- [x] contingentOn() lambda shorthand for presence-only (done 2026-05-21)
- [x] dateExpression() helper (done 2026-05-21)

### Chip Modes
- [ ] Readonly mode
- [ ] Computed mode (derived from sentence state)
- [ ] Live mode (external data fetching + SET_LIVE_VALUE)

### Expression Modes
- [x] Numeric expression mode — stepper UI with inputType: 'number' (done 2026-05-13, slider deferred)
- [x] Date expression mode — calendar picker with inputType: 'date' (done 2026-05-21)
- [ ] Slider expression mode — continuous/float values (future inputType: 'slider')
- [ ] Masked input expression mode — pattern-constrained text (SSN, EIN, ZIP)

### UI Polish
- [x] Auto-indent lines with all-optional/contingent clauses (done 2026-05-21)
- [x] Dormant clause display — muted italic plain text with persisted values (done 2026-05-21)
- [ ] Keyboard navigation (roving tabindex, arrow keys, Enter/Escape)
- [ ] Screen reader support
- [ ] \<ChipperDebug\> component (JSON/YAML state viewer)
- [ ] Boolean domain (yes/no toggle, thin enum wrapper)

### Palette & Presets
- [ ] Default chipperPalette — general-purpose domains out of the box
- [ ] Clause composition helpers — every(), whenever(), dueIn()

### Demo & Docs
- [x] Demo page v0.2 — multi-font panels, 6 typefaces (done 2026-05-13)
- [x] Theme toggle sentence — praxis/midnight/terminal with live CSS switching (done 2026-05-21)
- [x] Date expression demo — meeting sentence with calendar picker (done 2026-05-21)
- [ ] Demo page v0.3 — action line (create task), multi-font restore, explainer update
- [ ] Additional themes — "taxes" (institutional) + one fun theme
- [ ] Killer app demo — TBD (see demo-page.md open questions for candidates)
- [ ] Documentation — contingency engine examples, cookbook-style docs
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
9. ~~Riff: dateExpression, theme toggle, dormant display, builder DX~~ (done)
10. Demo page v0.3 polish + action line
11. Additional themes
12. v1 developer documentation (design session + dogfood pass)
13. Publicity article
14. npm publish
14. Embed in Praxis as React island
