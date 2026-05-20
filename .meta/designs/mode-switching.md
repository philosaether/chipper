---
Status: accepted
Date: 2026-05-20
Accepted: 2026-05-20
Implemented: 2026-05-20 (feature/mode-switching)
Divergences: none
Deferred: popup component tests (koe-mode-popup.test.tsx — reducer tests cover behavior)
Assessment: ../assessments/koe-mode-switching.md
---

# Mode-Switching — Desired State

Extend domain keywords so that selecting a keyword can switch a chip into
expression mode (and selecting a regular keyword switches it back). This
is a general-purpose mechanism — any domain with keywords and an expression
mode can opt into it. The motivating case is the cadence chip: "custom
interval" enters a numeric stepper, "day" exits back to keyword display.

---

## 1. Concept: Mode-Triggering Keywords

Today, keywords and expression modes coexist but don't interact — the popup
shows both simultaneously, and selecting either stores a value. Mode-switching
changes that: certain keywords are designated as **triggers** that enter
expression mode instead of storing a value.

```
Keyword mode (default):
  Chip displays "week"
  Popup: [day] [week on...] [weekday] [weekend day] [custom interval]
  User clicks "custom interval" → popup closes, chip enters expression mode

Expression mode:
  Chip displays "2"
  Popup: [day] [week on...] [weekday] [weekend day] | [− 2 +]
  User clicks "day" → popup closes, chip exits expression mode, value = "daily"
```

Properties:
1. The trigger keyword enters expression mode and sets an expression default
2. Regular keywords exit expression mode (implicitly — no special config)
3. The chip's value is always semantic: "daily" in keyword mode, "2" in
   expression mode. No sentinels.
4. The trigger keyword does not appear as a pill in expression mode (it's
   already active)

### Trigger-gated vs always-on expression

This design introduces two flavors of KOE domain:

- **Always-on expression** (no trigger): The existing behavior. Expression
  input is always visible in the popup alongside keywords. Keywords are
  shortcuts that set the expression value (e.g., fit-weight chip: "a lot"
  sets the stepper to 8). No mode state, no mode transitions.

- **Trigger-gated expression** (has trigger): Expression input is hidden
  by default. A trigger keyword reveals it. Keywords exit expression mode.
  Mode is tracked on ChipState.

The mode-switching machinery only activates when `trigger` is present.
Always-on expression chips are completely untouched by this change.

---

## 2. Domain Config Changes

### ExpressionConfig gets a trigger keyword

```typescript
interface ExpressionConfig {
  inputType: 'text' | 'number';
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  validate?: (value: string) => boolean;
  display?: (value: string) => string;

  /** Keyword that enters expression mode when selected. */
  trigger?: {
    /** Popup pill label (e.g., "custom interval") */
    label: string;
    /** Default value when entering expression mode (e.g., "2") */
    default: string;
  };
}
```

The trigger lives on the expression config because it describes an entry
point into that expression mode. It's not a "real" keyword — it has no
stored value and doesn't appear in the keywords array.

When `trigger` is absent, the expression input is always visible in the
popup (existing behavior, unchanged). When `trigger` is present, the
expression input is hidden until the trigger is selected.

### Sugar helpers pass it through

```typescript
numericExpression({
  min: 2,
  max: 365,
  trigger: { label: 'custom interval', default: '2' },
})
```

### Full cadence example

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
    trigger: { label: 'custom interval', default: '2' },
  }),
  default: 'weekly',
})
```

Clean separation: keywords are keywords, the expression config owns its
trigger. The "custom" keyword disappears from the keywords array entirely.

---

## 3. ChipState Gets a Mode Field

```typescript
interface ChipState<T = unknown> {
  value: T;
  displayValue: string;
  valid: boolean;
  dirty: boolean;
  loading?: boolean;
  error?: string;

  /** True when the chip is in expression mode via a trigger keyword. */
  expressionMode?: boolean;
}
```

`expressionMode` is `undefined` (falsy) for:
- Chips on domains without a trigger (always-on expression, pure enum, etc.)
- Chips on trigger-gated domains that are currently in keyword mode

Set to `true` only when the user selects a trigger keyword. Cleared when
they select a regular keyword.

Always-on expression chips (fit-weight, task name, etc.) never have
`expressionMode` set. There's no mode distinction for them — keywords are
just shortcuts that set the same value the expression input does.

Precedent: `visibleChips` on ClauseState — engine-computed state that
components consume. Mode affects popup layout and display path. That's
reducer territory.

---

## 4. Domain Factory Changes

The KOE factory needs to:

1. **Build a synthetic trigger keyword** for the popup — the trigger
   needs to appear as a pill in the popup when in keyword mode. The factory
   creates an internal `Keyword<string>` from the trigger config, but
   stores it separately from the user-defined keywords (it's not a real
   keyword — it has no value to store).

2. **Expose trigger metadata** on the domain — the reducer and popup
   need to know: does this domain have a trigger? What's the expression
   default? Store this in `domain.meta`:

   ```typescript
   meta: {
     trigger: {
       label: 'custom interval',
       default: '2',
     },
   }
   ```

3. **Display function** — no change needed. `domain.display()` uses
   keyword-first lookup, expression display fallback. For trigger-gated
   domains the value spaces are disjoint in practice (keywords are strings
   like "daily", expression values are numbers like "2"). If a value
   collides (user types a keyword string into a text expression), the
   display is the same either way — the keyword label matches the typed
   value. Mode-awareness for *display* is unnecessary; mode-awareness for
   *popup layout* is handled by `expressionActive` on the popup props.

4. **Validation** — no change needed. `domain.validate()` already accepts
   any value that passes keyword OR expression validation.

---

## 5. SET_CHIP_VALUE Changes

The action handler is the only place mode transitions happen. When a chip
value is set:

```typescript
// In handleSetChipValue, after resolving domain and clause:

const trigger = domain.meta?.trigger as { label: string; default: string } | undefined;
let effectiveValue = value;
let expressionMode = clause.chips[chipId]?.expressionMode;

if (trigger) {
  // Check if the incoming value is a trigger-keyword selection.
  // The popup sends a sentinel (see §6) to signal trigger activation.
  if (value === TRIGGER_SENTINEL) {
    expressionMode = true;
    effectiveValue = trigger.default;
  } else if (expressionMode && domain.keywords.some(k => k.value === value)) {
    // Selecting a regular keyword exits expression mode
    expressionMode = false;
  }
  // Selecting a value while already in expression mode (stepper change)
  // keeps expressionMode = true. No action needed.
}

const newChipState: ChipState = {
  value: effectiveValue,
  displayValue: computeDisplayValue(domain, effectiveValue, isValid),
  valid: isValid,
  dirty: true,
  expressionMode: expressionMode || undefined,
};
```

When `trigger` is absent (always-on expression), none of this code runs.
The handler behaves exactly as it does today.

### Trigger sentinel

The popup needs to communicate "user clicked the trigger keyword" vs
"user set a regular value." Options:

- **Symbol sentinel** — `const TRIGGER_SENTINEL = Symbol('trigger')`.
  The popup calls `onSelect(TRIGGER_SENTINEL)`. SET_CHIP_VALUE detects it.
  Clean, zero collision risk, but the action's `value` field is typed as
  `unknown` so this works.
- **String sentinel** — `onSelect('__chipper_trigger__')`. Collision risk
  with real values (unlikely but ugly).
- **Separate action** — `SET_CHIP_MODE`. Cleaner separation, but adds a
  new action type for a single-purpose concern.

Going with **Symbol sentinel**. It's the simplest mechanism that avoids
collision. The symbol is internal — consumers never see it.

```typescript
// src/core/mode-switching.ts (or inline in types)
export const TRIGGER_SENTINEL = Symbol('chipper:trigger');
```

---

## 6. Popup Changes

### KeywordOrExpressionPopup receives mode state

```typescript
interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  value: string;
  expressionMode?: ExpressionMode<string>;
  expressionActive?: boolean;        // ← new: is the chip in expression mode?
  triggerLabel?: string;             // ← new: label for the trigger pill
  maxLength?: number;
  onSelect: (value: string | symbol) => void;  // ← widened for sentinel
  onClose: () => void;
}
```

### Layout: three cases

**1. Always-on expression** (no trigger — `triggerLabel` absent):
```
┌──────────────────────────────┐
│  [a lot] [a little]          │  ← keyword shortcuts
│  [− 5 +]                     │  ← expression always visible
└──────────────────────────────┘
```
Existing behavior, unchanged.

**2. Trigger-gated, keyword mode** (`triggerLabel` present, `expressionActive` false):
```
┌──────────────────────────────┐
│  [day] [week on...] [weekday]│
│  [weekend day]                │
│  [custom interval]            │  ← trigger pill
└──────────────────────────────┘
```
No expression input visible. The trigger pill is the entry point.

**3. Trigger-gated, expression mode** (`expressionActive` true):
```
┌──────────────────────────────┐
│  [day] [week on...] [weekday]│
│  [weekend day]                │
│  ─────────────────────────── │  ← visual separator
│  [− 2 +]                     │  ← stepper foregrounded
└──────────────────────────────┘
```
Regular keywords remain visible as escape hatches. Trigger pill is hidden
(the user is already in expression mode). Expression input is foregrounded.

### Trigger pill click

```typescript
// In the trigger pill's onClick:
onSelect(TRIGGER_SENTINEL);
onClose();
```

The popup doesn't manage mode — it just signals intent. The reducer
handles the transition.

### ChipPopup routing update

ChipPopup passes the new props through from chip state:

```typescript
case 'keyword-or-expression': {
  const expressionMode = domain.expressionModes[0] as ExpressionMode<string> | undefined;
  const trigger = domain.meta?.trigger as { label: string; default: string } | undefined;
  return (
    <KeywordOrExpressionPopup
      keywords={domain.keywords as Keyword<string>[]}
      value={value as string}
      expressionMode={expressionMode}
      expressionActive={chipState.expressionMode}
      triggerLabel={trigger?.label}
      maxLength={expressionMode?.maxLength}
      onSelect={onSelect as (value: string | symbol) => void}
      onClose={onClose}
    />
  );
}
```

---

## 7. Context Production

Mode doesn't affect context production. The chip's `value` is always the
semantic value — "daily" or "2" — and that's what flows through
`buildContextFromChips` and into the contingency tree.

The cadencePeriod chip's `present` predicate currently checks
`ctx.cadenceType === 'custom'`. After mode-switching, "custom" is never
stored as a value. The predicate needs to change — consumer's choice how:

```typescript
// Option A: check if value parses as a number
.chip('cadencePeriod', {
  present: (ctx) => !isNaN(Number(ctx.cadenceType))
})

// Option B: enumerate known keywords
.chip('cadencePeriod', {
  present: (ctx) => !['daily', 'weekly', 'weekday', 'weekend'].includes(ctx.cadenceType as string)
})
```

This is a consumer-side change. No helper needed — power users can write
their own comparators.

---

## 8. Initialization

When initializing chip state from a domain with a trigger:

- `expressionMode` starts `undefined` (keyword mode)
- Default value is a keyword value (e.g., "weekly") — normal path
- If someone configures `default` to match the expression default (e.g.,
  "2"), the chip starts in keyword mode with that value but won't be in
  expression mode. Expression mode is only entered via trigger selection.
  This is correct — the initial state is always keyword mode.

Edge case: if `default` is not a valid keyword, the chip starts invalid
with placeholder display. This is existing behavior (no change).

For always-on expression domains (no trigger), initialization is unchanged:
the default value goes through the existing path, `expressionMode` is
never set. A domain like `expressionDomain({ expression: numericExpression(),
default: '5' })` starts valid with "5" displayed — same as today.

---

## 9. File Plan

**Modified files:**
```
src/domains/keyword-or-expression.ts  — trigger on ExpressionConfig, meta population
src/core/state.ts                     — expressionMode on ChipState
src/core/actions/set-chip-value.ts    — mode transition logic
src/components/popups/KeywordOrExpressionPopup.tsx — mode-aware layout
src/components/ChipPopup.tsx          — pass expressionActive + triggerLabel
```

**New files:**
```
src/core/mode-switching.ts            — TRIGGER_SENTINEL symbol export
tests/core/mode-switching.test.ts     — mode transitions, value semantics, context
tests/components/koe-mode-popup.test.tsx — popup layout in each mode (may fold into existing)
```

**Demo update (same session or follow-up):**
```
demo/src/App.tsx                      — update cadenceType to use trigger config
```

---

## Tradeoffs

### Mode on ChipState vs derived from value

Could derive mode by checking whether the current value is in the keyword
set (if not → expression mode). No new state field needed.

Rejected: Can't distinguish "user typed 2" from "user entered expression
mode." For the cadence case specifically this doesn't matter (2 won't be
a keyword), but the general mechanism should handle domains where keyword
values and expression values could overlap. Also, the initial default might
be a non-keyword value without being in expression mode — derivation would
give the wrong answer.

Revisit if: expressionMode on ChipState causes stale-state bugs or
serialization headaches.

### Symbol sentinel vs separate action type

Could add a `SET_CHIP_MODE` action instead of overloading `SET_CHIP_VALUE`
with a sentinel. Cleaner separation of concerns.

Rejected: Mode and value change together — entering expression mode also
sets the expression default value. Two separate dispatches would create an
intermediate state (mode changed, value not yet updated) that could trigger
incorrect contingency evaluation. The sentinel keeps it atomic.

Revisit if: Other mode-transition patterns emerge that don't involve value
changes.

### Trigger on ExpressionConfig vs on Keyword

Could mark a keyword as `{ value: 'custom', expressionTrigger: true }`
instead of putting the trigger on the expression config. This keeps
triggers in the keywords array where they appear in the popup.

Rejected: The trigger isn't semantically a keyword — it has no stored
value, it's an entry point to a different input mode. Putting it on the
expression config colocates it with the mode it activates. The keywords
array stays clean: every keyword in the array is a real preset with a real
value.

The trigger's `default` field serves as the initial expression value —
it's the value the trigger "stores" in a sense, but it's not the trigger's
identity. After the user changes the stepper to 3, there's no record that
the trigger was ever involved. This is by design.

Mode-specific keywords (keywords that only appear in one mode) are not in
scope for v1. If needed, the popup already knows `expressionActive` and
could filter the keyword list — straightforward extension.

### Popup layout: trigger-gated vs always-on

Could show expression input always, even for trigger-gated domains,
letting the trigger keyword just set a default value in the input.

Rejected: The whole point of mode-switching is contextual revelation —
the chip starts simple (keyword pills only) and becomes richer when the
user opts in. Always-on is the existing behavior for domains that want it
(no trigger). The trigger gates the transition.

### Composite domain as alternative architecture

Could wrap multiple sub-domain instances in a composite domain, with
mode-switching selecting which sub-domain is active. More general — could
compose arbitrary domain types, not just keywords + expressions.

Rejected for now: Significantly larger engine change (new domain type, new
routing in ChipPopup, composite value semantics, interaction with
contingency tree). The mode-aware approach solves the immediate problem
within the existing KOE archetype with minimal engine disruption. The
pattern hasn't appeared in other archetypes yet — enum, multiSelect,
altCoordinate, and reference domains don't need mode-switching.

Revisit if: We see mode-switching needs in non-KOE domains, or if the
single-expression-mode constraint becomes limiting.

---

## Open Questions

All resolved.

1. **Trigger pill styling.** No — same as regular keyword pills. Revisit
   during screenshot loop if it's confusing.

2. **Multiple expression modes with triggers.** Not now. Design doesn't
   preclude it.

3. **Keywords-only KOE (no expression).** Confirmed: `expression: null` +
   no trigger = keywords only. No expression input in popup. The three
   states form a clean matrix:

   | `expression` | `trigger` | Popup behavior |
   |---|---|---|
   | absent | n/a | Keywords only |
   | present | absent | Always-on expression (keywords + input) |
   | present | present | Trigger-gated (expression hidden until trigger) |

---

## Out of Scope

- **Mode-switching for non-KOE domains** — enum, multiSelect, etc. don't
  need it. If they ever do, the pattern generalizes, but we're not building
  the abstraction layer preemptively.
- **Mode-specific keywords** — keywords that only appear in one mode. The
  popup has `expressionActive` and could filter, but no use case yet.
- **isExpression() helper on domain** — consumers write their own predicates.
- **Animated transitions** between keyword and expression mode. Chips
  swap instantly.
- **Inline stepper on chip trigger** — the stepper lives in the popup,
  not embedded in the chip trigger. The trigger always shows text.
- **Keyboard navigation** — existing tech debt, not gated by mode-switching.
- **Serialization of expressionMode** — the mode can be derived from the
  stored value + domain config during deserialization. No need to persist
  mode state.
