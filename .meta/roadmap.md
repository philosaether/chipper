# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Pre-Release

Items that must ship before npm publish.

### Drafts

- **Demo page v1.0** — restore multi-font panels, update explainer,
  rebuild as a cohesive release page. Includes killer app showcase
  (praxis demo sentence as hero, many fun examples throughout).
  NB: validate and demonstrate error behavior (aria-invalid, visual
  error states, invalid-on-submit). Include a sample custom hue using
  `createHue()` to showcase the theme authoring API.
  AC: import/export panel — lightweight UI to serialize current sentence
  state to JSON and import it back. Tests and advertises serialization API.

### Gate

- **npm publish**

---

## Post-Release

### Design Sessions Needed

- **Time picker chip** — dedicated time-of-day domain. 0–24 stepper
  works for now; proper time picker deserves a design pass. Deferred from
  riff/demo-task-sentence (2026-05-21). Trigger: consumer needing
  minute-level granularity.

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

- **Computed mode** — derived from sentence state.

### Demo & Docs

- **Additional themes** — "taxes" (institutional) + one fun theme.

### Accessibility

- **Screen reader UAT** — Coordinate with native screen-reader user for
  acceptance testing of keyboard navigation implementation. Roll findings
  into fixes. Schedules take time to coordinate.
  Deferred from: chipper/feature/keyboard-navigation (2026-05-24).

### Domain Enhancements

- **KOE slots** — Add slot support to keywordOrExpressionDomain for
  multi-DOF keyword selection (currently alt-coordinate only). Slots
  are orthogonal to the tab-switching that defines alt-coordinate —
  any keyword-accepting domain with > 1 degree of freedom could use them.
  Deferred from: chipper/feature/keyword-grouping (2026-05-27).

### Integration

- **Praxis palette** — 16 domains from htmx prototype (lives in praxis/).
