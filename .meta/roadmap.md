# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Design Sessions Needed

Items that require a /draft cycle before implementation.

- **Theming engine v2 — runtime theme switching** — the demo's theme
  toggle (praxis/midnight/terminal) works by applying CSS custom property
  overrides via JS. This should be a first-class library feature, not
  demo-only code. Design questions: (1) Should themes be JS objects or
  SCSS-compiled CSS files? The demo proved JS token maps work well for
  runtime switching, but SCSS gives compile-time derived colors (hover
  states via `color.mix`). Hybrid approach: SCSS compiles base themes,
  JS overrides for runtime switching. (2) Chip classification colors
  need to be part of the theme contract — currently SASS `chip-colors`
  mixin generates them, but runtime themes must override them too.
  (3) Font as a theme token works (`--chipper-font` + `--demo-font`),
  but the `inherit` default breaks at body level — needs a cleaner
  pattern. (4) Theme restoration (clearing overrides to return to SCSS
  defaults) works but is fragile — enumerate all possible props to
  `removeProperty`. Deferred from riff/demo-task-sentence (2026-05-21).
  Trigger: second consumer theme or npm publish prep.

- **Keyword grouping across popup types** — visual separator / groups
  within a single slot's keyword list. Needed for day-of-month (shortcut
  row + full 1–28 grid), likely useful for multi-select and KOE too.
  Deferred from riff/demo-task-sentence (2026-05-21). Trigger: any chip
  that needs two-tier keyword layout in its popup.

- **Serialization / deserialization** — save and restore sentence state.
  Core engine feature, not yet designed. Trigger: Praxis integration
  (needs to persist user configs).

- **Context-aware punctuation** — clause-terminating characters (comma,
  period, none) should be context-aware. Takes a `(ctx) => char` lambda;
  defaults to comma when not last clause, period when last. Single
  `(ctx) => bool` overload reproduces default but is none when false.
  Likely a specific use case of a general context-aware text element with
  syntax sugar (`.punctuation()` on clause builder). Deferred from
  riff/demo-task-sentence (2026-05-21). Trigger: any sentence where
  clause ordering or optionality affects punctuation.

- **Time picker chip** — dedicated time-of-day domain. The 0–24 integer
  stepper with `:00` suffix works well and may be the Praxis solution,
  but a proper time picker (hour:minute, AM/PM toggle, or 24h input)
  deserves a design pass for the general case. Deferred from
  riff/demo-task-sentence (2026-05-21). Trigger: consumer needing
  minute-level granularity.

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
