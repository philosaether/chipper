# Roadmap

Deferred work that matters but isn't happening yet. Items land here via
explicit deferral during riff sessions, design reviews, or retros. Each
item should say *why* it was deferred and *what* would trigger picking it up.

---

## Pre-Release

Items that must ship before npm publish. Demo page is a multi-cycle
build — each item below is its own draft→ship session.
Design: `designs/demo-page-v1.md`.

### Demo Page — Roots (shared infrastructure)

- **Token cost tracker** — utility recording actual token cost per
  draft→ship cycle. Surfaces in "what it costs" overlay. Supporting
  data for philset essay.
- **Audience context** — React context + wrapper components for
  audience-driven text transforms and conditional rendering.
  `<AudienceText>`, `<AudienceOnly>`, `useAudience()`.
- **Section router + deep-link codec** — conditional rendering from
  navigator sentence state, URL serialization/deserialization.
- **Demo wrapper component** — renders demo + stat chips + annotations.

### Demo Page — Trunk (navigator + core page)

- **Navigator sentence** — audience + section + details optional clause.
- **Page layout** — header, time-ago chip, navigator, primary section,
  teasers, footer.
- **Time-ago display chip** — derived, color-aging, always visible.
- **Praxis task sentence** (evolved) — org chart reference domain,
  multi-select notifications, when/and clause cascade.

### Demo Page — Branches (core demos, one draft→ship each)

- **Excuse generator** — KOE with absurd keywords, viral deep-links.
- **Cocktail menu** — keyword filtering, derived recipe display chip.
- **Stock ticker** — external display chips, createHue for gain/loss.
- **D&D encounter builder** — alt-coord ranges, multi-select, derived 5e math.
- **Pet personality profiler** — contingent multi-select grid per animal.
- **CI pipeline → YAML** — custom serializer, live preview panel.
- **Contract clause builder** — contingent clauses, import/export panel.

### Demo Page — Canopy (full fill)

- **Astrology compatibility** — contingent clauses, snarky derived quotes.
- **Reddit shade machine** — Cloudflare Worker cache, shade function.
- **Music + vibes** — Spotify embed toggle, page reskin unlock.
- **Tweet scheduler** — tone selector, derived preview.
- **Details overlay** — stat chips, cost data, source code panels.
- **Exploration tracker + Surprise me teleporter**.

### Demo Page — Leaves (audience personalities)

- **Finance bros** — "$" substitution, compounding numerics, green theme.
- **Bronies** — MLP pastels via createHue, horse emoji bullets.
- **Cottagecore** — earth tones, serif, gregorian chant genre additions.
- **Cyberpunk** — neon-on-black, mono, electronic-only music filtering.
- **Academics** — citation chips, footnotes, serif.

### Demo Page — Flowers (polish + delight)

- **Page reskins** — MySpace, GeoCities, Windows 95, hacker movie, Tumblr.
- **createHue live builder** in footer.
- **Developer mode** — hoverable code annotations on praxis sentence.
- **Deep-link sharing UI** — copy button, QR code.

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
