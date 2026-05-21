# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Design Sessions Needed

Items that require a /draft cycle before implementation.

- **Keyword grouping across popup types** — visual separator / groups
  within a single slot's keyword list. Needed for day-of-month (shortcut
  row + full 1–28 grid), likely useful for multi-select and KOE too.
  Deferred from riff/demo-task-sentence (2026-05-21). Trigger: any chip
  that needs two-tier keyword layout in its popup.

- **Serialization / deserialization** — save and restore sentence state.
  Core engine feature, not yet designed. Trigger: Praxis integration
  (needs to persist user configs).

## Tech Debt

Known defects and structural issues. Not blocking current work, but
accumulating cost.

- **`Domain<T>` variance** — `Domain<string>` not assignable to
  `Domain<unknown>` because `ExpressionMode<T>` has contravariant
  positions. Blocks demo tsconfig (strict mode). Needs investigation —
  covariant redesign or branded approach.

- **Architecture doc refresh** — chipper-architecture.md §3 and §4 are
  stale (still show `clause()`, `domains:`, no mention of lines,
  `displayLabel`, `default`, expression helpers, chip-level contingency,
  mode-switching, context-aware display).

- **Clause definition index** — `definition.clauses.find()` and
  `.filter()` called repeatedly in reducer and context resolution.
  Precompute `Map<clauseId, ClauseDefinition>` and
  `Map<superclauseId, ClauseDefinition[]>` on the store. Not urgent at
  sentence scale (5–15 clauses).

- **`useReferenceDisplay` hook** — eager display resolution on chip mount
  for saved reference values. Without it, restored references show raw IDs
  until popup interaction. Needed before async consumer workflows ship.

## Accessibility

- **Keyboard navigation** — roving tabindex, arrow keys, Enter/Escape
  across all popup types. AA compliance.
- **Screen reader support** — aria-live, aria-invalid, role=option.

## Future Expression Modes

- **Slider** — continuous/float values (future `inputType: 'slider'`).
- **Masked input** — pattern-constrained text (SSN, EIN, ZIP).

## Future Chip Modes

- **Readonly mode**
- **Computed mode** — derived from sentence state.
- **Live mode** — external data fetching + SET_LIVE_VALUE.

## Demo & Docs

- **Demo page v0.3 polish** — restore multi-font panels, update explainer,
  page polish.
- **Theme toggle demo** — Chipper sentence that switches the page theme.
- **Additional themes** — "taxes" (institutional) + one fun theme.
- **Killer app demo** — TBD.
- **Documentation** — contingency engine examples, cookbook-style docs for
  lambda-based `present`/`configure`.
- **Publicity article**

## Integration

- **Praxis palette** — 16 domains from htmx prototype (lives in praxis/).
- **npm publish**
