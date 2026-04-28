---
Status: accepted
Date: 2026-04-28
Accepted: 2026-04-28
---

# Demo Page v0.1 — Desired State

The demo page at `philbas.com/chipper` is Chipper's front door. v0.1 is a working vertical slice: one interactive sentence that proves the library works end to end. It also establishes the page structure that future versions will fill with richer examples — the architecture doc envisions a complexity-tiered showcase (simple → intermediate → power-user → playground). We're laying the foundation and shipping something real.

---

## 1. What v0.1 Delivers

A single page with:

1. **Header** — "Chipper" + one-line pitch + link to GitHub repo
2. **The sentence** — "Wake me up when [September] ends." — fully interactive, live enum popup
3. **State inspector** — live JSON view of the sentence state below the sentence, updating as the user clicks. Shows that Chipper is a data tool, not just a visual widget.
4. **"What just happened?"** — a brief explainer section below the inspector: what a sentence is, what a chip is, what a domain is. Three short paragraphs, not documentation — a hook.

That's it. No routing, no multiple pages, no sidebar nav. One scroll.

---

## 2. Page Layout

```
┌─────────────────────────────────────────┐
│  Chipper                          [GitHub] │
│  Plain-English editing interfaces        │
│  for complex configuration.              │
├─────────────────────────────────────────┤
│                                         │
│  Try it:                                │
│                                         │
│  Wake me up when [ a month ▾ ] ends.    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Sentence state:                        │
│  ┌─────────────────────────────────┐    │
│  │ {                               │    │
│  │   "clauses": {                  │    │
│  │     "when": {                   │    │
│  │       "active": true,           │    │
│  │       "chips": {                │    │
│  │         "month": {              │    │
│  │           "value": "september", │    │
│  │           ...                   │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  What just happened?                    │
│                                         │
│  [sentence explanation]                 │
│  [chip explanation]                     │
│  [domain explanation]                   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  v0.1 · More examples coming soon.     │
│                                         │
└─────────────────────────────────────────┘
```

### Styling approach

The demo page uses its own CSS file (`demo/src/demo.css`) for layout and typography. Chipper's component styles come from importing `chipper/styles.css`. The demo CSS does not override Chipper's custom properties in v0.1 — we use the default theme. We'll add a theme toggle later.

Minimal, clean, light background. The sentence should feel like the hero element, not buried in chrome.

---

## 3. State Inspector

A `<pre>` block showing `JSON.stringify(state, null, 2)` of the current `SentenceState`. Updates live via the `onChange` callback.

Not the `<ChipperDebug>` component from the architecture doc — that's a library-shipped component for consumers. This is a demo-page-specific rendering. Same idea, different purpose.

```tsx
function StateInspector({ state }: { state: SentenceState | null }) {
  if (!state) return null;
  return (
    <pre className="demo-state-inspector">
      {JSON.stringify(state, null, 2)}
    </pre>
  );
}
```

Styled with a monospace font, subtle border, soft background. Scrollable if the JSON is long.

---

## 4. Sentence Definition

The vertical slice sentence, defined in the demo app:

```typescript
import { Chipper, sentence, clause, extendPalette, enumDomain } from 'chipper';
import 'chipper/styles.css';

const months = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const demoPalette = extendPalette({
  domains: {
    month: enumDomain({
      color: 'month',
      keywords: months.map((m) => ({ label: m, value: m.toLowerCase() })),
      placeholder: 'a month',
    }),
  },
});

const demoSentence = sentence(demoPalette)
  .clause('when', clause()
    .required()
    .text('Wake me up when')
    .chip('month', 'month')
    .text('ends.'))
  .build();
```

All twelve months, not the four-keyword test fixture. This is a real demo.

---

## 5. File Structure

```
demo/
├── package.json          — (existing) chipper-demo, links to parent
├── vite.config.ts        — (existing) Vite dev server
├── index.html            — (existing) entry HTML
└── src/
    ├── main.tsx          — (existing) React root mount
    ├── App.tsx           — (rewrite) demo page layout + state tracking
    └── demo.css          — (new) demo page styles
```

Minimal footprint. The demo doesn't need its own palette file or example directory yet — one sentence, one file.

---

## 6. Future Versions (not in scope, but informing structure)

The architecture doc sketches the full vision. v0.1 establishes the page skeleton that later versions fill:

| Version | What it adds |
|---------|-------------|
| v0.1 | One enum sentence, state inspector, explainer text |
| v0.2 | Multiple examples (simple/intermediate), section-per-example layout |
| v0.3 | Complexity toggle (itself a Chipper sentence), Praxis-like power example |
| v0.4 | Playground (editable code panel), live chip, computed chip |
| v1.0 | Polish, philbas.com deploy, link from README |

The page structure (header → examples → explainer → footer) stays the same. Each version adds content, not structure.

---

## 7. CSS Token: --chip-color-month

The demo uses `color: 'month'` on the enum domain. The default `chipper.css` doesn't define `--chip-color-month`. Two options:

**A:** Add `--chip-color-month` to the library's default token set.
**B:** Define it in `demo.css` since it's demo-specific.

Going with **B**. Library tokens should be general-purpose (`interval`, `day`, `time`, etc.), not example-specific. The demo defines its own:

```css
:root {
  --chip-color-month: #8b7dc8;
}
```

This also demonstrates to visitors how custom color tokens work — which is itself a feature showcase.

---

## Open Questions

None.

## Out of Scope

- Multiple example sentences (v0.2)
- Complexity toggle built with Chipper (v0.3)
- Playground / code editor panel (v0.4)
- Dark mode / theme toggle
- Routing or multi-page structure
- `<ChipperDebug>` library component (separate from demo-specific inspector)
- philbas.com deployment (needs domain and build pipeline)
