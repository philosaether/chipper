---
Status: accepted
Date: 2026-05-24
Accepted: 2026-05-24
Assessment: assessments/keyboard-navigation.md
Implemented: 2026-05-24 (feature/keyboard-navigation)
Divergences: aria-activedescendant on focused element (input or container) per ARIA spec, not always on listbox; Escape scoped to document (standard modal pattern); Tab in AltCoordinate uses standard focus trap instead of tab/slot routing
Deferred: Backspace breadcrumb nav in Reference
---

# Keyboard Navigation — Desired State

All chipper popup types support full keyboard operation: arrow keys
navigate options, Enter selects, Escape closes, Tab is trapped within
the popup, and focus returns to the trigger on close. WCAG 2.1 AA
compliant.

---

## Focus Lifecycle

Every popup interaction follows the same five-phase lifecycle. This is
the shared contract — individual popup types implement it via a shared
hook.

```
1. OPEN     — user presses Enter/Space on trigger (or clicks)
2. TRAP     — focus moves into popup, Tab cycles within it
3. NAVIGATE — arrow keys move active descendant through options
4. SELECT   — Enter confirms active option (or click)
5. RESTORE  — popup closes, focus returns to trigger button
```

### Phase 1: Open

Chip.tsx already handles this via native button behavior. No changes
needed — Enter/Space on `<button>` fires `onClick`.

### Phase 2: Trap

On mount, the popup captures focus. Tab and Shift+Tab cycle within the
popup's focusable elements (options, input, stepper buttons). Focus
cannot escape to the page.

Implementation: `ChipPopup.tsx` adds a `keydown` handler for Tab that
wraps focus between first and last focusable elements in `popupRef`.

### Phase 3: Navigate

Arrow keys move a visual highlight through the popup's options. The
active option is tracked as an index, not via DOM focus — this is the
`aria-activedescendant` pattern (see Tradeoffs).

- **ArrowDown / ArrowRight**: next option (wraps to first)
- **ArrowUp / ArrowLeft**: previous option (wraps to last)
- **Home**: first option
- **End**: last option

Each popup type defines its own "option list" — the hook just manages
the index.

### Phase 4: Select

Enter on the active option triggers selection. For single-select popups
(KOE, alt-coordinate, reference), this also closes the popup. For
multi-select, Enter toggles the option and the popup stays open.

### Phase 5: Restore

On close (Escape, selection, or outside click), focus returns to the
trigger button. The trigger's `anchorElement` is already stored in
`PopupState` — call `anchorElement.focus()` in the close handler.

## Shared Hook: `useKeyboardNavigation`

```typescript
interface KeyboardNavigationOptions {
  /** Total number of navigable options */
  itemCount: number;
  /** Called when the user presses Enter on the active item */
  onSelect: (index: number) => void;
  /** Called when the user presses Escape */
  onClose: () => void;
  /** Initial active index (-1 = nothing active) */
  initialIndex?: number;
  /** Does selecting an item close the popup? (default true) */
  closeOnSelect?: boolean;
}

interface KeyboardNavigationResult {
  /** Currently highlighted option index (-1 = none) */
  activeIndex: number;
  /** Set active index imperatively (e.g., on mouse hover) */
  setActiveIndex: (index: number) => void;
  /** Attach to the popup container's onKeyDown */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Generate props for each option element */
  getOptionProps: (index: number) => {
    id: string;
    role: 'option';
    'aria-selected': boolean;
    onMouseEnter: () => void;
    onClick: () => void;
  };
}
```

Located at `src/hooks/useKeyboardNavigation.ts`. Each popup type calls
this hook with its item count and select handler. The hook manages:

- Arrow key index tracking (with wrap)
- Home/End shortcuts
- Enter delegation to `onSelect`
- Escape delegation to `onClose`
- Mouse hover sync (hovering an option updates `activeIndex`)
- Unique IDs for `aria-activedescendant`

The hook does NOT manage:
- Focus trapping (that's ChipPopup's job)
- DOM focus (uses `aria-activedescendant`, not `tabIndex` roving)
- Layout (options may be in a grid, list, or tabs — not the hook's concern)

## Changes by Component

### ChipPopup.tsx

- Add focus trap: Tab/Shift+Tab wraps within `popupRef`
- Add `aria-activedescendant={activeOptionId}` to the `role="listbox"`
  container (passed down from the popup type)
- Add `aria-label` to the listbox (domain placeholder or chip ID)
- Scope Escape handler to the popup element instead of document

### Chip.tsx

- On close, call `popupState.anchorElement?.focus()` to restore focus
- Add `aria-controls={popupId}` when popup is open (links trigger to
  popup)

### KeywordOrExpressionPopup.tsx

Call `useKeyboardNavigation` with keyword count. Map `getOptionProps`
onto keyword buttons.

**Combobox pattern**: When the expression input is visible, the popup
acts as a combobox — the input holds DOM focus while
`aria-activedescendant` tracks the highlighted keyword. Arrow keys
navigate keywords without leaving the input. Enter either submits the
input value or selects the highlighted keyword (keyword takes priority
when highlighted).

When no expression input is visible (keywords-only), the popup container
itself receives focus and manages `aria-activedescendant`.

Trigger pill participates in the option list (appended after keywords).

### MultiSelectPopup.tsx

Call `useKeyboardNavigation` with `closeOnSelect: false`. Enter toggles
the active option. Space also toggles (matches toggle button convention).

Grid layout: ArrowRight/ArrowLeft for horizontal movement,
ArrowDown/ArrowUp to wrap rows. The hook's wrapping handles this
naturally for a flat list; grid-aware navigation (jump by row width)
is deferred — flat wrap is AA-compliant.

### AlternativeCoordinatePopup.tsx

Two navigation contexts:

1. **Mode tabs**: Left/Right arrows switch tabs (already has
   `role="tablist"` / `role="tab"`). Each tab panel is a separate
   option list.
2. **Slot keywords**: Within the active tab, arrow keys navigate
   keywords via `useKeyboardNavigation`.

Tab key moves between mode tabs and slot keywords. The hook manages
slot keywords; tab switching is a separate `onKeyDown` handler on the
tablist.

### ReferencePopup.tsx

Arrow keys navigate the visible item list. Enter on a folder drills
down. Backspace on the breadcrumb navigates up. Enter on a leaf selects.

Search input follows the combobox pattern (same as KOE): input holds
DOM focus, `aria-activedescendant` tracks highlighted item.

### Clause.tsx (toggle buttons)

- Add `aria-label="activate clause"` / `aria-label="deactivate clause"`
  to ↳ / × buttons

### NumericInput

Stepper buttons (+/−) already have native keyboard activation. No
changes needed beyond ensuring they participate in the focus trap.

## ARIA Additions

| Element | Add | Value |
|---------|-----|-------|
| ChipPopup container | `aria-label` | domain placeholder or chip display value |
| ChipPopup container | `aria-activedescendant` | ID of highlighted option |
| Chip trigger | `aria-controls` | popup element ID (when open) |
| Clause toggle ↳ | `aria-label` | `"activate clause"` |
| Clause toggle × | `aria-label` | `"deactivate clause"` |
| ReferencePopup drill ▸ | `aria-label` | `"expand {item label}"` |
| ReferencePopup breadcrumb root | `aria-label` | `"all items"` |

## CSS: Focus-Visible

Extend `--chipper-focus-ring` to all interactive elements that currently
lack it:

```scss
.chipper-popup-option:focus-visible,
.chipper-clause__toggle:focus-visible,
.chipper-alt-popup__tab:focus-visible {
  box-shadow: var(--chipper-focus-ring);
  outline: none;
}
```

Active-descendant highlight (the option tracked by arrow keys, not DOM
focus):

```scss
.chipper-popup-option--active {
  background: var(--chipper-bg-tertiary);
  // Same as hover state — keyboard and mouse highlight should look identical
}
```

## Tradeoffs

**`aria-activedescendant` vs roving tabindex**

Roving tabindex moves DOM focus between options (`tabIndex={0}` on active,
`tabIndex={-1}` on rest). `aria-activedescendant` keeps DOM focus on a
container or input and uses an attribute to declare which option is
logically active.

Chosen: `aria-activedescendant`. Reasons:
- KOE popups have an input field + keyword pills. With roving tabindex,
  moving to a keyword would blur the input, losing cursor position and
  typed text. `aria-activedescendant` lets the user keep typing while
  arrowing through keywords — this is the standard combobox pattern.
- Reference popup has the same input + list structure.
- Multi-select and keywords-only popups don't have inputs, but
  `aria-activedescendant` still works (focus sits on the listbox
  container). Using the same pattern everywhere avoids two code paths.

Revisit if: screen reader testing reveals poor activedescendant support
in a target browser/reader combination.

**Focus trap vs Tab-closes-popup**

Some listbox implementations close the popup when Tab is pressed (like
native `<select>`). Others trap focus (like modal dialogs).

Chosen: focus trap. Reasons:
- Multi-select popups stay open for multiple selections. Tab-to-close
  would be surprising mid-selection.
- Consistent behavior across popup types is less confusing than
  single-select-closes but multi-select-traps.
- Escape is the universal close affordance — Tab doesn't need to double
  as close.

Revisit if: user testing shows Tab-to-close feels more natural for
single-select popups.

**Grid-aware arrow keys for multi-select**

Multi-select renders options in a flex-wrap grid. True grid navigation
(ArrowDown jumps to the option below, not the next in list order)
requires knowing the grid dimensions at render time.

Chosen: flat list wrap for now. ArrowDown goes to the next option
regardless of visual row. This is AA-compliant — grid navigation is a
UX enhancement, not a requirement.

Revisit if: grid popups have more than ~12 options and flat wrap feels
slow.

## Open Questions

1. **Initial focus target**: When a popup opens, should focus go to
   (a) the currently selected option, (b) the first option, or (c) the
   input field (for KOE/reference)? Leaning (a) for keyword-only, (c)
   for combobox patterns.

2. **Type-ahead in keyword lists**: Pressing "m" to jump to "month".
   Nice-to-have but adds complexity (debounced character buffer). Defer
   or include?

## Out of Scope

- Grid-aware arrow key navigation for multi-select (flat wrap is
  AA-compliant)
- Type-ahead search in keyword popups (unless promoted from open
  questions)
- Touch/mobile keyboard patterns
- Multiple simultaneous popups (singleton popup by design)
