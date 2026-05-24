# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Pre-Release

Items that must ship before npm publish.

- **Keyboard navigation** — roving tabindex, arrow keys, Enter/Escape
  across all popup types. AA compliance.

- **Screen reader support** — aria-live, aria-invalid, role=option.

- **Architecture doc refresh** — chipper-architecture.md §3 and §4 are
  stale (still show `clause()`, `domains:`, no mention of lines,
  `displayLabel`, `default`, expression helpers, chip-level contingency,
  mode-switching, context-aware display).

- **Demo page v1.0** — restore multi-font panels, update explainer,
  rebuild as a cohesive release page.

- **Killer app demo** — TBD. Differentiator for npm page.

- **Publicity article**

- **Serialization / deserialization** — save and restore sentence state.
  Core engine feature, not yet designed.

- **Keyword grouping across popup types** — visual separator / groups
  within a single slot's keyword list. Needed for day-of-month (shortcut
  row + full 1–28 grid), likely useful for multi-select and KOE too.

- **Theming engine v2 — runtime theme switching** — the demo's theme
  toggle (praxis/midnight/terminal) works by applying CSS custom property
  overrides via JS. This should be a first-class library feature, not
  demo-only code. Design questions: (1) Should themes be JS objects or
  SCSS-compiled CSS files? (2) Chip classification colors as part of
  theme contract. (3) Font token `inherit` default. (4) Theme restoration
  fragility.

- **Builder DX wishlist riff** — Address remaining items in
  `.meta/inbox/devex-wishlist.md`: clause definition ergonomics,
  type-checking helpers for predicates, `.chip()` positional arg footgun.
  Plus rename `displayLabel` → `display` across all domain configs
  and standardize `config` vs `options` argument naming.

- **npm publish**

---

## Post-Release

### Design Sessions Needed

- **Time picker chip** — dedicated time-of-day domain. 0–24 stepper
  works for now; proper time picker deserves a design pass. Deferred from
  riff/demo-task-sentence (2026-05-21). Trigger: consumer needing
  minute-level granularity.

### Tech Debt

- **`Domain<T>` variance** — `Domain<string>` not assignable to
  `Domain<unknown>` because `ExpressionMode<T>` has contravariant
  positions. Blocks demo tsconfig (strict mode). Needs investigation —
  covariant redesign or branded approach.

- **Clause definition index** — `definition.clauses.find()` and
  `.filter()` called repeatedly in reducer and context resolution.
  Precompute `Map<clauseId, ClauseDefinition>` and
  `Map<superclauseId, ClauseDefinition[]>` on the store. Not urgent at
  sentence scale (5–15 clauses).

- **`useReferenceDisplay` hook** — eager display resolution on chip mount
  for saved reference values. Without it, restored references show raw IDs
  until popup interaction. Needed before async consumer workflows ship.

### Punctuation v2

- **Position-aware punctuation display** — `display` callback on
  `punc()` config receives a `position` flag (`'mid' | 'final'`) so
  consumers can vary the character based on sentence position (e.g., "?"
  when final). Currently `display` only receives `SentenceContext` and
  can't inspect clause activation.
  Deferred from: chipper/feature/context-punctuation (2026-05-24).

### Repeating Clauses

- **Repeating clauses general solution** — Static expansion in
  `.build()`: stamp out N clause instances from a template with
  auto-generated contingency chains (instance N+1 contingent on N).
  Fix `leads()` to store `_rest`. Engine support for dynamic instances
  if static expansion proves insufficient. Handcoded approach covers
  demo use case for now.
  Deferred from: chipper/main (2026-05-24).

### Future Expression Modes

- **Slider** — continuous/float values (future `inputType: 'slider'`).
- **Masked input** — pattern-constrained text (SSN, EIN, ZIP).

### Future Chip Modes

- **Readonly mode**
- **Computed mode** — derived from sentence state.
- **Live mode** — external data fetching + SET_LIVE_VALUE.

### Demo & Docs

- **Additional themes** — "taxes" (institutional) + one fun theme.

### Accessibility

- **Screen reader UAT** — Coordinate with native screen-reader user for
  acceptance testing of keyboard navigation implementation. Roll findings
  into fixes. Schedules take time to coordinate.
  Deferred from: chipper/feature/keyboard-navigation (2026-05-24).

### Integration

- **Praxis palette** — 16 domains from htmx prototype (lives in praxis/).
