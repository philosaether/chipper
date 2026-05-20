# Assessment: KOE Mode-Switching — Keyword-Triggered Expression Mode

Date: 2026-05-20
Branch: main

## Current State

The `keywordOrExpressionDomain` factory creates a `Domain<string>` with
keywords and optionally one expression mode. The popup shows both
simultaneously — keyword pills above, expression input below. There's no
concept of "the chip is currently in keyword mode vs expression mode."

### What exists

**Domain** (`src/domains/keyword-or-expression.ts`):
- Keywords: array of `Keyword<string>` with value, label, displayLabel
- Expression: single `ExpressionMode<string>` with inputType, validate, display, min/max/step
- Validation: keyword match OR expression validate (flat OR)
- Display: keyword displayLabel OR expression display
- `expressionDomain()` alias: KOE with empty keywords

**ChipState** (`src/core/state.ts`):
- `value: T`, `displayValue: string`, `valid: boolean`, `dirty: boolean`
- No mode tracking — the chip doesn't know if its value came from a keyword
  selection or expression input

**Popup** (`src/components/popups/KeywordOrExpressionPopup.tsx`):
- Renders keyword pills (if any) + expression input (if configured)
- Both visible simultaneously — no mode switching
- Keyword click → onSelect + onClose
- Numeric stepper click → onSelect (stays open)
- Text input Enter → onSelect + onClose

**Chip trigger** (`src/components/Chip.tsx`):
- Renders `displayValue` as text in a button
- Click opens/closes popup
- No inline editing, no embedded stepper

**Domain reconfiguration** (`src/core/context-resolution.ts`):
- `configure()` on ContingencyConfig can override domain properties via
  shallow merge. Tested only with `placeholder` override.
- `onContextChange()` on Domain can self-reconfigure. Passed through by
  KOE factory but no archetype implements it.
- Both operate on *external* context (from ancestor clauses), not on the
  chip's own value.

### The desired behavior (cadenceType example)

```
Keyword mode (default):
  Chip shows "week" → user opens popup → sees keyword pills
  User clicks "custom interval" → popup closes → chip enters expression mode

Expression mode:
  Chip shows "2" (number picker) → user opens popup → sees stepper + keyword pills
  User clicks "day" → popup closes → chip returns to keyword mode, value = "daily"
```

Key properties:
1. A keyword selection triggers a mode switch (not a value store)
2. The chip's display changes based on mode (keyword label vs expression value)
3. Expression mode has a configurable default value ("2")
4. Selecting a regular keyword exits expression mode
5. The "custom interval" keyword is a mode trigger, not a display value

## What's Working

- Chip-level contingency: `cadencePeriod` appears when `cadenceType === 'custom'`.
  This already works. Mode-switching is complementary — it controls how the
  cadenceType chip *itself* renders, while chip contingency controls what
  *other* segments appear.
- Numeric stepper component exists and works (`NumericInput.tsx`)
- Domain reconfiguration machinery exists (configure + onContextChange)
- Builder DX: `.chip('id', { present })` footgun fixed

## Gaps

### 1. No chip-level mode state

ChipState has no way to record "I'm in expression mode." The reducer
can't distinguish a chip whose value is "2" because the user typed "2"
into an expression input vs. one that entered expression mode via a
mode-switching keyword. This matters because:

- Display differs: expression mode shows "2", keyword mode might also
  have a keyword with value "2"
- Popup layout differs: which UI to foreground depends on mode
- Returning to keyword mode needs to know we're *in* expression mode

### 2. No "mode-switching keyword" concept

Keywords are pure presets — selecting one stores its value. There's no
way to mark a keyword as "selecting this should switch modes instead of
storing a value." The Keyword type has `value`, `label`, `displayLabel`,
`partial` — none of these mean "trigger expression mode."

### 3. Value semantics are ambiguous

Currently, `value` always holds the chip's actual semantic value. In
expression mode, the value is the expression result (e.g., "2"). But
what triggers expression mode? Options:

- **A: Sentinel value** — "custom" is stored, expression value stored
  separately. Requires a second value field.
- **B: Mode flag** — value is always the expression result ("2"), mode
  is tracked separately. Downstream context sees "2", not "custom."
- **C: Composite value** — value encodes mode + expression (e.g.,
  `"custom:2"`). Ugly, breaks type safety.

Approach B is cleanest. Downstream doesn't care *how* the user specified
"every 2 weeks" — it cares about the number.

### 4. Expression default on mode entry

When the user clicks "custom interval," the chip needs to initialize to
a default expression value ("2"). This isn't `domain.defaultValue` (which
is the keyword default, e.g., "weekly"). It's an expression-mode-specific
initial value, distinct from the domain's initial state.

### 5. Self-referential reconfiguration

The existing `configure()` and `onContextChange()` depend on *external*
context (ancestor clause productions). Mode-switching is triggered by the
chip's own value selection — it's self-referential. The contingency tree
doesn't support a chip consuming its own production (cycles).

This means mode-switching can't use the existing reconfiguration path.
It needs to live in the SET_CHIP_VALUE action handler or in the domain
factory itself.

### 6. Popup behavior in expression mode

When the user opens the popup while in expression mode:
- Should the stepper be foregrounded?
- Should regular keywords still be visible (as escape hatches)?
- Should "custom interval" be hidden (it's already active)?

This is a UX question, but it has engine implications — the popup needs
to know which keywords to show and how to lay them out based on mode.

## Analysis: Where Mode Lives

**Option A: Mode on ChipState** (new field)
```typescript
interface ChipState<T = unknown> {
  value: T;
  displayValue: string;
  valid: boolean;
  dirty: boolean;
  expressionMode?: boolean;  // or expressionModeId?: string
}
```

- Pro: Reducer is the source of truth (consistent with visibleChips pattern)
- Pro: Components read mode from state, no re-derivation
- Con: Every archetype carries a field only KOE uses
- Con: Mode must be set/cleared by SET_CHIP_VALUE, coupling action logic
  to archetype behavior

**Option B: Mode derived from domain + value**
The domain knows which keywords are mode-switchers. Given a value, the
domain can answer "is this chip in expression mode?" No new state field.

- Pro: No state change, pure derivation
- Con: Requires iterating mode-switching keywords on every render
- Con: Can't distinguish "user typed 2" from "user entered expression
  mode and the default is 2" — though this may not matter

**Option C: Mode on Domain (meta field)**
Track mode-switching config on the domain itself, derive mode at render
time from the chip's value + domain config.

- Pro: Domain is already the authority on value interpretation
- Con: Same derivation cost as B

**Recommendation**: Option A. Mode on ChipState. The precedent is
`visibleChips` on ClauseState — engine-computed state that components
consume. Mode affects display, validity, popup layout, and context
production. That's reducer territory.

## Analysis: Mode-Switching Keyword Design

A keyword needs to be marked as a mode trigger. Options:

**Option A: New keyword field**
```typescript
interface KeywordConfig<T> {
  value: T;
  label?: string;
  display?: string;
  expressionTrigger?: true;  // selecting this enters expression mode
}
```

**Option B: Separate config on the domain**
```typescript
keywordOrExpressionDomain({
  keywords: [...],
  expression: { inputType: 'number', ... },
  modeSwitch: {
    keyword: 'custom',        // which keyword value triggers expression mode
    expressionDefault: '2',   // initial value when entering expression mode
  },
})
```

**Option C: Expression config gets the trigger**
```typescript
keywordOrExpressionDomain({
  keywords: [...],
  expression: {
    inputType: 'number',
    triggerKeyword: 'custom',  // keyword value that activates this mode
    default: '2',
  },
})
```

**Recommendation**: Option C feels most natural — the expression config
describes the expression mode, including what triggers it and what it
defaults to. This keeps the keyword array clean (keywords are still just
presets) and colocates expression behavior.

## Scope of Engine Work

### Must change

1. **ChipState** (`state.ts`) — add `expressionMode?: boolean`
2. **SET_CHIP_VALUE** (`actions/set-chip-value.ts`) — detect mode-switching
   keyword, set expressionMode flag, substitute expression default value
3. **KOE domain factory** (`domains/keyword-or-expression.ts`) — accept
   trigger config on ExpressionConfig, adjust validate/display for mode
4. **KeywordOrExpressionPopup** — layout changes based on expressionMode:
   foreground stepper, show keywords as escape hatches, hide trigger keyword
5. **Chip.tsx** — read expressionMode from state, potentially adjust trigger
   display or styling
6. **computeDisplayValue** (`initialize.ts`) — mode-aware display: when
   in expression mode, use expression display even if value matches a keyword

### May change

7. **Builder API** — DX sugar for common mode-switching patterns (cadence
   is the template case)
8. **initialize.ts** — initial state needs `expressionMode: false` (or
   undefined); if defaultValue is a mode-switching keyword, that's a config
   error
9. **Tests** — new test file for mode-switching: enter expression mode,
   exit expression mode, display in each mode, validity in each mode,
   interaction with chip-level contingency

### Doesn't change

- Context propagation — value is always the semantic value (keyword value
  or expression value), mode doesn't affect context
- Clause-level contingency — unaffected
- Chip-level contingency — works orthogonally (cadencePeriod's `present`
  predicate sees the value, not the mode)
- Other domain archetypes — expressionMode field is optional/unused

## DX Considerations

The cadence pattern is the template. Today it's:

```typescript
cadenceType: keywordOrExpressionDomain({
  color: 'copper',
  keywords: [
    { value: 'daily', label: 'day' },
    { value: 'weekly', label: 'week on...', display: 'week' },
    { value: 'weekday' },
    { value: 'weekend', label: 'weekend day' },
    { value: 'custom', label: 'custom interval', display: '2' },
  ],
  default: 'weekly',
})
```

After mode-switching, something like:

```typescript
cadenceType: keywordOrExpressionDomain({
  color: 'copper',
  keywords: [
    { value: 'daily', label: 'day' },
    { value: 'weekly', label: 'week on...', display: 'week' },
    { value: 'weekday' },
    { value: 'weekend', label: 'weekend day' },
  ],
  expression: numericExpression({
    min: 2,
    max: 365,
    step: 1,
    triggerKeyword: { label: 'custom interval' },
    default: '2',
  }),
  default: 'weekly',
})
```

The "custom" keyword moves out of the keywords array and into the
expression config as `triggerKeyword`. This is cleaner — "custom interval"
isn't a keyword in the traditional sense, it's an entry point to a
different input mode.

Open question: should triggerKeyword have a `value`? In keyword mode, the
chip stores 'daily', 'weekly', etc. In expression mode, it stores '2',
'3', etc. There's no value for the trigger keyword itself — it's consumed
by the mode switch, not stored. If we need a sentinel for downstream
context (e.g., `ctx.cadenceType === 'custom'`), we'd need to reconsider.

**Likely answer**: The downstream predicate changes from
`ctx.cadenceType === 'custom'` to something like
`!['daily','weekly','weekday','weekend'].includes(ctx.cadenceType)` or a
helper like `isExpression(ctx.cadenceType)`. The value in expression mode
is the number itself, which is what the consumer actually needs.

## Recommended Next Steps

1. `/draft` a design doc — this is significant enough to warrant a design
   cycle. The engine changes (ChipState mode field, SET_CHIP_VALUE mode
   detection, display logic) need to be nailed down before implementation.

2. Key design decisions to resolve in the draft:
   - Does the trigger keyword have a stored value, or is it consumed?
   - Does `expressionMode` on ChipState affect context production?
   - Popup layout in expression mode — stepper foregrounded or tabbed?
   - Can a domain have multiple expression modes with different triggers?
     (Probably not — YAGNI — but worth considering.)

3. Implementation is probably 1-2 sessions after design. The engine
   changes are contained (ChipState + SET_CHIP_VALUE + KOE factory +
   popup). No contingency tree changes needed.

- My intuition is saying "this is the first instance of a general pattern, and we should solve the general case first."
  - Proposal: we reintroduce the concept of a "composite" domain.
    - This time around, the composite domain would be a wrapper domain which *composes one or more chips of another domain*
    - For example, we would implement the cadenceTypeOrPeriod chip by composing two different KeywordOrExpressionDomain chips
      - one with the numeric expression mode configured,
      - and one without
    - The sentence reads the value from the composite domain wrapper, and the composite domain delegates to the mode
    - We would need to enhance keyword behavior in a nontrivial way -- I can't quite see the implications clearly, but maybe you can
      - Some keywords will set the composite domain mode. Some will set values. Some will do both.
      - Some keywords will display in one mode but not the other. Some will display in both.
