# Assessment: Context-Aware Display Values

Date: 2026-05-20
Branch: feature/demo-iteration

## Current State

`computeDisplayValue(domain, value, isValid)` is called at 3 sites. None
receive sentence context. Display formatting is purely value → string via
`domain.display()`.

### Call sites

**1. initializeSentenceState** (`initialize.ts:124`)
Default values at boot. No context exists yet — contexts array is empty.
`runInitialContextPass` runs afterwards but does not recompute display.

**2. SET_CHIP_VALUE** (`actions/set-chip-value.ts:59`)
User changes a chip. `computeDisplayValue` is called BEFORE context
is resolved (line 59). `buildClauseContext` happens later (line 77) for
segment visibility. Context is available in the store but not yet built
at the point display is computed.

**3. revalidateClauseChips** (`context-resolution.ts:233`)
Domain reconfiguration during contingency cascade. Called from within
`evaluateContingency`, which has full context. But context is not passed
through to `computeDisplayValue`.

### domain.display() encapsulation

All production calls to `domain.display()` go through `computeDisplayValue`.
No other code calls it directly. The function is the single chokepoint.

### displayValue downstream

`ChipState.displayValue` flows: reducer → useChip() → Chip component →
rendered in trigger button. Read-only after computation. No downstream
changes needed if the computation changes.

## Gaps

### Context not available at display time

The motivating case: "next month" keyword label needs to say "next quarter"
when cadenceUnit is "quarter". This requires the display function to read
ancestor context. Currently impossible — `domain.display(value)` receives
only the value.

### runInitialContextPass doesn't recompute display

After initial context propagation, chips that depend on context for display
still show the default-computed display value. A chip initialized with
value "1" would show "next month" even if cadenceUnit defaults to "week".

## Blast Radius

### Signature change: `computeDisplayValue(domain, value, isValid, context?)`

**3 call sites**, all in core:
- `initialize.ts:124` — pass `{}` (empty context, same as today)
- `set-chip-value.ts:59` — reorder: build context first, then compute display
- `context-resolution.ts:233` — pass context from parent `evaluateContingency`

### Type change: `domain.display(value, context?)`

**Domain interface** (`types.ts`): `display: (value: T, context?: SentenceContext) => string`

All domain factories need updating, but the context parameter is optional
so existing factories work without changes. Only factories that want
context-aware display pass it through.

### runInitialContextPass needs display recomputation

After the initial context pass propagates defaults down the tree, chips
with context-aware display need their `displayValue` recomputed. Currently
it only recomputes validity, visibility, and contingency — not display.

This is the one non-trivial addition: `evaluateContingency` and/or
`runInitialContextPass` need to recompute display for chips whose domains
have context-aware display functions. The simplest approach: always
recompute display during revalidation (it's cheap — one function call).

### KOE factory: keyword labels

Dynamic keyword labels are a separate concern from `domain.display()`.
The display function handles chip trigger text. Keyword labels are rendered
by the popup component from `domain.keywords[].label`.

For dynamic keyword labels, the same context plumbing applies: the popup
already receives context (added for prefix/suffix). Keyword labels would
accept `string | ((context) => string)` on the Keyword type, and the
popup resolves them at render time.

This is additive — doesn't interact with the display function change.

### Files changed

```
Must change:
  src/core/types.ts                     — Domain.display signature, Keyword.label type
  src/core/initialize.ts                — pass context to computeDisplayValue
  src/core/actions/set-chip-value.ts    — reorder: build context before display
  src/core/context-resolution.ts        — pass context in revalidateClauseChips

Likely change:
  src/domains/keyword-or-expression.ts  — pass context through in display function
  src/components/popups/KeywordOrExpressionPopup.tsx — resolve dynamic keyword labels

No change:
  src/components/Chip.tsx               — reads displayValue, doesn't compute it
  src/components/ChipPopup.tsx          — already passes context
  Other domain factories                — context param is optional, backwards compat
  Tests                                 — existing tests pass (context is optional)
```

## Recommended Next Steps

Two independent changes that can ship together or separately:

1. **Context-aware display** — add optional context to `computeDisplayValue`
   and `domain.display()`. Recompute display during revalidation. This is
   the engine change. ~30 lines across 4 files.

2. **Dynamic keyword labels** — `Keyword.label` accepts
   `string | ((context) => string)`. Popup resolves at render time (already
   has context). This is a popup/type change. ~15 lines across 3 files.

Both are small enough to build directly — no /draft needed.
