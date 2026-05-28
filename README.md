# Chipper

Plain-English editing interfaces for complex configuration.

Chipper is a React library that lets users build structured data by clicking
semantic chips arranged in readable sentences. Each chip is an interactive
input — keywords, text fields, number steppers, date pickers, multi-selects —
but the sentence reads like natural language.

> Every **[2]** **[weeks]** on **[tuesday]**, create a task named **[review accounts]**.

```
npm install chipper
```

## Quick Start

```tsx
import { Chipper, sentence, builder, extendPalette, keywordDomain } from 'chipper';
import 'chipper/styles.css';

const palette = extendPalette({
  chips: {
    priority: keywordDomain({
      color: 'rose',
      keywords: [{ value: 'low' }, { value: 'medium' }, { value: 'high' }],
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
  return (
    <Chipper
      sentence={mySentence}
      onChange={(state) => console.log(state)}
    />
  );
}
```

That's the minimum: a palette with one domain, a sentence with one clause,
and a `<Chipper>` component to render it.

## Core Concepts

### Sentence

One complete unit of input. Built with the `sentence()` builder, which
accepts a palette and chains `.clause()` calls:

```ts
const mySentence = sentence(palette)
  .clause('first', builder().text('Do').chip('action'))
  .clause('second', builder().text('at').chip('time'))
  .build();
```

### Clause

A fragment of a sentence containing text and chips. Built with `builder()`.
Clauses can be required (default), optional (user-toggled), or contingent
(shown/hidden by the engine based on other chip values).

### Chip

An interactive input within a clause. Added with `.chip('id')`. The chip
ID maps to a domain name in the palette — when they match, you only need
the ID:

```ts
builder().text('Pick a').chip('color')  // looks up 'color' domain in palette
```

### Domain

Defines a chip's value space: what values are valid, how they display in
the chip trigger, and what popup UI appears when the user clicks.

### Palette

Maps domain names to domain instances. Created with `extendPalette()`:

```ts
const palette = extendPalette({
  chips: {
    color: keywordDomain({ color: 'sage', keywords: [{ value: 'red' }, { value: 'blue' }] }),
    name: textDomain({ color: 'rose', placeholder: 'a name' }),
  },
});
```

### Line

Visual grouping. Clauses after `.line()` render on a new row. Lines with
all-optional or all-contingent clauses auto-indent:

```ts
sentence(palette)
  .clause('trigger', builder().text('Every').chip('cadence').produces('cadence'))
  .line()
  .clause('detail', builder()
    .optional()
    .text('at')
    .chip('time')
  )
  .build();
```

## Domain Types

### Simple Domains

These cover the most common chip types. Each is a thin wrapper over the
engine — start here.

#### `keywordDomain(config)`

Fixed set of options. The user clicks one.

```ts
keywordDomain({
  color: 'sage',
  keywords: [
    { value: 'low' },
    { value: 'medium' },
    { value: 'high', label: 'High Priority' },
  ],
  default: 'medium',       // optional — defaults to first keyword
  placeholder: 'a level',  // optional — shown when value is invalid
})
```

- `color` — semantic color key (maps to `--chipper-color-{key}-*` CSS properties)
- `keywords` — array of `{ value, label?, display? }`. `label` defaults to
  `value`. `display` (shown on the chip trigger) defaults to `label`.
- `default` — initial value. Defaults to first keyword.
- `placeholder` — chip trigger text when value is invalid.

#### `textDomain(config)`

Free-text input. The user types a value.

```ts
textDomain({
  color: 'rose',
  placeholder: 'a task name',
  maxLength: 200,  // default 140
})
```

- `maxLength` — character limit (default 140)
- `validate` — custom validation function beyond non-empty
- `display` — format the value for the chip trigger
- `keywords` — optional preset values shown as pills above the text input

#### `numberDomain(config)`

Numeric input with a stepper UI (+/- buttons).

```ts
numberDomain({
  color: 'copper',
  min: 1,
  max: 365,
  step: 1,          // default 1
  suffix: 'days',   // shown after the value
  placeholder: 'a number',
})
```

- `min`, `max`, `step` — stepper bounds
- `prefix`, `suffix` — text flanking the input. Can be static strings or
  context-aware functions: `suffix: (ctx) => ctx.unit + 's'`
- `keywords` — optional preset values

#### `dateDomain(config)`

Calendar date picker. Values are `YYYY-MM-DD` strings.

```ts
dateDomain({
  color: 'sage',
  keywords: [
    { value: 'tomorrow', label: 'tomorrow' },
    { value: 'next-monday', label: 'next Monday' },
  ],
  placeholder: 'a date',
})
```

- `validate` — custom validation beyond YYYY-MM-DD format
- `display` — format the date for the chip trigger
- `keywords` — preset date shortcuts

### Power-User Domains

#### `keywordOrExpressionDomain(config)`

Keywords plus optional freeform expression input. The simple domains
delegate to this internally — use it directly when you need:

- **Trigger-gated expression**: a keyword that reveals the freeform input
- **Context-aware labels**: keyword labels that change based on other chips
- **Full expression config**: custom input types, prefix/suffix, validation

```ts
keywordOrExpressionDomain({
  color: 'copper',
  keywords: [
    { value: 'daily', label: 'day' },
    { value: 'weekly', label: 'week' },
  ],
  expression: numericExpression({
    min: 1,
    max: 365,
    trigger: { label: 'custom interval', default: '2' },
  }),
  default: 'weekly',
})
```

The `trigger` option hides the expression input until the user clicks
"custom interval". Without a trigger, the input is always visible.

Expression helpers: `textExpression()`, `numericExpression()`,
`dateExpression()` — sugar for building `ExpressionConfig` objects.

#### `multiSelectDomain(config)`

Toggle grid for selecting multiple values. The chip displays selected
items (up to 3, then a count).

```ts
multiSelectDomain({
  color: 'sage',
  options: [
    { label: 'Mon', value: 'mon' },
    { label: 'Tue', value: 'tue' },
    // ...
  ],
  keywords: [
    { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  ],
  placeholder: 'one or more days',
  countLabel: 'days',
})
```

- `options` — individual toggle items
- `keywords` — group shortcuts (selecting "weekdays" toggles all five)
- `countLabel` — label for "N selected" display (e.g., "3 days")

#### `alternativeCoordinateDomain(config)`

Tabbed popup with multiple input modes. Each mode has slots that compose
into a single value.

```ts
alternativeCoordinateDomain({
  color: 'sage',
  modes: [
    {
      id: 'date',
      label: 'Date',
      slots: [{ prefix: 'the', keywords: [{ label: 'first', value: '1' }] }],
      compose: (day) => day,
      decompose: (v) => [v],
      display: (v) => `the ${v}th`,
    },
  ],
  placeholder: 'a day',
})
```

#### `referenceDomain(config)`

Hierarchical navigation + search for external data. Supports async sources.

```ts
referenceDomain({
  color: 'indigo',
  source: {
    getItems: async (path) => fetchCategories(path),
    search: async (query) => searchCategories(query),
    resolveDisplay: async (id) => getCategoryLabel(id),
  },
  placeholder: 'a category',
})
```

## Building Sentences

### Optional Clauses

Users can toggle optional clauses on and off. Dormant optional clauses
render as muted italic text showing their configured values:

```ts
.clause('detail', builder()
  .optional()
  .text('with priority')
  .chip('priority')
)
```

### Contingent Clauses

Clauses that appear or disappear based on other chip values. Use
`.contingentOn()` with the ID of the clause that produces the context:

```ts
.clause('trigger', builder()
  .text('Every')
  .chip('cadence')
  .produces('cadence')  // makes cadence value available as context
)
.clause('weekday', builder()
  .text('on')
  .chip('day')
  .contingentOn('trigger', (ctx) => ctx.cadence === 'weekly')
)
```

The `weekday` clause only appears when cadence is "weekly". Context flows
down the contingency tree — a clause reads context from its superclause
and all ancestors.

**Lambda shorthand**: when you only need a presence predicate (no domain
reconfiguration), pass a bare function:

```ts
.contingentOn('trigger', (ctx) => ctx.cadence === 'weekly')
```

**Object form**: for cases that also need domain reconfiguration:

```ts
.contingentOn('trigger', {
  present: (ctx) => ctx.cadence === 'weekly',
  configure: (ctx) => ({ keywords: getOptionsFor(ctx.cadence) }),
})
```

### Context Propagation

`.produces()` declares what context keys a clause makes available to
contingent clauses:

```ts
// String shorthand — clause ID as context key, maps to its chip value
.produces('cadence')

// Object form — explicit mapping
.produces({ cadenceMeasure: 'cadenceMeasure', cadenceUnit: 'cadenceUnit' })
```

### Chip-Level Contingency

Individual chips within a clause can be shown/hidden based on context:

```ts
builder()
  .text('Every')
  .chip('measure')
  .chip('unit', { present: (ctx) => !isNaN(Number(ctx.measure)) })
```

The `unit` chip only appears when `measure` is numeric. Hidden chips are
excluded from context production.

### Keywords

Keywords support several display options:

```ts
{
  value: 'daily',                // the stored value
  label: 'day',                  // popup pill text (defaults to value)
  display: 'every day',          // chip trigger text (defaults to label)
}
```

Labels can be context-aware functions:

```ts
{ value: '1', label: (ctx) => `next ${ctx.unit ?? 'month'}` }
```

### Keyword Groups

Keywords can be organized into visual groups with labels, separators, and
layout control. Mix plain keywords and groups freely — ungrouped keywords
collect into an implicit group at the top:

```ts
keywordDomain({
  color: 'sage',
  keywords: [
    { value: '1', label: '1st' },
    { value: '15', label: '15th' },
    { value: 'last', label: 'last day' },
    {
      label: 'date',
      layout: 'grid',
      columns: 7,
      keywords: Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    },
  ],
})
```

Group options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | — | Header text above the group |
| `keywords` | `KeywordConfig[]` | *required* | Keywords in this group |
| `layout` | `'flow' \| 'grid'` | `'flow'` | Layout mode |
| `columns` | `number` | `7` | Grid columns (only with `layout: 'grid'`) |
| `prefix` | `string` | — | Text before keyword pills (e.g., "the") |

Grouping works across all keyword-accepting domains: `keywordDomain`,
`textDomain`, `numberDomain`, `dateDomain`, `keywordOrExpressionDomain`,
`multiSelectDomain` (options), and `alternativeCoordinateDomain` (slot keywords).

## Display Chips

Not every chip needs user input. **Display chips** show values from
external sources — fixed strings, derived computations, remote APIs,
or live subscriptions. Add `display` to any `.chip()` call:

```ts
// Static value — debugging, scaffolding, or contextually fixed data
.chip('project', 'projectName', { display: 'Praxis' })

// Derived from context — uses the same ctx pattern as contingency lambdas
.chip('cost', 'currency', {
  display: (ctx) => lookupPrice(ctx.item)
})

// Remote fetch — one-shot or polling
.chip('weather', 'text', {
  display: { url: '/api/weather', extract: (r: any) => r.temp, interval: 60000 }
})

// External subscription — WebSocket, EventSource, etc.
.chip('price', 'currency', {
  display: { subscribe: (cb) => stockTicker.on('AAPL', cb) }
})
```

Display chips render with no border and a pastel background. They're
visually distinct from interactive chips — the user can see them but
can't edit them.

### Info Popup

Display chips can show provenance info on click:

```ts
.chip('elapsed', 'text', {
  display: (ctx) => formatElapsed(new Date('2026-05-15')),
  info: 'Time elapsed since May 15, 2026',
})

// Dynamic info content
.chip('total', 'currency', {
  display: (ctx) => computeTotal(ctx),
  info: (value, state) => `Sum of ${countItems(state)} line items`,
})
```

### Source Types

| Shorthand | Source | Description |
|-----------|--------|-------------|
| Primitive (`'Praxis'`, `42`) | `static` | Fixed value, set once |
| Function (`(ctx) => ...`) | `derived` | Recomputes on state change, receives clause context |
| `{ url, extract, interval? }` | `remote` | Fetches from URL, optional polling |
| `{ subscribe }` | `external` | Consumer-managed subscription |

### Visual States

| State | Appearance |
|-------|-----------|
| Normal | Pastel background, no border |
| Loading | Subtle pulse animation |
| Error | Error-colored border |
| Info open | Accent glow (same as expanded interactive chips) |

### Serialization

Static display chips are included in serialized output (they hold real
values). Derived, remote, and external display chips are excluded — their
values are ephemeral.

## Reading State

The `onChange` callback receives a `SentenceState` on every change:

```ts
<Chipper sentence={mySentence} onChange={(state) => {
  // state.valid — is the entire sentence valid?
  // state.clauses — keyed by clause ID
  //   .active — is this clause currently shown?
  //   .valid — are all chips in this clause valid?
  //   .chips — keyed by chip ID
  //     .value — the current value
  //     .displayValue — formatted for display
  //     .valid — does the value pass domain validation?
  //     .dirty — has the user changed this chip?
}} />
```

## Theming

Chipper's appearance is controlled by CSS custom properties with the
`--chipper-*` prefix. Override them to match your app:

```css
:root {
  --chipper-bg-primary: #1a1b2e;
  --chipper-text-primary: #e0e0ef;
  --chipper-accent: #7b9fd4;
}
```

### Chip Colors

Each chip gets a semantic color via the `color` config field. Colors map
to three CSS properties:

```css
--chipper-color-{name}-text    /* chip text color */
--chipper-color-{name}-bg      /* chip background */
--chipper-color-{name}-hover   /* chip hover state */
```

The default theme (praxis) provides: copper, sage, slate, stone, teal,
rose, umber, plum, indigo.

### Font

Chipper inherits the consumer's font by default. Override with
`--chipper-font`.

## Headless Mode

Import from `chipper/headless` for hooks without components:

```ts
import { SentenceProvider, useSentence, useChip, usePopup } from 'chipper/headless';
```

Wrap your custom UI in `SentenceProvider`:

```tsx
<SentenceProvider definition={mySentence} onChange={handleChange}>
  <MyCustomSentenceUI />
</SentenceProvider>
```

Then use hooks inside:

- `useSentence()` — sentence-level state, dispatch, definition, resolved domains
- `useChip(clauseId, chipId)` — chip state + `setValue` function
- `usePopup()` — singleton popup state: `open()`, `close()`, `isOpen()`

## `<Chipper>` Component

The main entry point. Wraps `SentenceProvider` + `Sentence`:

```tsx
<Chipper
  sentence={mySentence}     // SentenceDefinition from .build()
  onChange={(state) => {}}   // called on every state change
/>
```

## API Reference

### Domain Factories

#### `keywordDomain(config)` — Fixed keyword set

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `keywords` | `KeywordGroupItem[]` | *required* | Values: `{ value, label?, display? }` or groups: `{ label?, keywords, layout?, columns?, prefix? }` |
| `default` | `string` | first keyword | Initial value |
| `placeholder` | `string` | — | Chip text when value is invalid |

#### `textDomain(config)` — Free-text input

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `placeholder` | `string` | — | Chip text when empty |
| `default` | `string` | `''` | Initial value |
| `maxLength` | `number` | `140` | Character limit |
| `validate` | `(v: string) => boolean` | non-empty | Custom validation |
| `display` | `(v: string) => string` | identity | Format value for chip trigger |
| `keywords` | `KeywordConfig[]` | — | Optional preset pills |

#### `numberDomain(config)` — Numeric stepper

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `placeholder` | `string` | — | Chip text when empty |
| `default` | `string` | `''` | Initial value |
| `min` | `number` | — | Minimum value |
| `max` | `number` | — | Maximum value |
| `step` | `number` | `1` | Stepper increment |
| `prefix` | `string \| (ctx) => string` | — | Text before input |
| `suffix` | `string \| (ctx) => string` | — | Text after input |
| `validate` | `(v: string) => boolean` | numeric check | Custom validation |
| `display` | `(v: string) => string` | identity | Format value for chip trigger |
| `keywords` | `KeywordConfig[]` | — | Optional preset pills |

#### `dateDomain(config)` — Calendar date picker

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `placeholder` | `string` | — | Chip text when empty |
| `default` | `string` | `''` | Initial value |
| `validate` | `(v: string) => boolean` | YYYY-MM-DD | Custom validation |
| `display` | `(v: string) => string` | identity | Format date for chip trigger |
| `keywords` | `KeywordConfig[]` | — | Optional date presets |

#### `keywordOrExpressionDomain(config)` — Keywords + freeform expression

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `keywords` | `KeywordGroupItem[]` | `[]` | Preset values (plain or grouped) |
| `expression` | `ExpressionConfig` | — | Freeform input config (omit for keywords-only) |
| `default` | `string` | first keyword or `''` | Initial value |
| `placeholder` | `string` | — | Chip text when value is invalid |
| `consumes` | `string[]` | — | Context keys read from ancestors |
| `produces` | `string[]` | — | Context keys written for descendants |
| `onContextChange` | `(ctx) => Partial<Domain>` | — | Reconfigure when context changes |

#### `expressionDomain(config)` — Expression-only (no keywords)

Same as `keywordOrExpressionDomain` but `expression` is required and
`keywords` is always empty.

#### `multiSelectDomain(config)` — Toggle grid

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `options` | `KeywordGroupItem[]` | *required* | Individual toggle items (plain or grouped) |
| `keywords` | `{ label, value: string[] }[]` | `[]` | Group shortcuts |
| `default` | `string[]` | `[]` | Initially selected values |
| `placeholder` | `string` | — | Chip text when empty |
| `maxSelections` | `number` | — | Cap on selected items |
| `countLabel` | `string` | `'selected'` | Label for "N selected" display |

#### `alternativeCoordinateDomain(config)` — Tabbed multi-mode

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `modes` | `AlternativeCoordinateMode[]` | *required* | Tab definitions with slots, compose, decompose, display |
| `default` | `string` | — | Initial composed value |
| `placeholder` | `string` | — | Chip text when value is invalid |

#### `referenceDomain(config)` — Hierarchical navigation + search

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | *required* | Semantic color key |
| `source` | `ReferenceSource` | *required* | `{ getItems, search, resolveDisplay }` |
| `keywords` | `KeywordConfig[]` | `[]` | Static shortcut values |
| `default` | `string` | `''` | Initial value |
| `placeholder` | `string` | — | Chip text when value is invalid |

### Expression Helpers

#### `textExpression(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `placeholder` | `string` | — | Input placeholder text |
| `maxLength` | `number` | — | Character limit |
| `validate` | `(v: string) => boolean` | non-empty | Custom validation |
| `display` | `(v: string) => string` | identity | Format for chip trigger |
| `prefix` | `string \| (ctx) => string` | — | Text before input |
| `suffix` | `string \| (ctx) => string` | — | Text after input |
| `position` | `'above' \| 'below'` | `'below'` | Input placement relative to keywords |
| `trigger` | `{ label, default }` | — | Keyword that reveals the input |

#### `numericExpression(options?)`

Same options as `textExpression`, plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | `number` | — | Minimum value |
| `max` | `number` | — | Maximum value |
| `step` | `number` | `1` | Stepper increment |

Default `validate` rejects empty strings and non-numeric values.

#### `dateExpression(options?)`

Same options as `textExpression`. Default `validate` checks YYYY-MM-DD
format and calendar validity.

### Builder

| Function | Description |
|----------|-------------|
| `sentence(palette?)` | Start building a sentence |
| `builder()` | Start building a clause |
| `chip(id, domainName?, options?)` | Standalone chip definition |
| `extendPalette(config)` | Create a palette with domain mappings |

#### Sentence Builder

| Method | Description |
|--------|-------------|
| `.clause(id, builder)` | Add a clause |
| `.line(options?)` | Start a new visual line |
| `.build()` | Return the `SentenceDefinition` |

#### Clause Builder

| Method | Description |
|--------|-------------|
| `.text(value)` | Add a text segment |
| `.chip(id, options?)` | Add a chip segment |
| `.optional()` | Make clause user-toggleable |
| `.contingentOn(id, config)` | Make clause context-dependent |
| `.produces(mapping)` | Declare context keys this clause produces |
| `.placeholder(text)` | Dormant clause display text |

### Hooks (headless)

| Hook | Description |
|------|-------------|
| `useSentence()` | Sentence state, dispatch, definition, domains |
| `useChip(clauseId, chipId)` | Chip state + `setValue` |
| `usePopup()` | Singleton popup: `open`, `close`, `isOpen` |

### Components

| Component | Description |
|-----------|-------------|
| `<Chipper>` | Auto-rendering entry point (`sentence` + `onChange`) |
| `<SentenceProvider>` | Context provider for headless mode |
| `<Sentence>` | Renders clauses grouped by lines |
| `<Clause>` | Renders text + chips for one clause |
| `<Chip>` | Trigger button + popup mount |

## Example

See [`demo/src/App.tsx`](demo/src/App.tsx) for a full working example
with contingent clauses, context propagation, multiple domain types,
theme switching, and multi-line sentences.

## License

MIT
