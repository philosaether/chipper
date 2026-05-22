---
Status: accepted
Date: 2026-05-22
Accepted: 2026-05-22
---

# v1 Developer Documentation — Desired State

Documentation that ships with the npm package. A developer who has never
seen Chipper should be able to build their first sentence from these docs
alone. The target audience is React developers who are integrating Chipper
into an existing app — they know React, they don't know Chipper's mental
model.

---

## Document structure

One README.md at the repo root. Not a docs site, not a wiki — one file
that GitHub renders. Sections are ordered by what a new developer needs
first, not by internal architecture.

### 1. What is Chipper (3–5 sentences)

Plain-English editing interfaces. Users click chips to configure complex
settings. The sentence reads like natural language but every chip is an
interactive input. Show the one-liner install + import.

### 2. Quick start

Minimal working example: one sentence, one clause, one chip. The
absolute smallest thing that renders. Copy-paste-run.

```typescript
import { Chipper, sentence, builder, extendPalette, keywordDomain } from 'chipper';
import 'chipper/styles.css';

const palette = extendPalette({
  chips: {
    priority: keywordDomain({
      color: 'rose',
      keywords: [
        { value: 'low' },
        { value: 'medium' },
        { value: 'high' },
      ],
    }),
  },
});

const mySentence = sentence(palette)
  .clause('main', builder()
    .text('Set priority to')
    .chip('priority')
    .text('.')
  )
  .build();

function App() {
  return <Chipper sentence={mySentence} onChange={(state) => console.log(state)} />;
}
```

### 3. Core concepts

Short explanations of the mental model. Each concept gets a heading,
a 2–3 sentence explanation, and a code snippet if helpful.

- **Sentence** — one complete input unit. Built with `sentence().clause().build()`.
- **Clause** — a fragment of a sentence containing text and chips. Built with `builder()`.
- **Chip** — an interactive input bound to a domain. Added with `.chip('id')`.
- **Domain** — defines a chip's value space (what values are valid, how they display).
- **Palette** — maps domain names to domain instances. Created with `extendPalette()`.
- **Line** — visual grouping. Clauses after `.line()` render on a new row.

### 4. Domain types

This is the bulk of the docs. Each domain type gets:
- What it's for (one sentence)
- Config interface (the fields, not the TypeScript — describe in prose)
- Example
- When to use it vs alternatives

Order by frequency of use, not by complexity:

#### Simple domains (facades)

**`keywordDomain`** — fixed set of options. The simplest domain.
**`textDomain`** — free-text input. Default maxLength 140.
**`numberDomain`** — numeric stepper with min/max/step.
**`dateDomain`** — calendar date picker (YYYY-MM-DD).

Each facade accepts optional `keywords` for hybrid presets + freeform.

#### Power-user domains

**`keywordOrExpressionDomain`** — keywords + freeform expression input.
Use when you need triggers, context-aware labels, or full expression
config control. The facades delegate to this.

**`multiSelectDomain`** — toggle grid for selecting multiple values.
Group keywords as shortcuts (e.g., "weekdays" = mon–fri).

**`alternativeCoordinateDomain`** — tabbed popup with multiple input
modes. Each mode has slots that compose into a single value.

**`referenceDomain`** — hierarchical navigation + search for external
data. Async data sources.

#### Expression helpers

`textExpression()`, `numericExpression()`, `dateExpression()` — sugar
for building `ExpressionConfig` objects. Used with
`keywordOrExpressionDomain` directly; the facades use them internally.

### 5. Building sentences

How to compose clauses into sentences. Cover in order:

- Basic: text + chips
- Optional clauses (`.optional()`, dormant display)
- Contingent clauses (`.contingentOn()`, presence predicates)
- Context propagation (`.produces()`, context in predicates)
- Chip-level contingency (`present` option on `.chip()`)
- Lines (`.line()`, auto-indent)
- Keywords: `label` vs `displayLabel` vs `display`, keyword shorthand

### 6. Reading state

How to use `onChange` to read sentence state. Shape of `SentenceState`:
clauses → chips → `{ value, displayValue, valid, dirty }`. Clause-level
`active` and `valid`. Sentence-level `valid`.

### 7. Theming

CSS custom properties. The `--chipper-*` token contract. How to override
colors. How to add chip color roles. Font inheritance. Brief mention that
the library ships `styles.css` (batteries-included) and `base.css` +
`themes/praxis.css` (separate).

### 8. Headless mode

Import from `chipper/headless` for hooks without components.
`useSentence`, `useChip`, `usePopup` with `SentenceProvider`. When to
use headless vs `<Chipper>`.

### 9. API reference

Compact reference table for every public export. Not prose — just
signature + one-line description. Grouped by category. This is the
"I know what I'm looking for" section.

## Writing approach

- **Examples are the docs.** Every concept should have a runnable code
  snippet. The quick start example should be copy-paste-able.
- **Progressive disclosure.** Start simple, add complexity. A reader who
  stops after section 4 should still be productive.
- **Name things in consumer terms.** "keyword domain" not "enum archetype."
  "text domain" not "expression-only KOE." The internal architecture is
  irrelevant to the consumer.
- **The demo is the reference implementation.** Point readers to
  `demo/src/App.tsx` for a real-world example. Don't duplicate the demo
  code in the docs — link to it.

## Tradeoffs

### One file vs docs directory

**Chosen: single README.md.** Chipper is a focused library with a
bounded API surface. One file is navigable, grep-able, and renders on
GitHub without a docs site. If the docs outgrow one file (unlikely
before v2), split then.

**What would change the calculus:** If we add tutorials, migration
guides, or framework-specific integration docs, a `docs/` directory
makes sense. Not before v1.

### API reference: inline vs separate

**Chosen: separate section at the end.** The narrative sections (3–8)
explain *how* and *why*. The reference section (9) is for lookup. Mixing
them makes both worse — the narrative gets cluttered with signatures, and
the reference gets buried in prose.

### Depth of contingency/context docs

**Chosen: explain the pattern, link to the demo.** The contingency engine
is the most complex part of Chipper. Exhaustive docs would double the
README length. Instead: explain the `contingentOn` + `produces` pattern
with one focused example, then point to App.tsx's cadence sentence as the
real-world case.

## Resolved Questions

1. **`<Chipper>` component API in README** — yes, include it. Makes the
   quick start self-contained.

2. **Styles import** — CSS ships implicitly with `import 'chipper'`. No
   separate `import 'chipper/styles.css'` in the docs. Packaging change
   needed (Vite config or package.json side effects) to make this work,
   but that's build config — not docs scope.

## Follow-up: signpost review dimension

Add a `review.dimensions` field to this project's `signpost.yml` so
`/review` automatically checks README alignment:

```yaml
review:
  dimensions:
    - Verify README.md alignment with current API surface; update if stale
```

This is a philset pattern — signpost carries per-project skill overrides.
The `/review` skill reads signpost during its tree walk and appends extra
dimensions to analysis. Implement in the review skill after this docs
session, not as part of this design.

## Out of Scope

- **Tutorial / walkthrough** — the quick start + concepts is enough for
  v1. Tutorials are a post-launch artifact once we know what confuses
  people.
- **Storybook / interactive docs** — the demo page serves this role.
- **API docs generation (TypeDoc etc.)** — the API surface is small
  enough for hand-written reference. Generated docs are noise at this
  scale.
- **Changelog** — git log is the changelog until we have external
  consumers.
