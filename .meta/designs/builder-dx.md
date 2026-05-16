---
Status: accepted
Date: 2026-05-16
Accepted: 2026-05-16
Assessment: ../assessments/grab-bag-scope.md
---

# Builder DX — Desired State

Reduce friction in the builder API so that defining a sentence feels natural
and requires minimal boilerplate. These changes are informed by hands-on
builder experience during the vertical slice 2 session.

Source: `.meta/inbox/devex-wishlist.md`

---

## 1. Clause definition idiom

**Problem**: `.clause('id', clause())` is the most frequently typed line
in chipper config and it's awkward — the `clause` name appears twice, and
the inner `clause()` constructor adds noise.

**Decision**: Rename `clause()` to `builder()`. The standalone constructor
stays — no callback overload. `builder()` is concise, honest about what
it does, and immediately clear to anyone who knows the builder pattern.

```typescript
// Before
.clause('trigger', clause()
  .text('Every')
  .chip('cadence', 'cadence')
  .produces({ cadence: 'cadence' })
)

// After
.clause('trigger', builder()
  .text('Every')
  .chip('cadence')
  .produces('cadence')
)
```

**Implementation**: Rename `clause()` export to `builder()`. Update all
callsites (demo, tests). Keep `clause()` as a deprecated alias during
the transition.

---

## 2. Chip ID as implicit domain name

**Problem**: `.chip('cadence', 'cadence')` is redundant when the chip ID
matches the palette domain name, which is the common case.

**Decision**: `.chip('cadence')` is equivalent to `.chip('cadence', 'cadence')`.

**Implementation**: Make `domainName` optional, default to `id`:

```typescript
chip(id: string, domainName?: string, options?: { mode?: ChipMode }): ClauseBuilder;
```

**Duplicate chip ID validation**: Runtime check in `sentence.build()`.
Maintain a `Set<string>` of seen chip IDs, throw if duplicate. Catches
mistakes during development with zero tooling setup.

---

## 3. produces() shorthand

**Problem**: `.produces({ cadence: 'cadence' })` is verbose when the
context key name matches the chip ID, which is the common case.

**Decision**: One shorthand — string form. No-arg form dropped (too
conditional and potentially misleading).

```typescript
// String shorthand: context key = chip ID
.produces('cadence')
// → { cadence: 'cadence' }

// Explicit mapping (existing)
.produces({ period: 'cadence' })
```

**Implementation**: Add string overload:

```typescript
produces(chipId: string): ClauseBuilder;
produces(mapping: Record<string, string>): ClauseBuilder;
```

---

## 4. Keyword display label

**Problem**: No way to show different text in the popup vs the chip trigger.
E.g., popup shows "day" but chip shows "day of the week."

**Decision**: Add optional `displayLabel` to `Keyword<T>` core type.
Domain `display()` functions check `displayLabel` first when resolving
from a keyword match.

```typescript
interface Keyword<T = unknown> {
  label: string;         // popup text
  displayLabel?: string; // chip trigger text (defaults to label)
  value: T;
  partial?: boolean;
}
```

**Domain config sugar**: Domain configs accept keyword shorthand with
cascading defaults. Normalization is shared across all keyword-accepting
domains (not KOE-specific):

```typescript
keywords: [
  { value: 'daily', label: 'day', display: 'day of the week' },
  { value: 'weekly' },  // label = 'weekly', display = 'weekly'
]
```

Normalization rules:
- `label` defaults to `value`
- `display` maps to `displayLabel`, defaults to `label`

---

## 5. defaultValue → default

**Problem**: `defaultValue` is verbose. Also, when all values are keywords,
it's redundant — the first keyword is the natural default.

**Decision**: Rename to `default` in domain configs. When omitted, use
the first keyword's value. When there are no keywords, use `''` (existing
behavior). `default` as a property name is well-established in TS
codebases (webpack, Storybook, etc.) and causes no tooling issues.

```typescript
// Before
keywordOrExpressionDomain({ ..., defaultValue: 'weekly' })

// After
keywordOrExpressionDomain({ ..., default: 'weekly' })
// Or omit entirely — defaults to first keyword
```

**Implementation**: Update all domain factory config interfaces.

---

## 6. Palette property rename

**Problem**: `extendPalette({ domains: {} })` — consumers think in terms
of "chips," not "domains." Domains are an internal concept.

**Decision**: Consumer-facing rename only. `extendPalette` accepts
`{ chips, patterns }` and maps to internal `{ domains, clauseTemplates }`.

```typescript
interface PaletteConfig {
  chips?: Record<string, Domain>;
  patterns?: Record<string, ClauseTemplate>;
}

function extendPalette(config: PaletteConfig): Palette;
function extendPalette(base: Palette, config: PaletteConfig): Palette;
```

---

## 7. Expression inputType must be explicit

**Problem**: `inputType` defaults to `'text'`, hiding a choice the
consumer should make deliberately.

**Decision**: Remove the default. Add sugar helpers that live alongside
`keywordOrExpressionDomain` in the KOE domain module:

```typescript
import { textExpression, numericExpression } from 'chipper';

expression: textExpression({ placeholder: 'task name', maxLength: 200 })
expression: numericExpression({ min: 1, max: 52, step: 1 })
```

These return `ExpressionConfig` objects with `inputType` pre-set and
type-appropriate defaults (e.g., `numericExpression` sets
`validate: v => !isNaN(Number(v))` unless overridden).

---

## Tradeoffs

### Standalone constructor vs callback for clause definition (#1)

- **Alternative**: Callback form `clause('id', c => c.text(...))` —
  fewer keystrokes, eliminates the double-`clause` name.
- **Rejected because**: Saves 4 characters over `builder()` but adds
  indirection. `builder()` is self-documenting and doesn't require
  explaining what `c` is.
- **Revisit if**: Composition helpers need to pass builders around in
  ways that make the callback form more natural.

### Internal rename for palette (#6)

- **Alternative**: Rename `Palette.domains` → `Palette.chips` everywhere.
- **Rejected because**: "Domain" is the correct concept internally — a
  chip's value space, not the chip itself. Renaming everywhere conflates
  two levels of abstraction.
- **Revisit if**: The internal/external naming split causes confusion in
  docs or debugging.

### `default` as property name (#5)

- **Alternative**: Keep `defaultValue`, or use `initial`, `preset`, etc.
- **Chosen `default` because**: Most natural English, well-established
  in TS codebases. No tooling issues — only problematic as a standalone
  identifier, not as a property name.

---

## Out of Scope

- **Contingency at chip/text level** — major engine work, needs its own
  design cycle. Noted in wishlist, deferred.
- **Clause composition helpers** (every(), whenever()) — depends on
  patterns in the palette, which aren't populated yet.
- **`required()` default** — already works this way, no change needed.
