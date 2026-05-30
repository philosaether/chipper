# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Pre-Release

- **npm publish** — next step. Demo page v1.0 moves to philbas.com
  and imports the published package, dogfooding the real DX.

---

## Post-Release

### Demo Page v1.0

Lives in philbas.com, not chipper. Design doc: `designs/demo-page-v1.md`.
Roadmap items copied to `~/Development/html/.meta/inbox/chipper-demo-page-roadmap.md`.

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

### Standalone Tools

- **GitHub Actions YAML generator** — expand CI pipeline demo into
  standalone tool on philbas.com. Write sentence, export runnable YAML.
  Deferred from: demo-page-v1 design (2026-05-30).
- **Legalese generator** — expand contract clause demo into standalone
  tool on philbas.com. Configure terms, generate PDF.
  Deferred from: demo-page-v1 design (2026-05-30).

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
