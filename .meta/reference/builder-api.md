# Builder API Reference

Quick reference for assembling sentence definitions.

---

## Entry points

### `sentence(palette?)`
Returns a `SentenceBuilder`. Entry point for defining a sentence. Uses `chipperPalette` if no palette provided.

### `builder()`
Returns a `ClauseBuilder`. Defines a single clause (a fragment of the sentence containing text and chips).

### `clause()`
**Deprecated** — alias for `builder()`. Use `builder()` instead.

### `chip(id, domainName?, options?)`
Returns a `ChipDefinition` directly. Standalone alternative to `ClauseBuilder.chip()` — useful when you need a chip definition outside the builder chain (rare).
- `domainName` — defaults to `id` when omitted
- `options.mode` — `ChipMode`, defaults to `{ type: 'interactive' }`

### `repeating(clauseBuilder, options)`
Returns a `RepeatingClauseConfig` for clause groups that can be added/removed by the user.
- `options.min` — minimum instances (default 0)
- `options.max` — maximum instances (default 5)

---

## Palette

### `extendPalette(config)` / `extendPalette(base, config)`
Extend a palette (or `chipperPalette` by default) with additional chip domains and clause patterns.

```typescript
const myPalette = extendPalette({
  chips: {
    cadence: keywordOrExpressionDomain({ ... }),
    priority: enumDomain({ ... }),
  },
  patterns: {
    // clause templates (not yet wired up)
  },
});
```

---

## Domain factories

### `enumDomain(config)`
Keywords-only domain. All values must match a keyword.
- `color` — semantic color key
- `keywords` — `[{ value, label?, display?, partial? }]`. `label` defaults to `value`, `display` defaults to `label`.
- `default` — default value. Defaults to first keyword's value.
- `placeholder` — chip text when value is invalid

### `keywordOrExpressionDomain(config)`
Keywords plus optional freeform expression input.
- `color`, `keywords`, `default`, `placeholder` — same as enum
- `expression` — `ExpressionConfig` (omit for keywords-only)

### `multiSelectDomain(config)`
Toggle grid of options with group keyword shortcuts.
- `color`, `default`, `placeholder` — same pattern
- `options` — `[{ value, label?, display? }]` individual toggle items
- `keywords` — group shortcuts with `string[]` values
- `maxSelections` — optional cap
- `countLabel` — label for "N selected" display (default "selected")

### `referenceDomain(config)`
Hierarchical navigation/search popup.
- `color`, `default`, `placeholder` — same pattern
- `source` — `{ getItems, search, resolveDisplay }`

### `alternativeCoordinateDomain(config)`
Tabbed popup with multiple input modes.

---

## Expression helpers

### `textExpression(options?)`
Sugar for `{ inputType: 'text', ...options }`. Returns `ExpressionConfig`.

### `numericExpression(options?)`
Sugar for `{ inputType: 'number', ...options }` with numeric validation default. Returns `ExpressionConfig`.

---

## SentenceBuilder methods

All return `SentenceBuilder` for chaining (except `build()`).

### `.clause(id, clauseBuilder)`
Add a clause to the sentence. `id` is unique within the sentence.

### `.clauses(clauseBuilders[])`
Add multiple clauses at once (from composition helpers). Auto-generates IDs.

### `.line(options?)`
Start a new visual line. Clauses added after `.line()` go on this line. The first line is implicit.
- `options.indent` — `boolean`. Indents the line.

### `.serializer(fn)` / `.deserializer(fn)`
Custom serialization (not yet implemented in engine).

### `.build()`
Returns the final `SentenceDefinition`. Validates no duplicate chip IDs.

---

## ClauseBuilder methods

All return `ClauseBuilder` for chaining. Segments (`.text()`, `.chip()`) render in call order.

### `.text(value)`
Add a text span.

### `.chip(id, domainName?)`
Add a chip. `domainName` defaults to `id` (common case: chip ID matches palette domain name).

### `.required()` / `.optional()`
Set clause necessity. Default is required.

### `.placeholder(text)`
Text shown when an optional clause is dormant.

### `.contingentOn(superclauseId, config)`
Make this clause contingent on another clause.
- `config.present` — `(context) => boolean`. When should this clause appear?
- `config.configure` — `(context) => ClauseOverrides`. Reconfigure chips based on context.

### `.produces(chipIdOrMapping)`
Declare context keys this clause produces.
- String form: `.produces('cadence')` → `{ cadence: 'cadence' }`
- Object form: `.produces({ period: 'cadence' })` → explicit mapping

### `.leads(first, rest)`
Lead text for repeating clause instances.

---

## Example

```typescript
const mySentence = sentence(myPalette)
  .clause('trigger', builder()
    .text('Every')
    .chip('cadence')
    .produces('cadence')
  )
  .line({ indent: true })
  .clause('detail', builder()
    .contingentOn('trigger', {
      present: (ctx) => !['daily', 'weekday'].includes(ctx.cadence as string),
    })
    .chip('period')
    .text('on')
    .chip('days', 'daySet')
  )
  .line()
  .clause('action', builder()
    .text('do')
    .chip('task', 'taskName')
  )
  .build();
```
