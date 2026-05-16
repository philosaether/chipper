# Builder API Reference

Quick reference for assembling sentence definitions.

---

## Entry points

### `sentence(palette?)`
Returns a `SentenceBuilder`. Entry point for defining a sentence. Uses `chipperPalette` if no palette provided.

### `clause()`
Returns a `ClauseBuilder`. Defines a single clause (a fragment of the sentence containing text and chips).

### `chip(id, domainName, options?)`
Returns a `ChipDefinition` directly. Standalone alternative to `ClauseBuilder.chip()` — useful when you need a chip definition outside the builder chain (rare).
- `options.mode` — `ChipMode`, defaults to `{ type: 'interactive' }`

### `repeating(clauseBuilder, options)`
Returns a `RepeatingClauseConfig` for clause groups that can be added/removed by the user (e.g., "when [X], and [Y], and [Z]").
- `options.min` — minimum instances (default 0)
- `options.max` — maximum instances (default 5)

---

## SentenceBuilder methods

All return `SentenceBuilder` for chaining (except `build()`).

### `.clause(id, clauseBuilder)`
Add a clause to the sentence. `id` is a unique string used to reference this clause in state, contingency, and context production.

### `.clauses(clauseBuilders[])`
Add multiple clauses at once (from composition helpers). Auto-generates IDs (`_composed_0`, `_composed_1`, ...).

### `.line(options?)`
Start a new visual line. Clauses added after `.line()` go on this line. The first line is implicit — you don't need `.line()` before the first clause unless you need to set options on it.
- `options.indent` — `boolean`. Indents the line (for subordinate/contingent clauses).

### `.serializer(fn)`
Custom serializer: `(state: SentenceState) => Record<string, unknown>`. Not yet implemented in engine.

### `.deserializer(fn)`
Custom deserializer: `(data: Record<string, unknown>) => Record<string, unknown>`. Not yet implemented in engine.

### `.build()`
Returns the final `SentenceDefinition`.

---

## ClauseBuilder methods

All return `ClauseBuilder` for chaining. Segments (`.text()`, `.chip()`) are rendered in call order.

### `.text(value)`
Add a text span. Use for lead text, conjunctions, trailing punctuation — anything that isn't a chip.

### `.chip(id, domainName, options?)`
Add a chip. `id` must be unique within the sentence. `domainName` resolves against the palette.
- `options.mode` — `ChipMode`, defaults to `{ type: 'interactive' }`

### `.required()`
Mark clause as required (default). Always visible, cannot be toggled off.

### `.optional()`
Mark clause as optional. User can toggle it on/off. Shows placeholder text when dormant.

### `.placeholder(text)`
Text shown when an optional clause is dormant (collapsed). Falls back to the clause ID if not set.

### `.contingentOn(superclauseId, config)`
Make this clause contingent on another clause. The engine controls presence based on context.
- `config.present` — `(context: SentenceContext) => boolean`. When should this clause appear? Receives context from ancestor producers. Omit to always be present when superclause is present.
- `config.configure` — `(context: SentenceContext) => ClauseOverrides`. Reconfigure chips based on context (e.g., swap keywords, change validation).

### `.produces(mapping)`
Declare context keys this clause produces. `mapping` is `Record<string, string>` where keys are context key names and values are chip IDs whose values populate them.
- Example: `.produces({ cadence: 'cadence' })` — context key "cadence" gets its value from the chip with ID "cadence".

### `.leads(first, rest)`
Set lead text for repeating clause instances. `first` is shown on the first instance, `rest` on subsequent ones. Currently only stores `first` (rest support pending with repeating clauses).

---

## Example

```typescript
const mySentence = sentence(myPalette)
  .clause('trigger', clause()
    .text('Every')
    .chip('cadence', 'cadence')
    .produces({ cadence: 'cadence' })
  )
  .line({ indent: true })
  .clause('detail', clause()
    .contingentOn('trigger', {
      present: (ctx) => !['daily', 'weekday'].includes(ctx.cadence as string),
    })
    .chip('period', 'period')
    .text('on')
    .chip('days', 'daySet')
  )
  .line()
  .clause('action', clause()
    .text('do')
    .chip('task', 'taskName')
  )
  .build();
```
