---
Status: accepted
Date: 2026-05-13
Accepted: 2026-05-13
Assessment: assessments/remaining-domain-archetypes.md
---

# multiSelectDomain & alternativeCoordinateDomain — Desired State

Two new domain archetypes following the established factory + popup pattern.
multiSelect covers toggle-grid value spaces (tags, day-sets).
alternativeCoordinate covers tabbed expression modes over a shared value
space (day-as-date vs day-as-weekday, calendar systems). Both are leaf
features — no engine changes, no new action types.

---

## 1. multiSelectDomain

### Value Model

`Domain<string[]>` — an ordered array of selected option values. This is
the first non-string domain type, which validates that the `Domain<T>`
generic works end-to-end through the reducer, hooks, and components.

### Factory Config

```typescript
interface MultiSelectDomainConfig {
  color: string;

  /** Available options (rendered as toggle pills) */
  options: Keyword<string>[];

  /** Keywords that act as group shortcuts (e.g., "weekdays" → Mon-Fri) */
  keywords?: Keyword<string[]>[];

  /** Max selections (omit for unlimited) */
  maxSelections?: number;

  /** Default value — empty array if omitted */
  defaultValue?: string[];

  /** Text shown when no options are selected */
  placeholder?: string;

  // Standard pass-throughs
  consumes?: string[];
  produces?: string[];
  onContextChange?: (context: SentenceContext) => Partial<Domain<string[]>>;
}
```

### Derived Behavior

- **`validate`**: Every element must be in `options`. Empty array is
  invalid (forces user interaction). Respects `maxSelections` if set.
- **`display`**: Joins selected labels with ", ". Shows count suffix
  if more than 3 selected: "Mon, Wed, Fri" vs "5 days".
- **`type`**: `'multi-select'`

### Display Threshold

The "3 then count" rule: display up to 3 labels comma-joined, switch to
`"{n} selected"` at 4+. This keeps chip triggers compact. The threshold
is hardcoded, not configurable — it's a UX constant, not a volatile
parameter.

Why 3: one is obvious, two is readable, three is comfortable, four starts
wrapping. This matches common multi-select UX (email CC fields, tag pickers).

### Group Keywords

Keywords on a multi-select domain are **group shortcuts** — they set
multiple options at once. Example:

```typescript
const daySet = multiSelectDomain({
  color: 'sage',
  options: [
    { label: 'Mon', value: 'mon' },
    { label: 'Tue', value: 'tue' },
    // ...all 7 days
  ],
  keywords: [
    { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
    { label: 'weekend', value: ['sat', 'sun'] },
    { label: 'every day', value: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  ],
  placeholder: 'which days',
});
```

Keywords appear above the toggle grid in the popup (same layout position as
KOE keywords). Selecting a keyword replaces the current selection entirely.

### MultiSelectPopup

```
┌─────────────────────────────┐
│ ╭─weekdays─╮ ╭─weekend─╮   │  ← group keywords (if any)
│ ╰──────────╯ ╰─────────╯   │
│─────────────────────────────│
│ ◉ Mon  ◉ Tue  ○ Wed        │  ← toggle grid (filled = selected)
│ ○ Thu  ◉ Fri  ○ Sat        │
│ ○ Sun                       │
└─────────────────────────────┘
```

**Behavior differences from enum/KOE popups:**
- Popup does **not** close on selection — user toggles freely
- Options are toggle buttons, not single-select pills
- User closes popup themselves (click outside, Escape, or click trigger)

**BEM classes:**
- `.chipper-multi-select-popup` — container
- `.chipper-multi-select-popup__keywords` — group keyword row
- `.chipper-multi-select-popup__grid` — toggle grid container
- `.chipper-multi-select-popup__option` — individual toggle
- `.chipper-multi-select-popup__option--selected` — active toggle

**Toggle styling**: Selected options use the same inverted color scheme
as enum popup selected options (pastel-on-dark). Unselected options use
the normal style (dark-on-pastel). This reuses the existing
`--chip-trigger-color-*` variable bridge.

---

## 2. alternativeCoordinateDomain

### Value Model

`Domain<string>` — the selected value, regardless of which mode produced
it. All modes share the same value type. The mode is how the user
specifies the value, not what the value is.

### The Multi-DOF Problem

Different modes can have different degrees of freedom. In the Praxis
day-of-month chip:

- **Date mode** (1 DOF): pick a day number → value is `"15"`
- **Weekday mode** (2 DOF): pick ordinal × pick weekday → value is
  `"first wednesday"`

A mode needs to express "I have N independent selection dimensions that
compose into one value." This is the **slots** model.

### Factory Config

```typescript
interface AlternativeCoordinateDomainConfig {
  color: string;

  /** Available coordinate modes — one tab per mode */
  modes: AlternativeCoordinateMode[];

  /** Default value — empty string if omitted */
  defaultValue?: string;

  /** Text shown when value is invalid */
  placeholder?: string;

  // Standard pass-throughs
  consumes?: string[];
  produces?: string[];
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

interface AlternativeCoordinateMode {
  /** Unique mode identifier */
  id: string;

  /** Tab label */
  label: string;

  /** Independent selection dimensions within this mode */
  slots: ModeSlot[];

  /** Compose slot selections into the domain value */
  compose: (...selections: string[]) => string;

  /** Decompose existing value back into slot selections (for reopening) */
  decompose?: (value: string) => (string | undefined)[];

  /** Validate the composed value (default: all slots filled) */
  validate?: (value: string) => boolean;

  /** Display the composed value (default: compose slot labels) */
  display?: (value: string) => string;

  /** Expression input as alternative to slot selection (omit for slots-only) */
  expression?: ExpressionConfig;
}

interface ModeSlot {
  /** Keywords for this slot */
  keywords: Keyword<string>[];

  /** Prefix text rendered before the keywords (e.g., "the") */
  prefix?: string;
}
```

### Single-Slot vs Multi-Slot Modes

A **single-slot mode** is the simple case — one keyword row, compose is
identity. A **multi-slot mode** renders multiple keyword rows and composes
their selections into one value. The popup renders each slot as its own
keyword group.

Multi-slot modes stay open until all slots are filled, then close
automatically. This is the natural behavior — the value is incomplete
(and invalid) until every slot has a selection.

### Derived Behavior

- **`validate`**: Value passes if it's valid in **any** mode — either
  the mode's custom `validate`, or the default check that `decompose`
  returns all-defined slots.
- **`display`**: Check each mode — try `decompose` + slot label lookup,
  then custom `display`, then fall back to the raw value. First match wins.
- **`type`**: `'alternative-coordinate'`
- **`expressionModes`**: Populated from modes that have an `expression`
  config — each generates an `ExpressionMode<string>`.

### AlternativeCoordinatePopup

```
Date tab:                          Weekday tab:

┌─────────────────────────────┐    ┌─────────────────────────────┐
│ ┌─Date──┐ ╌Weekday╌        │    │ ╌Date╌ ┌──Weekday──┐        │
│─────────────────────────────│    │─────────────────────────────│
│                             │    │                             │
│ the ╭─1st─╮ ╭─15th─╮       │    │ the ╭─first──╮ ╭─second─╮  │
│     ╰─────╯ ╰──────╯       │    │     ╰────────╯ ╰────────╯  │
│     ╭─last day─╮           │    │     ╭─third─╮ ╭─fourth─╮   │
│     ╰──────────╯           │    │     ╰───────╯ ╰────────╯   │
│                             │    │     ╭─last─╮              │
│ [ or type 1-31... ]        │    │     ╰──────╯              │
│                             │    │                             │
└─────────────────────────────┘    │ ╭─Mon─╮ ╭─Tue─╮ ╭─Wed─╮   │
                                   │ ╰─────╯ ╰─────╯ ╰─────╯   │
                                   │ ╭─Thu─╮ ╭─Fri─╮ ╭─Sat─╮   │
                                   │ ╰─────╯ ╰─────╯ ╰─────╯   │
                                   │ ╭─Sun─╮                    │
                                   │ ╰─────╯                    │
                                   └─────────────────────────────┘
```

**Tab state**: Local popup state (useState). When the popup opens, the
active tab defaults to the mode whose `decompose` succeeds on the
current value, or the first mode if no match.

**Close behavior**: Single-slot modes close on keyword select (like enum).
Multi-slot modes stay open until all slots are filled, then close.
Expression submission always closes. Switching tabs never closes.

**Slot selection state**: The popup tracks per-slot selections as local
state. When all slots have values, `compose()` produces the final value,
`onSelect` fires, and the popup closes.

**BEM classes:**
- `.chipper-alt-coord-popup` — container
- `.chipper-alt-coord-popup__tabs` — tab bar
- `.chipper-alt-coord-popup__tab` — individual tab
- `.chipper-alt-coord-popup__tab--active` — active tab
- `.chipper-alt-coord-popup__content` — active mode's content area
- `.chipper-alt-coord-popup__slot` — one slot's keyword group
- `.chipper-alt-coord-popup__slot-prefix` — prefix text (e.g., "the")

**Content reuse**: Keyword pills within slots use the existing
`.chipper-popup-option` class (shared with enum and KOE). Expression
input rows reuse the KOE input pattern.

### Usage Example

```typescript
const calendarDay = alternativeCoordinateDomain({
  color: 'sage',
  modes: [
    {
      id: 'date',
      label: 'Date',
      slots: [
        { prefix: 'the', keywords: [
          { label: '1st', value: '1' },
          { label: '15th', value: '15' },
          { label: 'last day', value: 'last' },
        ]},
      ],
      compose: (day) => day,
      decompose: (v) => [v],
      expression: {
        placeholder: 'day of month (1-31)',
        validate: (v) => /^([1-9]|[12]\d|3[01])$/.test(v),
      },
    },
    {
      id: 'weekday',
      label: 'Weekday',
      slots: [
        { prefix: 'the', keywords: [
          { label: 'first', value: 'first' },
          { label: 'second', value: 'second' },
          { label: 'third', value: 'third' },
          { label: 'fourth', value: 'fourth' },
          { label: 'last', value: 'last' },
        ]},
        { keywords: [
          { label: 'Mon', value: 'monday' },
          { label: 'Tue', value: 'tuesday' },
          { label: 'Wed', value: 'wednesday' },
          { label: 'Thu', value: 'thursday' },
          { label: 'Fri', value: 'friday' },
          { label: 'Sat', value: 'saturday' },
          { label: 'Sun', value: 'sunday' },
        ]},
      ],
      compose: (ordinal, day) => `${ordinal} ${day}`,
      decompose: (v) => {
        const parts = v.split(' ');
        return parts.length === 2 ? parts : [undefined, undefined];
      },
      display: (v) => {
        const [ord, day] = v.split(' ');
        return `${ord} ${day.charAt(0).toUpperCase() + day.slice(1, 3)}`;
      },
    },
  ],
  placeholder: 'which day',
});
```

---

## 3. Implementation Plan

All changes follow the established pattern from enum and KOE. The slots
model is new but contained entirely within the alt-coordinate factory
and popup.

### Files to create

| File | Contents |
|------|----------|
| `src/domains/multi-select.ts` | `multiSelectDomain()` + `MultiSelectDomainConfig` |
| `src/domains/alternative-coordinate.ts` | `alternativeCoordinateDomain()` + config types |
| `src/components/popups/MultiSelectPopup.tsx` | Toggle grid popup |
| `src/components/popups/AlternativeCoordinatePopup.tsx` | Tabbed popup with slot rendering |
| `tests/domains/multi-select.test.ts` | Factory tests |
| `tests/domains/alternative-coordinate.test.ts` | Factory tests |
| `tests/components/multi-select-popup.test.tsx` | Popup interaction tests |
| `tests/components/alt-coordinate-popup.test.tsx` | Popup interaction tests |

### Files to modify

| File | Change |
|------|--------|
| `src/domains/index.ts` | Re-export new factories |
| `src/index.ts` | Re-export new factories |
| `src/components/ChipPopup.tsx` | Add routing cases for `'multi-select'` and `'alternative-coordinate'` |
| `src/styles/_components.scss` | BEM rules for new popup types |

### Demo

Update the demo sentence in `demo/src/App.tsx` to include one chip
of each new type, so we can visually verify the popups work with the
theming engine.

---

## Tradeoffs

### Multi-select: close-on-select vs stay-open

Enum and KOE popups close after selection. Multi-select stays open.
This is the right call — closing after each toggle would be maddening
for multi-select ("select Mon" → reopen → "select Wed" → reopen...).
The popup needs a different close model: outside-click, Escape, or
trigger re-click. The existing ChipPopup already handles all three —
no change needed in the close machinery, just don't call `onClose()`
in the toggle handler.

### Alt-coordinate: tabs vs flat list

Could render all modes' keywords in a single flat list with mode headers.
Tabs are better because modes can have expression inputs, and a flat list
with interleaved inputs gets visually noisy. Tabs give each mode a clean
isolated space.

### Alt-coordinate: store active mode in chip state vs local popup state

The active tab could be persisted in chip state so reopening remembers
which mode the user was in. Going with local popup state instead — the
popup opens to whichever mode matches the current value, which is the
right default. Persisting mode selection adds complexity to ChipState for
minimal UX gain. Either path gives the same experience, so simpler wins.

### Multi-select: display threshold (3 labels → count)

Considered making this configurable. Decided against it — it's a UX
constant that keeps chip triggers from wrapping across lines. If a
consumer needs a different display, they can override `display` on the
domain config. "On [Monday, Tuesday, Wednesday, Friday, Saturday]" is
hardly more informative than "On [5 days]".

### Alt-coordinate: flat keywords vs slots model

Could require each mode to be a flat keyword list (1 DOF). But real
use cases like "first wednesday" need multi-DOF modes. The slots model
handles both: single-slot modes are the simple case (compose is identity),
multi-slot modes compose N selections. The alternative — making the
weekday mode a special case with custom rendering — defeats the purpose
of having a general archetype.

## Open Questions

None — Q1 (option ordering) resolved as array order, Q2 (allowCreate)
deferred to a future branch.

## Out of Scope

- **allowCreate for multi-select** — deferred. Entangled with backend
  persistence (tag creation), dedup across instances, and async patterns
  that don't exist yet. Will revisit alongside referenceDomain / async
  infrastructure.
- **Context-dependent mode switching** for alternativeCoordinate (needs
  SET_CONTEXT — deferred to that feature branch)
- **Composite domain** (needs TOGGLE_CLAUSE + SET_CONTEXT)
- **Reference domain** (needs async infrastructure)
- **Keyboard navigation** within popups (separate feature)
- **New SCSS for popup styling** beyond what's needed for functional
  correctness — visual polish is a theming concern, we just need the
  BEM structure and token references
