---
Status: accepted
Date: 2026-04-23
Accepted: 2026-04-23
Assessment: assessments/chipper-library.md
Supersedes: chipper-fundamentals.md (absorbed and extended)
---

# Chipper Library Architecture — Desired State

Chipper is a standalone React library for building plain-English editing interfaces. Users construct complex configurations by clicking semantic chips arranged in readable sentences. The library provides the sentence/clause/chip data model, a domain system for chip types, a palette layer for reusable vocabulary, and a set of React components for rendering and interaction.

Chipper is framework-independent in concept but React-first in implementation. It ships as an npm package with TypeScript types, a default visual theme, and documentation. Praxis is the first consumer but not the only audience.

This document is the architectural blueprint. It resolves the open questions from `chipper-fundamentals.md` and introduces patterns discovered since that spec was written. It is written to be readable by anyone working in the codebase — no session context required.

---

## 1. Conceptual Model

Carried forward from `chipper-fundamentals.md`. Summarized here for self-containment.

### Hierarchy

```
Sentence
  └── Clause (required | optional)
        └── Chip (bound to a Domain)
```

A **sentence** is one complete unit of Chipper input. It contains one or more **clauses**. Each clause contains one or more **chips**. Each chip is bound to a **domain** that defines what values it accepts and how the user selects them.

### Clause Presentation

Each clause has four properties that determine its presentation:

| Property | Values | Meaning |
|----------|--------|---------|
| Presence | present / latent | Whether the clause is rendered at all |
| Necessity | required / optional | Whether the user can toggle it |
| Activation | active / dormant | Whether the clause contributes to the sentence's value |
| Configuration | derived from chip domains | Which chips are shown and in what arrangement |

Required clauses are always active when present. Optional clauses can be toggled by the user (↳ to activate, × to deactivate).

### Contingency

Clauses can depend on other clauses for their presentation. This relationship is called **contingency**. A clause's presence, configuration, or available values may change based on the state of its superclause.

The contingency graph must be a **forest** — no loops, no clause contingent on multiple superclauses.

### Sentence Context

Clauses communicate through **scoped context** that propagates down the contingency tree. A clause that produces a context key makes it available to its contingent descendants. A clause that consumes a key walks up its contingency chain to find the nearest producer.

This is not a flat shared bag — it's tree-scoped, like React's own Context model. The same key name can exist at multiple levels without collision.

**Example — the multiple-period problem:**

```
Every [2] [quarters]               ← cadence clause produces { period: "quarters" }
  on the [15th]                    ← day clause consumes period, finds "quarters" from parent
  of the [2nd month],             ← month clause consumes period, finds "quarters" from parent
create a task named [review]
  due in [2] [weeks]              ← due clause produces its own { period: "weeks" } in its subtree
```

The cadence's `period: "quarters"` is visible to day and month (contingent on cadence). The due clause's `period: "weeks"` lives in its own scope — no collision.

**Resolution rule:** When a chip consumes a context key, it walks up the contingency graph to the first ancestor that produces that key. If no ancestor produces it, the key is undefined (the chip uses its default behavior).

**Implication:** Context production and consumption are properties of both the chip's domain and its position in the contingency tree. The domain declares *what* keys it reads/writes. The contingency tree determines *where* those keys are visible. A chip like `period` both produces `period` (for downstream day/month chips) and potentially consumes `period` from an ancestor (if nested inside a larger composite).

---

## 2. Domains

A **domain** defines the kind of data a chip accepts. Every chip has exactly one domain.

### Domain Interface

```typescript
interface Domain<T = unknown> {
  /** Unique identifier for this domain type */
  type: string;

  /** Semantic color key (maps to CSS custom property) */
  color: string;

  /** All named presets. Full keywords collapse all DOF; partial keywords leave some open */
  keywords: Keyword<T>[];

  /** Available ways to specify a value (besides keywords) */
  expressionModes: ExpressionMode<T>[];

  /** Context keys this domain reads */
  consumes?: string[];

  /** Context keys this domain writes */
  produces?: string[];

  /** Validate a value */
  validate: (value: T) => boolean;

  /** Format a value for display in the chip trigger */
  display: (value: T) => string;

  /** Default value (may or may not be valid) */
  defaultValue: T;

  /** Reconfigure based on sentence context changes */
  onContextChange?: (ctx: SentenceContext) => Partial<Domain<T>>;
}
```

### The Six Domain Archetypes

From `chipper-fundamentals.md`, domains cluster into six structural patterns:

1. **Pure enum** — All values are keywords. No expression mode. (entity_type, permission_level)
2. **Keyword-or-expression** — Keywords for common cases, expression mode for the rest. (time_of_day, duration, numeric)
3. **Multi-select** — N binary choices. Keywords are group shortcuts. (day_set, tag_set)
4. **Composite** — Multiple DOF delegated to child chips. Keywords collapse all/some. (cadence, date_range)
5. **Reference** — Dynamic value space from external data. Navigation/search UI. (priority_ref, user_ref)
6. **Alternative-coordinate** — Multiple expression modes over the same value space. (calendar_day, month_in_period)

Each archetype maps to a base class or factory that handles the common pattern, so consumers don't implement domain logic from scratch.

### Chip Modes

Beyond the interactive input chip, Chipper supports three additional chip modes:

**`interactive`** (default) — User clicks to edit via popup. The standard Chipper chip.

**`readonly`** — Displays a value but doesn't accept input. No popup, no trigger affordance. Used for displaying computed or inherited values in a sentence context. The chip still participates in the sentence's data model — it has a value that can be serialized — but the user can't change it.

**`live`** — Displays a value from an external source that updates automatically. Like readonly, but the value is fetched from a URL or subscription. The chip shows loading/error/stale states. Used for real-time data display within a sentence layout.

```typescript
interface LiveSource {
  /** URL to fetch from */
  url: string;

  /** Extract value from response (JSONPath or function) */
  extract: string | ((response: unknown) => unknown);

  /** Poll interval in ms. If omitted, fetch once on mount. */
  interval?: number;

  /** Format the extracted value for display */
  format?: (value: unknown) => string;
}
```

**`computed`** — Value derived from other chips in the sentence. A function of sentence state. Like readonly but the source is internal, not external. Used for previewing derived values ("next occurrence: May 3").

```typescript
interface ComputedSource<T> {
  /** Derive value from current sentence state */
  compute: (state: SentenceState) => T;

  /** Which chip IDs to watch for changes */
  dependencies: string[];
}
```

The mode is a property of the chip definition, not the domain. A domain describes what kind of value a chip holds; the mode describes how that value is sourced.

---

## 3. Palette

The **palette** is the bridge between Chipper's generic machinery and a consumer application's specific vocabulary. It provides pre-configured domains and reusable clause templates.

### Architecture

```
Chipper core (sentence/clause/chip/domain primitives)
    ↕
Palette (reusable domain configs, clause templates, keyword sets)
    ↕
Application (specific sentences composed from palette pieces)
```

### Palette Definition

A palette is a plain TypeScript object — a registry of named domains and clause templates.

```typescript
interface Palette {
  /** Named domain configurations */
  domains: Record<string, Domain>;

  /** Named clause templates (optional — convenience, not required) */
  clauseTemplates?: Record<string, ClauseTemplate>;

  /** Semantic color map (CSS custom property values) */
  colors?: Record<string, string>;
}
```

### Creating a Palette

```typescript
import { createPalette, enumDomain, multiSelectDomain, keywordOrExpressionDomain } from 'chipper';

export const myPalette = createPalette({
  domains: {
    priority: enumDomain({
      color: 'blue',
      keywords: [
        { label: 'low', value: 'low' },
        { label: 'medium', value: 'medium' },
        { label: 'high', value: 'high' },
      ],
    }),
    timeOfDay: keywordOrExpressionDomain({
      color: 'orange',
      keywords: [
        { label: 'morning', value: '09:00' },
        { label: 'afternoon', value: '12:00' },
        { label: 'evening', value: '17:00' },
      ],
      expression: { type: 'time', label: 'specific time' },
    }),
    tags: multiSelectDomain({
      color: 'gray',
      options: ['urgent', 'review', 'followup'],
      allowCreate: true,
    }),
  },
});
```

### Palette Extension

Extension is **composition via spread**, not class inheritance. A child palette merges with a parent, overriding or adding entries.

```typescript
import { extendPalette } from 'chipper';
import { praxisPalette } from '@praxis/chipper-palette';

export const scrumPalette = extendPalette(praxisPalette, {
  domains: {
    // Override: add 'sprint' to the cadence domain's period list
    cadence: praxisPalette.domains.cadence.withPeriod({
      name: 'sprint',
      durationRule: config('sprint_length_weeks', { default: 2 }),
    }),
    // Add: new domain not in the parent
    velocity: numericDomain({
      color: 'teal',
      min: 0,
      max: 100,
      keywords: [{ label: 'nominal', value: 50 }],
    }),
  },
});
```

The `extendPalette` function does a shallow merge of `domains` and `clauseTemplates`. No deep inheritance chains — if you need to modify a parent domain, you call a builder method on it (like `.withPeriod()`), which returns a new domain instance.

### Volatile Config Boundary

The palette is Chipper's **volatility boundary**. Core domain machinery (expression modes, DOF decomposition, context propagation, popup rendering) is stable library code. The palette is volatile application config — what periods exist, what keywords are available, what colors to use.

Consumer applications register their vocabulary through the palette. Chipper core never knows what a "sprint" or "priority" is; it knows the structural patterns (enum, composite, reference) and renders them.

### Default Palette

Chipper ships with a **built-in default palette** (`chipperPalette`) containing general-purpose domains that cover common use cases out of the box:

- **Temporal:** cadence (day/week/month/quarter/year periods), time_of_day, time_offset, day_set, calendar_day, date_ref
- **Text:** free_text, template_text
- **Data:** numeric, enum, multi_select
- **Meta:** duration, date_range

This palette is designed so new users can build useful sentences immediately, without defining any domains. `extendPalette()` defaults to extending `chipperPalette` when no base is specified:

```typescript
// These are equivalent:
const myPalette = extendPalette({ domains: { priority: enumDomain({...}) } });
const myPalette = extendPalette(chipperPalette, { domains: { priority: enumDomain({...}) } });
```

The docs and examples always show `extendPalette()` as the entry point, not `createPalette()`. Building from scratch is possible but never encouraged.

### Palette Presets

Beyond the default palette, Chipper ships preset palettes for common application patterns:

| Preset | Extends | Adds |
|--------|---------|------|
| `chipperPalette` | (base) | General-purpose temporal, text, and data domains |
| `scrumPalette` | chipperPalette | sprint period, velocity (numeric), story_points, team_ref |
| `crmPalette` | chipperPalette | contact_ref, deal_stage (enum), follow_up_interval, revenue (numeric) |
| `notificationPalette` | chipperPalette | channel (enum: email/slack/sms), urgency_level, recipient_ref |

Presets are lightweight — each adds 3-6 domains. They serve as both real starting points and documentation-by-example of how to build your own palette.

---

## 4. Builder API

The **builder** is how consumers define sentences. It's imperative — you compose clauses from palette domains, define contingency relationships, and specify behavior.

### Sentence Builder

```typescript
import { sentence, clause, chip, repeating } from 'chipper';
import { myPalette } from './palette';

const scheduleSentence = sentence(myPalette)
  // Required clause: "Every [cadence]"
  .clause('trigger', clause()
    .required()
    .lead('Every')
    .chip('cadence', 'cadence')           // domain name from palette
    .produces({ period: 'cadence.period' }) // write to sentence context
  )
  // Optional clause: "at [time]"
  .clause('time', clause()
    .optional()
    .lead('at')
    .placeholder('any time')
    .chip('time', 'timeOfDay')
  )
  // Optional repeating clause: "when [condition], and [condition], ..."
  .clause('conditions', repeating(clause()
    .optional()
    .leads('when', 'and')                 // first instance gets "when", rest get "and"
    .chip('condition', 'conditionExpr')
  , { min: 0, max: 5 }))
  // Required clause: "create a task named [name]"
  .clause('action', clause()
    .required()
    .lead('create a task named')
    .chip('taskName', 'freeText')
  )
  // Optional clause: "due [offset]"
  .clause('due', clause()
    .optional()
    .lead('due')
    .placeholder('end of day')
    .chip('due', 'timeOffset')
  )
  .build();
```

### Contingency

Contingency is declared on the dependent clause:

```typescript
.clause('startDate', clause()
  .optional()
  .lead('starting')
  .contingentOn('trigger', {
    // Present only when cadence is in custom mode
    present: (ctx) => ctx.period !== undefined,
    // Configuration changes based on period
    configure: (ctx) => ({
      chipOverrides: {
        start: { unitLabel: ctx.period }
      }
    })
  })
)
```

The contingency callback receives the sentence context, not direct access to the superclause. This keeps clauses decoupled — they react to context keys, not to each other.

### RepeatingClause

The `repeating()` wrapper creates a clause group where instances are chained:

- Instance N+1 is present only if instance N is active
- The first instance uses `leads[0]` ("when"), subsequent instances use `leads[1]` ("and")
- `min` and `max` control bounds
- Each instance is independently optional (the user can deactivate the last one to shrink the chain)

### Clause Composition Helpers

Since consumers will reuse the same clause patterns across many sentences, Chipper should make it easy to define **clause composition helpers** — functions that return pre-configured clause groups.

```typescript
// Define a reusable helper
function every() {
  return [
    clause('trigger')
      .required()
      .lead('Every')
      .chip('cadence', 'cadence')
      .produces({ period: 'cadence.period' }),
    clause('time')
      .optional()
      .lead('at')
      .placeholder('any time')
      .chip('time', 'timeOfDay'),
  ];
}

// Use it in sentence definitions
const scheduledTask = sentence()
  .clauses(every())                         // spread the helper's clauses
  .clause('action', clause()
    .required()
    .lead('create a task named')
    .chip('taskName', 'freeText')
  )
  .build();

const scheduledCollation = sentence()
  .clauses(every())                         // same trigger pattern, different action
  .clause('action', clause()
    .required()
    .lead('collate')
    .chip('target', 'collateTarget')
  )
  .build();
```

A clause helper is just a function that returns an array of `ClauseDefinition` objects. No special API — the pattern falls out naturally from the builder being composable. The `.clauses()` method (plural) accepts an array and spreads it into the sentence.

Chipper ships helpers for common patterns alongside each preset palette (e.g., `every()`, `whenever()`, `dueIn()`). Consumers write their own following the same pattern.

### Live and Computed Chips

Chips with non-interactive modes are declared in the builder:

```typescript
// Live chip: fetches from a URL
.chip('downloads', 'numeric', {
  mode: 'live',
  source: {
    url: 'https://api.npmjs.org/downloads/point/last-week/chipper',
    extract: 'downloads',
    interval: 60_000,
    format: (n) => n.toLocaleString(),
  }
})

// Computed chip: derived from sibling state
.chip('nextOccurrence', 'dateRef', {
  mode: 'computed',
  source: {
    compute: (state) => calculateNextFire(state.chips.cadence.value),
    dependencies: ['cadence'],
  }
})

// Readonly chip: value set programmatically, not by user
.chip('owner', 'userRef', { mode: 'readonly' })
```

---

## 5. React Components

### Component Tree

```
<SentenceProvider definition={scheduleSentence} value={initialState} onChange={handleChange}>
  <Sentence>
    <Clause id="trigger">
      <ClauseLead />
      <Chip id="cadence" />
      <ClauseTerminator />
    </Clause>
    <Clause id="time">
      <ClauseToggle />
      <ClauseLead />
      <Chip id="time" />
      <ClauseTerminator />
    </Clause>
    ...
  </Sentence>
</SentenceProvider>
```

### Auto-rendering

Most consumers won't build the JSX tree by hand. The sentence definition contains enough information to render automatically:

```tsx
import { Chipper } from 'chipper';

function ActionEditor({ sentence, value, onChange }) {
  return <Chipper sentence={sentence} value={value} onChange={onChange} />;
}
```

The `<Chipper>` component reads the sentence definition and renders the full clause/chip tree. Consumers who need custom layouts can drop down to the individual components.

### State Management

State lives in a **reducer** at the sentence level, distributed via React context.

```typescript
interface SentenceState {
  clauses: Record<string, ClauseState>;
  contexts: ContextScope[];       // tree-scoped context (see §1 Sentence Context)
  valid: boolean;                 // derived: all active clauses valid
}

interface ClauseState {
  active: boolean;
  chips: Record<string, ChipState>;
  valid: boolean;                 // derived: all chips valid
}

interface ChipState<T = unknown> {
  value: T;
  displayValue: string;           // formatted for chip trigger
  valid: boolean;
  dirty: boolean;                 // changed from initial
  loading?: boolean;              // live chips only
  error?: string;                 // live/computed chips only
}
```

The reducer handles:
- `SET_CHIP_VALUE` — update a chip, revalidate, propagate context changes
- `TOGGLE_CLAUSE` — activate/deactivate an optional clause
- `SET_CLAUSE_CONFIG` — when a chip change triggers clause reconfiguration
- `SET_CONTEXT` — when a producer updates a scoped context key (propagates to contingent descendants)
- `SET_LIVE_VALUE` — when a live chip receives new data

**Flow:** Chip interaction → dispatch action → reducer updates state → context propagation → contingent clauses reconfigure → React re-renders affected components.

The `onChange` callback fires after every state transition, passing the current `SentenceState`. The consumer decides when to persist.

### Popup System

One popup open at a time (singleton pattern, matching HTMX prototype). Each domain archetype has a default popup renderer:

| Archetype | Popup Content |
|-----------|--------------|
| Pure enum | Keyword list |
| Keyword-or-expression | Keywords + input field |
| Multi-select | Toggle grid + optional create |
| Composite | Child chips (recursive) |
| Reference | Search/navigation UI |
| Alternative-coordinate | Tabbed expression modes |

Consumers can override popup rendering per-domain via the palette:

```typescript
cadenceDomain({
  // ...
  renderPopup: (props) => <CustomCadencePopup {...props} />,
})
```

### Headless Mode

Consumers who want Chipper's state management but their own UI can use the hooks directly without importing any components or styles:

```typescript
import { useSentence, useClause, useChip } from 'chipper/headless';

function MyCustomChip({ sentenceId, clauseId, chipId }) {
  const { value, setValue, domain, valid } = useChip(sentenceId, clauseId, chipId);
  // render your own UI
}
```

The headless API exports the same hooks the built-in components use internally. No separate abstraction layer.

---

## 6. Serialization

`serialize()` on the sentence walks active clauses, collects chip values, and returns a structured object.

### Default Serialization

```typescript
const result = sentence.serialize(state);
// Returns: { [chipId]: chipValue } for all chips in active clauses
// {
//   cadence: { period: 'weeks', count: 2, days: ['monday'] },
//   time: '09:00',
//   taskName: 'Practice Leetcode',
//   due: '+1d',
// }
```

Inactive clauses are excluded. The output keys are chip IDs (from the builder). Values are the raw domain values, not display strings.

### Custom Serialization

Consumers can provide a custom serializer to reshape the output:

```typescript
const scheduleSentence = sentence(myPalette)
  // ... clauses ...
  .serializer((state) => ({
    trigger_type: 'schedule',
    interval: state.chips.cadence?.value.keyword ?? 'custom',
    count: state.chips.cadence?.value.count,
    period: state.chips.cadence?.value.period,
    time: state.chips.time?.value,
    task_name: state.chips.taskName?.value,
    due: state.chips.due?.value,
  }))
  .build();
```

### Deserialization

Loading saved data back into a sentence:

```typescript
const initialState = sentence.deserialize({
  cadence: { period: 'weeks', count: 2, days: ['monday'] },
  time: '09:00',
  // ...
});
```

The deserializer infers clause activation from which chips have values, reconstructs sentence context, and triggers any contingency logic to ensure the UI state is consistent.

If a custom serializer is provided, a matching deserializer should be provided:

```typescript
.deserializer((data) => ({
  cadence: { keyword: data.interval, count: data.count, period: data.period },
  time: data.time,
  taskName: data.task_name,
  due: data.due,
}))
```

---

## 7. Styling and Theming

### Strategy: SASS with CSS Custom Properties

Chipper ships compiled CSS with BEM-structured classes and CSS custom properties for theming. SASS is the authoring layer; compiled CSS is the consumer-facing API. No CSS-in-JS — the styles are framework-agnostic and can be overridden without JavaScript.

The SASS architecture separates structural layout (`_base.scss`) from visual presentation (`_components.scss`), with a token contract (`_tokens.scss`) defining every custom property a theme must provide. Themes are SASS files that set token values; they compile to standalone CSS files.

```tsx
// Batteries-included: base + components + praxis theme
import 'chipper/styles.css';

// Explicit theme selection
import 'chipper/styles/base.css';
import 'chipper/themes/praxis.css';

// Custom theme
import 'chipper/styles/base.css';
import './my-custom-theme.css';
```

### Token System

All tokens use the `--chipper-` prefix. Organized by category:

```css
:root {
  /* Surface */
  --chipper-bg-primary       /* Page/container background */
  --chipper-bg-secondary     /* Content areas */
  --chipper-bg-tertiary      /* Hover states, metadata */
  --chipper-bg-elevated      /* Floating elements (popups) */
  --chipper-text-primary     /* Body text */
  --chipper-text-secondary   /* Supporting text */
  --chipper-text-muted       /* Placeholders, disabled */
  --chipper-border           /* Visible borders */
  --chipper-border-subtle    /* Ghost borders */

  /* Accent */
  --chipper-accent           /* Primary interactive color */
  --chipper-accent-bright    /* Button fills */
  --chipper-accent-dim       /* Hover/pressed */
  --chipper-accent-glow      /* Selection highlights */

  /* Structural */
  --chipper-radius           /* Border radius */
  --chipper-radius-lg        /* Popup radius */
  --chipper-font             /* Font family */
  --chipper-font-mono        /* Monospace font */
  --chipper-focus-ring       /* Focus ring box-shadow */
  --chipper-popup-shadow     /* Popup drop shadow */
  --chipper-transition       /* Transition duration */
}
```

### Chip Color System

Each domain declares a **hue role** (e.g., `color: 'copper'`). Themes define hue roles as text/background/hover triples via a SASS mixin:

```scss
// Theme defines a palette map
$praxis-palette: (
  "copper": (#b87333, #fde8d4),
  "sage":   (#2e5a30, #d4edda),
  // ...
);

// Mixin generates three tokens per role
@include chip-colors($praxis-palette);
// → --chipper-color-copper-text: #b87333
// → --chipper-color-copper-bg: #fde8d4
// → --chipper-color-copper-hover: rgb(245, 218, 193)  (pre-computed)
```

**The flow between CSS and TypeScript:**

The palette's `color` field on a domain is a **hue role key**, not a hex value.

```typescript
// TypeScript: the domain declares its hue role
cadenceDomain({ color: 'copper', ... })
```

The Chip component bridges the role to theme tokens via inline CSS variables on the wrapper element:

```tsx
// Chip.tsx sets three inline vars on .chipper-chip
style={{
  '--chip-trigger-color-text': 'var(--chipper-color-copper-text)',
  '--chip-trigger-color-bg': 'var(--chipper-color-copper-bg)',
  '--chip-trigger-color-hover': 'var(--chipper-color-copper-hover)',
}}
```

Component CSS references these intermediate vars with fallbacks. The TypeScript never sees hex values. The CSS never sees domain logic. The theme controls every color.

Consumers adding a new hue role (e.g., `color: 'velocity'`) add it to their theme's palette map. The mixin generates the tokens automatically.

### Chip Trigger States

Each chip trigger has visual states:
- **default** — domain-colored border + pastel background (dark text on light bg)
- **hover** — domain hover background + border emphasis
- **placeholder** — dashed border, domain-colored (signals "needs input")
- **focused** — accent focus ring
- **expanded** — accent glow ring, normal colors (popup is open)
- **invalid** — error border (only after attempted submit)
- **readonly** — transparent border, slightly muted (no border affords immutability)
- **live** — subtle pulse animation while loading, normal when settled
- **live-error** — dashed border, error color

**Border affords mutability:** Interactive chips show their domain-colored border at rest. Readonly chips get a transparent border. The presence or absence of a border signals whether the chip accepts input.

**Placeholder vs valued:** A chip in its default state gets the **placeholder** treatment (dashed border) if `domain.validate(domain.defaultValue)` returns false — meaning the user hasn't made a choice yet. If the default is valid, the chip renders in the normal **default** state. The domain's `validate()` function is the single source of truth for this distinction.

**Popup option colors:** Non-selected options show domain color (dark-on-pastel). Selected option inverts (pastel-on-dark). Hover shows domain border.

### No-Style / Headless

Consumers who don't import the CSS get unstyled components. Combined with the headless hooks, this enables fully custom rendering.

---

## 8. Package Structure

```
chipper/
├── package.json              — npm package config, peer dep on react
├── tsconfig.json
├── LICENSE                   — MIT
├── README.md                 — Quick start, API overview, links to docs
│
├── src/
│   ├── index.ts              — Public API: components, hooks, builders, types
│   │
│   ├── core/                 — Framework-agnostic data model
│   │   ├── types.ts          — SentenceDefinition, ClauseDefinition, ChipDefinition, Domain
│   │   ├── state.ts          — SentenceState, ClauseState, ChipState
│   │   ├── reducer.ts        — State reducer (pure function, no React dependency)
│   │   ├── context-propagation.ts — Sentence context read/write logic
│   │   └── serialize.ts      — serialize/deserialize helpers
│   │
│   ├── domains/              — Domain archetype implementations
│   │   ├── index.ts          — Re-exports all domain factories
│   │   ├── enum.ts           — enumDomain()
│   │   ├── keyword-expr.ts   — keywordOrExpressionDomain()
│   │   ├── multi-select.ts   — multiSelectDomain()
│   │   ├── composite.ts      — compositeDomain()
│   │   ├── reference.ts      — referenceDomain()
│   │   ├── alt-coordinate.ts — alternativeCoordinateDomain()
│   │   └── live.ts           — Live source fetching logic
│   │
│   ├── palette/              — Palette creation and extension
│   │   ├── index.ts          — createPalette(), extendPalette()
│   │   └── types.ts          — Palette, ClauseTemplate
│   │
│   ├── builder/              — Sentence builder API
│   │   ├── index.ts          — sentence(), clause(), chip(), repeating()
│   │   └── types.ts          — Builder option types
│   │
│   ├── components/           — React components
│   │   ├── Chipper.tsx       — Auto-rendering top-level component
│   │   ├── Sentence.tsx      — Sentence container + provider
│   │   ├── Clause.tsx        — Clause wrapper (handles toggle, lead, terminator)
│   │   ├── Chip.tsx          — Chip trigger + popup anchor
│   │   ├── ChipPopup.tsx     — Popup container (positioning, open/close)
│   │   ├── ClauseToggle.tsx  — ↳/× toggle button
│   │   └── popups/           — Archetype-specific popup content
│   │       ├── EnumPopup.tsx
│   │       ├── KeywordExprPopup.tsx
│   │       ├── MultiSelectPopup.tsx
│   │       ├── CompositePopup.tsx
│   │       ├── ReferencePopup.tsx
│   │       └── AltCoordinatePopup.tsx
│   │
│   ├── hooks/                — React hooks (also the headless API)
│   │   ├── index.ts          — Re-exports
│   │   ├── useSentence.ts    — Sentence-level state + dispatch
│   │   ├── useClause.ts      — Clause activation, validity
│   │   ├── useChip.ts        — Chip value, display, interactions
│   │   ├── usePopup.ts       — Popup open/close, singleton management
│   │   └── useLiveSource.ts  — Polling/fetch for live chips
│   │
│   └── styles/
│       ├── chipper.scss      — Entry: base + components + praxis theme
│       ├── chipper-base.scss — Entry: base + components, no theme
│       ├── _base.scss        — Structural layout only
│       ├── _tokens.scss      — Token contract (custom property defaults)
│       ├── _mixins.scss      — SASS helpers (chip-colors mixin)
│       ├── _components.scss  — BEM visual rules referencing tokens
│       └── themes/
│           ├── _praxis.scss      — Praxis theme values
│           └── praxis-theme.scss — Entry for standalone theme CSS
│
├── headless.ts               — Package entry point: 'chipper/headless'
│
└── demo/                     — Standalone demo app (Vite + React)
    ├── package.json
    ├── src/
    │   ├── App.tsx           — Demo page layout
    │   ├── examples/         — Example sentences
    │   └── palette.ts        — Demo palette
    └── index.html
```

### Exports

```json
{
  "name": "chipper",
  "exports": {
    ".": "./dist/index.js",
    "./headless": "./dist/headless.js",
    "./styles.css": "./dist/styles.css",
    "./styles/base.css": "./dist/base.css",
    "./themes/praxis.css": "./dist/themes/praxis.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

---

## 9. Praxis Integration

Chipper embeds into Praxis as a **React island** — a single `<div>` hydrated by React, while the rest of the app stays HTMX + Jinja.

### Praxis Palette

The Praxis palette will be defined in the Praxis codebase (not in Chipper), providing the 16 domains from the current HTMX prototype: cadence, day_set, calendar_day, month_in_period, time_of_day, time_offset, priority_ref, entity_type, event_outcome, tag_set, free_text, template_text, collate_target, collate_name, numeric (rule effects), and the anticipated condition expression domain.

### Embedding Pattern

```html
<!-- Jinja template -->
<div id="chipper-mount"
     data-sentence-type="{{ action.trigger_type }}_{{ action.action_type }}"
     data-initial-value="{{ action | tojson }}">
</div>
<script type="module" src="/static/js/dist/chipper-island.js"></script>
```

The island script imports Chipper + the Praxis palette, reads the data attributes, and renders.

### Migration Path

1. Build Chipper as standalone library
2. Publish to npm
3. Create Praxis palette in `praxis_web/`
4. Add React island entry point (esbuild, already in the build pipeline)
5. Replace HTMX action card edit mode with Chipper island
6. Remove `chips.js`, chip templates, chip route endpoints
7. Keep `_chips.scss` as reference until Chipper's styles are validated, then remove

---

## Open Questions

### O1: Demo page scope — RESOLVED

All of the above. The demo page uses a Chipper-built complexity toggle:

"Show me a [simple | intermediate | power-user] example."

- **Simple:** A single required clause with 2-3 chips. "Remind me to [task] [when]." Live chip showing Chipper npm download count.
- **Intermediate:** Required + optional clauses, contingency. "Every [interval], create a task named [name], due [offset], tagged [tags]."
- **Power-user:** Full composite domains, repeating clauses, live + computed chips. A Praxis-like automation rule.
- **Playground:** Editable code panel where visitors modify the sentence definition and see the result live. "Let me mess around with the code myself."

The demo page itself is built with Chipper (the complexity toggle is a Chipper sentence), which is the best possible advertisement.

### O2: Documentation format — RESOLVED

README for quick start + API reference as plain HTML on philbas.com. No framework (Docusaurus, Nextra). The docs page can reuse the demo page infrastructure — same Vite build, same domain. Ship docs at `philbas.com/chipper/docs`, demo at `philbas.com/chipper`.

### O3: Composite domain child chip rendering — RESOLVED (B: siblings)

Composite child chips render as **siblings in the clause**, not inside the parent chip's popup. The DOM doesn't need to mirror the contingency graph — the data model handles ownership, the DOM handles readability. Nested popups got awkward in the HTMX demo and consistency matters more than semantic purity. The composite domain manages its children's lifecycle (spawn/remove based on configuration), but they render as peers in the sentence flow.

### O4: CSS approach — RESOLVED (BEM + Custom Properties)

Three approaches considered, with tradeoffs:

**BEM (Block Element Modifier)** — what we're going with
- What it is: A naming convention for CSS classes. `.chipper-chip-trigger--active` means "the trigger element of a chip, in active state." Just CSS with structured names.
- How consumers customize: Override the CSS custom properties (colors, spacing, radius). Or write CSS rules targeting the BEM class names. Both work with basic CSS knowledge.
- Pros: No build tools required. Anyone who knows CSS (even jQuery-era CSS) can customize. Class names are readable and semantic. Works in any framework.
- Cons: No automatic scoping — if someone else uses a `.chipper-chip` class, it'll collide. Mitigated by the `chipper-` prefix, which is unique enough.
- Why it wins: We're shipping a library. Our users need to be able to override styles. BEM makes that dead simple. The prototype already uses this pattern.

**CSS Modules** — considered, rejected
- What it is: A build-time tool that renames `.chip` to `.chip_x7f2a` so class names are globally unique. Prevents all collisions.
- Why not: The generated names are random strings. A consumer who wants to style `.chipper-chip-trigger` can't — they don't know the final class name. They'd need us to expose a `classNames` prop or a styles API, which adds complexity for a problem we don't have (name collisions with a `chipper-` prefix are negligible).

**Tailwind** — considered, rejected
- What it is: Utility-first CSS. Instead of a semantic class, you write `class="px-2 py-1 border rounded-sm bg-purple-100"` directly in the JSX.
- Why not: Forces a Tailwind dependency on every consumer. The utility classes would conflict with consumers' own Tailwind configs. Library code shouldn't impose a CSS framework. Also, the class strings are verbose and hard to read — bad for a component library that people need to understand and customize.

### O5: YAML/JSON view — RESOLVED (yes, it's easy)

Ship a built-in `<ChipperDebug>` component that renders the current sentence state as formatted JSON. ~50 lines of code — it's just `JSON.stringify(state, null, 2)` in a `<pre>` tag with a copy button.

```tsx
<Chipper sentence={mySentence} value={value} onChange={setValue}>
  <ChipperDebug format="json" />  {/* or format="yaml" */}
</Chipper>
```

JSON is zero-dependency. YAML view is available if the consumer has `js-yaml` installed (optional peer dep) — Chipper detects it at runtime and falls back to JSON if absent. We don't force the dep.

The toggle between chip view and debug view is a consumer concern (just show/hide the components). But the debug component itself ships with Chipper.

### O6: Accessibility — RESOLVED (AA at launch, AAA roadmap)

**WCAG 2.1 AA** (our launch target):

| Criterion | What it means for Chipper | Effort |
|-----------|--------------------------|--------|
| **Color contrast 4.5:1** | All semantic chip colors must have sufficient contrast against their backgrounds. Our current palette is close — a few colors (gold, orange) may need darkening. | Low — audit and adjust palette |
| **Keyboard navigation** | All chips reachable via Tab. Popup options navigable with arrow keys. Enter to select, Escape to close. Tab order follows visual order. | Medium — popup arrow key navigation is new work |
| **Focus indicators** | Visible focus ring on every interactive element (chip triggers, popup options, clause toggles). Already partially done in prototype. | Low |
| **Screen reader support** | `aria-expanded`, `aria-haspopup="listbox"`, `aria-label` on chips. `role="option"` on popup items. Announce chip value changes via `aria-live` region. | Medium |
| **Error identification** | Invalid chips announced to screen readers, not just shown with red border. `aria-invalid="true"` + associated error message. | Low |
| **Target size 24x24px** | Minimum touch target for all interactive elements. Our chips are already larger than this. | Free |

**WCAG 2.1 AAA** — what it adds and what it costs:

| Criterion | What it adds | Cost |
|-----------|-------------|------|
| **Color contrast 7:1** | Much stricter contrast. Our semantic pastels (soft purple, sage green) would need to be significantly darker or used only as backgrounds with dark text. This changes the visual character of Chipper. | High — requires redesigning the color palette or shipping a separate high-contrast theme |
| **No interruptions (2.2.4)** | User must be able to suppress non-emergency updates. Live chips would need a "pause updates" mechanism. | Low — add a pause prop to live chips |
| **Target size 44x44px (2.5.5)** | Larger minimum touch targets. Chips and popup options would need to be bigger, which changes the compact sentence aesthetic. | Medium — either always larger (changes the design) or a "large target" mode |
| **Extended audio description (1.2.7)** | N/A for us — no video/audio content | Free |

**Recommendation:** Ship AA at launch. It's achievable with moderate effort and covers what users actually need. For AAA, ship a **high-contrast theme** as an alternative CSS file (`chipper/styles-high-contrast.css`) that meets 7:1 contrast ratios. Add a `largeTargets` prop for 44px minimum sizing. This gets us close to AAA without compromising the default visual design. Document which AAA criteria we meet and which we don't.

---

## Out of Scope

- **Rich text / block editor domain** — TipTap integration deferred. Free text and template text remain plain for v1.
- **Server-side rendering** — React client components only for v1.
- **Non-React ports** — Vue, Svelte, etc. The headless hooks are React-specific. Framework-agnostic core is aspirational but not a v1 goal.
- **Drag-and-drop clause reordering** — Clause order is defined by the sentence builder, not user-configurable.
- **Undo/redo** — Not in v1. The reducer architecture supports it naturally if we add it later.
- **Animations/transitions** — Clause toggle and popup open/close may get simple transitions, but motion design is post-v1.
- **Multi-sentence forms** — One Chipper instance = one sentence. Coordinating multiple sentences (like Praxis's action cards list) is the consumer's responsibility.
