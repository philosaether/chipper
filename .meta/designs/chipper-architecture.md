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
interface Domain<T = any> {
  /** Unique identifier for this domain type */
  type: string;

  /** Semantic color key (maps to CSS custom property) */
  color: string;

  /** Named presets. Full keywords collapse all DOF; partial keywords leave some open */
  keywords: Keyword<T>[];

  /** Grouped keywords for popup rendering (visual sections, grid layouts) */
  keywordGroups?: NormalizedKeywordGroup<T>[];

  /** Available ways to specify a value (besides keywords) */
  expressionModes: ExpressionMode<T>[];

  /** Context keys this domain reads */
  consumes?: string[];

  /** Context keys this domain writes */
  produces?: string[];

  /** Validate a value */
  validate: (value: T) => boolean;

  /** Format a value for display in the chip trigger. Context available from reducer. */
  display: (value: T, context?: SentenceContext) => string;

  /** Default value (may or may not be valid) */
  defaultValue: T;

  /** Text shown in the chip trigger when the current value is invalid */
  placeholder?: string;

  /** Reconfigure based on sentence context changes */
  onContextChange?: (ctx: SentenceContext) => Partial<Domain<T>>;

  /** Archetype-specific configuration passed through to popup rendering */
  meta?: Record<string, unknown>;
}
```

**Variance note:** `T` defaults to `any` (not `unknown`) so that `Domain<string>` is assignable to `Domain` in palette and store contexts. Type safety is preserved by the domain factories which constrain `T`. See decisions.md 2026-05-27.

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
import { extendPalette, keywordDomain, textDomain, numberDomain } from 'chipper';

export const myPalette = extendPalette({
  chips: {
    priority: keywordDomain({
      color: 'rose',
      keywords: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }],
    }),
    taskName: textDomain({
      color: 'rose',
      placeholder: 'a task name',
    }),
    interval: numberDomain({
      color: 'copper',
      min: 1,
      max: 365,
      suffix: 'days',
    }),
  },
});
```

`extendPalette` is the standard entry point. It accepts a `PaletteConfig` with `chips` (domain map) and optional `patterns` (clause templates). `createPalette` exists for building from scratch but is rarely needed.

### Palette Extension

Extension is **composition via shallow merge**. A child palette merges with a parent, overriding or adding entries.

```typescript
import { extendPalette } from 'chipper';
import { basePalette } from './base-palette';

export const extendedPalette = extendPalette(basePalette, {
  chips: {
    velocity: numberDomain({ color: 'teal', min: 0, max: 100 }),
  },
});
```

The two-argument form extends a specific base palette. The one-argument form extends `chipperPalette` (which is empty by default — domains come from the consumer).

### Volatile Config Boundary

The palette is Chipper's **volatility boundary**. Core domain machinery (expression modes, DOF decomposition, context propagation, popup rendering) is stable library code. The palette is volatile application config — what keywords exist, what colors to use, what validation rules apply.

Consumer applications register their vocabulary through the palette. Chipper core never knows what a "sprint" or "priority" is; it knows the structural patterns (keyword, text, number, multi-select, reference, alternative-coordinate) and renders them.

### Domain Factories

Chipper provides facade factories for common chip types and power-user factories for advanced cases:

**Facade factories** (sugar over `keywordOrExpressionDomain`):
- `keywordDomain` — fixed set of options
- `textDomain` — free-text input (default maxLength 140)
- `numberDomain` — numeric stepper with min/max/step
- `dateDomain` — calendar date picker (YYYY-MM-DD)

**Power-user factories:**
- `keywordOrExpressionDomain` — keywords + freeform expression input, trigger-gated mode switching
- `expressionDomain` — expression-only (no keywords)
- `multiSelectDomain` — toggle grid with group keyword shortcuts
- `alternativeCoordinateDomain` — tabbed modes with slot-based selection
- `referenceDomain` — hierarchical navigation + search for external data

All keyword-accepting factories support **keyword grouping** — visual sections with labels, flow/grid layout, and prefix text. See designs/keyword-grouping.md.

---

## 4. Builder API

The **builder** is how consumers define sentences. It's imperative — you compose clauses from palette domains, define contingency relationships, and specify behavior.

### Sentence Builder

```typescript
import { sentence, builder, repeating } from 'chipper';
import { myPalette } from './palette';

const scheduleSentence = sentence(myPalette)
  // Required clause: "Every [cadence]"
  .clause('trigger', builder()
    .text('Every')
    .chip('cadence')                        // chip ID = domain name in palette
    .produces('cadence')                    // write chip value to sentence context
  )
  // Line break — subsequent clauses render on a new row
  .line()
  // Optional clause: "at [time]"
  .clause('time', builder()
    .optional()
    .text('at')
    .placeholder('any time')
    .chip('time', 'timeOfDay')              // explicit domain name when different from chip ID
  )
  // Required clause: "create a task named [name]"
  .clause('action', builder()
    .text('create a task named')
    .chip('taskName')
    .punc()                                 // context-aware trailing punctuation
  )
  // Optional clause: "due [offset]"
  .clause('due', builder()
    .optional()
    .text('due')
    .placeholder('end of day')
    .chip('due')
  )
  .build();
```

**Key conventions:**
- `builder()` creates a clause (renamed from `clause()` in builder-dx.md)
- `.text()` adds text segments (renamed from `.lead()`)
- `.chip('id')` looks up the domain by chip ID in the palette. If the domain name differs from the chip ID, pass it explicitly: `.chip('myChip', 'domainName')`
- Clauses are required by default — `.optional()` makes them user-toggleable
- `.produces('key')` is shorthand for `.produces({ key: 'key' })`
- `.punc()` adds context-aware punctuation (comma when followed by active clause, period when last)

### Lines

Clauses after `.line()` render on a new row. Lines with all-optional or all-contingent clauses auto-indent:

```typescript
sentence(palette)
  .clause('trigger', builder().text('Every').chip('cadence').produces('cadence'))
  .line()
  .clause('detail', builder().optional().text('at').chip('time'))
  .build();
```

### Contingency

Contingency is declared on the dependent clause. **Lambda shorthand** for presence-only:

```typescript
.clause('weekday', builder()
  .text('on').chip('day')
  .contingentOn('trigger', (ctx) => ctx.cadence === 'weekly')
)
```

**Object form** for cases that also need domain reconfiguration:

```typescript
.clause('startDate', builder()
  .optional()
  .text('starting').chip('start')
  .contingentOn('trigger', {
    present: (ctx) => ctx.cadence !== undefined,
    configure: (ctx) => ({
      chipOverrides: { start: { keywords: getOptionsFor(ctx.cadence) } }
    })
  })
)
```

The contingency callback receives **sentence context** (tree-scoped), not direct access to the superclause. Clauses react to context keys, not to each other.

### Chip-Level Contingency

Individual chips within a clause can be shown/hidden based on context:

```typescript
builder()
  .text('Every')
  .chip('measure')
  .chip('unit', { present: (ctx) => !isNaN(Number(ctx.measure)) })
```

Hidden chips are excluded from context production. All visible chips produce simultaneously (no left-to-right ordering).

### Context-Aware Text and Keywords

Text segments can be dynamic:

```typescript
// Dynamic text (e.g., punctuation that varies by position)
.punc({ display: (ctx) => ctx.isLast ? '.' : ',' })

// Dynamic keyword labels that update with context
{ value: '1', label: (ctx) => `next ${ctx.unit ?? 'month'}` }
```

### Repeating Clauses

The `repeating()` wrapper creates a clause group where instances are chained:

```typescript
.clause('conditions', repeating(builder()
  .optional()
  .leads('when', 'and')
  .chip('condition')
, { min: 0, max: 5 }))
```

- Instance N+1 is present only if instance N is active
- First instance uses `leads[0]` ("when"), rest use `leads[1]` ("and")
- `min` and `max` control bounds (defaults: 0, 5)

### Live and Computed Chips

Chips with non-interactive modes are declared in the builder. These are typed but not yet implemented (stubs in the reducer):

```typescript
.chip('owner', 'userRef', { mode: { type: 'readonly' } })
.chip('downloads', 'numeric', { mode: { type: 'live', source: { ... } } })
.chip('next', 'dateRef', { mode: { type: 'computed', source: { ... } } })
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
  present: boolean;               // engine-controlled (contingency)
  active: boolean;                // user-controlled (optional toggle)
  chips: Record<string, ChipState>;
  valid: boolean;                 // derived: all visible chips valid
  visibleChips?: string[];        // chip-level contingency (undefined = all visible)
}

interface ChipState {
  value: unknown;
  displayValue: string;           // formatted for chip trigger
  valid: boolean;
  dirty: boolean;                 // changed from initial
  expressionMode?: boolean;       // true when in trigger-gated expression mode
}
```

The reducer handles:
- `SET_CHIP_VALUE` — update a chip, revalidate, recompute display, propagate context, cascade contingency
- `TOGGLE_CLAUSE` — activate/deactivate an optional clause
- `SET_CONTEXT` — delegate to contingency engine for presence + reconfiguration
- `SET_LIVE_VALUE` — (stub) update live chip from external source

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
import { SentenceProvider, useSentence, useChip, usePopup } from 'chipper/headless';

function MyCustomChip({ clauseId, chipId }) {
  const { value, setValue, domain, valid, displayValue } = useChip(clauseId, chipId);
  // render your own UI
}
```

The headless API exports the same hooks the built-in components use internally. No separate abstraction layer. Hooks: `useSentence` (sentence-level state), `useChip` (chip state + setValue), `usePopup` (singleton open/close).

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

See `.meta/logical-architecture.md` for the detailed, authoritative map.
High-level layout:

```
chipper/
├── src/
│   ├── index.ts              — Public API surface
│   ├── core/                 — Framework-agnostic: types, state, store, reducer,
│   │   │                       initialize, context-resolution, serialize, actions/
│   │   └── actions/          — One file per reducer action handler
│   ├── domains/              — Domain factories: facades, KOE, multi-select,
│   │                           alt-coordinate, reference, normalize-keywords
│   ├── palette/              — createPalette(), extendPalette()
│   ├── builder/              — sentence(), builder(), chip(), repeating(), punc()
│   ├── components/           — Chipper, Sentence, Clause, Chip, ChipPopup,
│   │   └── popups/           — KOE, MultiSelect, AltCoordinate, Reference,
│   │                           KeywordGroupList (shared group rendering)
│   ├── hooks/                — SentenceProvider, useSentence, useChip, usePopup,
│   │                           useKeyboardNavigation, useReferenceDisplay (internal)
│   └── styles/               — SASS: base, tokens, mixins, components, themes/
├── headless.ts               — Package entry: 'chipper/headless'
├── demo/                     — Standalone demo app (Vite + React)
└── tests/                    — Mirrors src/ structure
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
