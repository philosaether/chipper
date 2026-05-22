# Assessment: KOE Facade API

Status: active
Date: 2026-05-22

---

## Problem

The `keywordOrExpressionDomain` is the most-used domain factory in Chipper.
It's also the most overloaded. It handles:

- Keywords only (overlaps with `enumDomain`)
- Keywords + text expression
- Keywords + numeric expression (stepper)
- Keywords + date expression (calendar)
- Text expression only (via `expressionDomain` alias)
- Numeric expression only
- Date expression only

This is architecturally sound — KOE genuinely is one archetype with
optional dimensions — but the consumer-facing DX suffers. The current
config for "a text input chip" is:

```typescript
expressionDomain({
  color: 'rose',
  expression: textExpression({ placeholder: 'task name' }),
  placeholder: 'a new task',
})
```

Three nested concepts (expression domain → text expression → placeholder)
for what the consumer thinks of as "a text field." The Praxis prototype's
action block needs at least two of these (`taskName`, `taskDescription`),
and they'll be among the most common chip types across all consumers.

The expression helpers (`textExpression()`, `numericExpression()`,
`dateExpression()`) already provide sugar at the ExpressionConfig level.
What's missing is sugar at the domain level — facades that hide the
KOE/expression machinery entirely.

## Current API inventory

| Factory | Wraps | Config burden |
|---------|-------|---------------|
| `enumDomain()` | standalone | low — keywords + color |
| `keywordOrExpressionDomain()` | standalone | medium — keywords + expression config |
| `expressionDomain()` | KOE (empty keywords) | medium — still needs expression config |
| `textExpression()` | ExpressionConfig | low — but lives one level too deep |
| `numericExpression()` | ExpressionConfig | low — same nesting problem |
| `dateExpression()` | ExpressionConfig | low — same nesting problem |
| `multiSelectDomain()` | standalone | medium |
| `alternativeCoordinateDomain()` | standalone | high (inherently complex) |
| `referenceDomain()` | standalone | medium |

The expression helpers are well-designed but stranded at the wrong
abstraction layer. A consumer who wants "a text chip" shouldn't need to
know that text is an expression mode of a keyword-or-expression domain.

## Proposed facades

Three domain-level facades, each wrapping `keywordOrExpressionDomain`
with zero-keyword defaults. Named for what the consumer thinks they're
creating, not for the underlying archetype.

### `textDomain(config)`

A chip where the user types text. The most basic freeform input.

```typescript
// Consumer writes:
textDomain({
  color: 'rose',
  placeholder: 'a task name',
  maxLength: 200,
})

// Equivalent to:
expressionDomain({
  color: 'rose',
  expression: textExpression({ maxLength: 200 }),
  placeholder: 'a task name',
})
```

Config surface:
- `color` — semantic color key (required)
- `placeholder` — chip trigger text when empty (optional)
- `default` — initial value (optional, defaults to '' → shows placeholder)
- `maxLength` — character limit (optional)
- `validate` — custom validation beyond non-empty (optional)
- `display` — format value for chip trigger (optional)
- `keywords` — preset values as keyword pills (optional, for the
  hybrid case where you want shortcuts + freeform)

When `keywords` is provided, this becomes a KOE domain with a text
expression — the consumer gets presets and freeform in one call without
having to think about expression modes or triggers.

### `numberDomain(config)`

A chip where the user enters a number via stepper UI.

```typescript
// Consumer writes:
numberDomain({
  color: 'copper',
  min: 1,
  max: 365,
  placeholder: 'an interval',
})

// Equivalent to:
expressionDomain({
  color: 'copper',
  expression: numericExpression({ min: 1, max: 365 }),
  placeholder: 'an interval',
})
```

Config surface:
- `color` (required)
- `placeholder`, `default` (optional)
- `min`, `max`, `step` — stepper bounds (optional)
- `prefix`, `suffix` — flanking text (optional, static or context fn)
- `keywords` — preset values (optional, same hybrid pattern)

### `dateDomain(config)`

A chip where the user picks a calendar date.

```typescript
// Consumer writes:
dateDomain({
  color: 'sage',
  placeholder: 'a date',
})

// Equivalent to:
expressionDomain({
  color: 'sage',
  expression: dateExpression(),
  placeholder: 'a date',
})
```

Config surface:
- `color` (required)
- `placeholder`, `default` (optional)
- `validate` — custom validation beyond YYYY-MM-DD (optional)
- `display` — format date for chip trigger (optional)
- `keywords` — preset values like "tomorrow", "next Monday" (optional)

## Design considerations

### Keywords make facades into KOE domains

When any facade receives `keywords`, it becomes a full KOE domain with
trigger-gated expression mode. The trigger label and default come from
sensible per-type defaults:

| Facade | Default trigger label | Default trigger value |
|--------|----------------------|----------------------|
| `textDomain` | "type a value" | "" |
| `numberDomain` | "enter a number" | "1" |
| `dateDomain` | "pick a date" | "" |

Without keywords, no trigger is needed — the expression is always-on
(current `expressionDomain` behavior).

### Naming

`textDomain` / `numberDomain` / `dateDomain` — named for the value type,
not the UI. Short, obvious, discoverable. Matches the mental model: "this
chip is a text field."

Alternative considered: `textInputDomain`, `numericInputDomain`,
`datePickerDomain`. Too verbose, and "input" is implementation detail —
the consumer cares about the value type, not the widget.

### What happens to expressionDomain?

Nothing — it stays. The facades are higher-level sugar; `expressionDomain`
remains available for consumers who need full ExpressionConfig control
(custom inputType combinations, unusual validation, prefix/suffix, etc.).

The layers stack: `textDomain` → `keywordOrExpressionDomain` →
`createDomain`. Each layer adds power and complexity. Consumers enter at
the layer that matches their need.

### Implementation scope

Each facade is ~10-20 lines — a function that destructures its config,
builds the equivalent `keywordOrExpressionDomain` config, and delegates.
Lives in `src/domains/keyword-or-expression.ts` alongside the existing
helpers. Exported from `src/index.ts`.

No new types, no new components, no engine changes. The popup and chip
rendering already handle expression-only KOE domains correctly.

### What about existing expression helpers?

`textExpression()`, `numericExpression()`, `dateExpression()` remain
unchanged. They're still useful for consumers building KOE domains
directly (keywords + expression with full control). The facades just
make the common "expression-only" case trivial.

## Impact on the demo

The action line from the Praxis prototype becomes:

```typescript
const praxisPalette = extendPalette({
  chips: {
    // ... existing cadence chips ...
    taskName: textDomain({ color: 'rose', placeholder: 'a task name' }),
    taskDescription: textDomain({
      color: 'rose',
      placeholder: 'a description',
      maxLength: 500,
    }),
    dueIn: numberDomain({
      color: 'copper',
      min: 1,
      max: 365,
      suffix: 'days',
      keywords: [
        { value: '1', label: 'tomorrow' },
        { value: '5', label: 'in 5 days' },
        { value: '7', label: 'in a week' },
      ],
    }),
  },
});
```

Compare to current equivalent without facades:

```typescript
taskName: expressionDomain({
  color: 'rose',
  expression: textExpression(),
  placeholder: 'a task name',
}),
taskDescription: expressionDomain({
  color: 'rose',
  expression: textExpression({ maxLength: 500 }),
  placeholder: 'a description',
}),
dueIn: keywordOrExpressionDomain({
  color: 'copper',
  keywords: [
    { value: '1', label: 'tomorrow' },
    { value: '5', label: 'in 5 days' },
    { value: '7', label: 'in a week' },
  ],
  expression: numericExpression({
    min: 1,
    max: 365,
    suffix: 'days',
    trigger: { label: 'enter a number', default: '1' },
  }),
}),
```

## Open questions

1. **Should `textDomain` with keywords use a trigger, or always-on
   expression?** The trigger pattern (click "type a value" to reveal
   the input) may be confusing for a text field where freeform is the
   primary mode. Always-on with keywords above might be better. But
   this conflicts with how KOE popup layout currently works — when
   keywords exist, always-on expression input sits below the keywords.
   Is that the right layout for this case?
   - Trigger keywords are out of scope for the sugar API -- if someone wants advanced KOE behavior, they can implement it manually in a KOE config block.

2. **Default value for text facades: empty string or placeholder-invalid?**
   Currently `expressionDomain` defaults to `''` which is invalid (fails
   non-empty validation), showing the placeholder. This is correct for
   text fields where "user must enter something" is the intent. But should
   the facade make this more explicit?
   - Optional default, placeholder display with '' value if default is not specified. '' display and '' value if neither placeholder nor default is specified.

3. **Should `enumDomain` get a parallel rename?** If we have `textDomain`,
   `numberDomain`, `dateDomain`, should `enumDomain` become
   `keywordDomain`? Or is `enum` clear enough? The current name is
   accurate but comes from the archetype layer, not the consumer layer.
   - Genuinely not sure. enumDomain behavior is very easy to replicate with a keyword-only KOE, but they're implemented as two different chip types under the hood.
    - Is there any reason to do that? From where I'm standing, I don't see one.
      - If that's the case, let's just get rid of the enumDomain and replace it with a keywordDomain wrapper on the KOE domain.
      - But if there's a valid reason to keep enumDomain around, let's keep it around
    - Sounds like a Tradeoff to mention in the draft; re-open the question if it's not clear.
