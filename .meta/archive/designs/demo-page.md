---
Status: superseded
Date: 2026-04-28
Accepted: 2026-04-28
Implemented: 2026-04-28 (feature/demo-page)
Superseded: 2026-05-30
Superseded-by: demo-page-v1.md
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

### Killer app / showcase sentences

The demo page needs a sentence (or set of sentences) that makes Chipper's value proposition instant — something that feels fundamentally better as an interactive sentence than as a traditional form. Best candidates exercise contingency, optional clauses, and multiple domain archetypes.

**Strongest candidates:**

1. **Cron/schedule builder** — "Every [2] [weeks] on [Monday, Friday] at [9:00 AM], run [deploy-staging]." Cron syntax is universally hated; the sentence version is self-documenting. Closest to Praxis, lowest risk, highest impact. Side-by-side with the cron string would be a killer demo.

2. **Notification/alert rules** — "When [CPU usage] is [above] [90%] for [5 minutes], send a [Slack message] to [#ops-alerts]." Monitoring alert config is universally painful. Comparison operators change based on metric type, notification channels have different fields. Great contingency showcase.

3. **Shipping rate rules** — "If the order is [over $50] and ships to [domestic], use [free shipping]. Otherwise, charge [$5.99] per [pound]." E-commerce shipping rules are deeply nested conditionals configured through painful multi-step forms.

4. **Email automation rules** — "When a [new subscriber] joins [the newsletter] and has [marketing tag], wait [3 days] then send [welcome series]." Simpler version of what Mailchimp flowcharts do, but readable.

5. **GitHub Actions step** — "On [push] to [main], run [npm test] in [node:18], then if [tests pass], [deploy to staging]." CI/CD YAML is another format people struggle with.

**What makes a good Chipper showcase:** Structure changes based on earlier choices (contingency). Natural language is more readable than the alternative. Enough complexity that a form would need conditional fields or a wizard. Something people actually configure regularly.

Decision deferred until more archetypes are built — the showcase sentence needs keyword-or-expression, composite, and contingency at minimum.

## Out of Scope

- Multiple example sentences (v0.2)
- Complexity toggle built with Chipper (v0.3)
- Playground / code editor panel (v0.4)
- Dark mode / theme toggle
- Routing or multi-page structure
- `<ChipperDebug>` library component (separate from demo-specific inspector)
- philbas.com deployment (needs domain and build pipeline)
