# Assessment: Keyboard Navigation
Date: 2026-05-24
Branch: main

## Current State

### What exists today

**ChipPopup.tsx** (popup container):
- Escape-to-close via document-level `keydown` listener
- Outside-click via `mousedown` + `setTimeout(0)` pattern
- `role="listbox"` on popup container
- No focus trap, no focus restoration, no aria-label on listbox

**Chip.tsx** (trigger button):
- `<button type="button">` — native Enter/Space activation
- `aria-expanded={showPopup}` — correctly reflects open state
- `aria-haspopup="listbox"` — indicates popup type
- No focus restoration on popup close
- No `aria-controls` linking trigger to popup

**KeywordOrExpressionPopup.tsx**:
- Enter submits text expression (onKeyDown on input)
- `autoFocus` on input when no keywords
- `role="option"` + `aria-selected` on keyword buttons
- No arrow key navigation between options

**MultiSelectPopup.tsx**:
- `role="option"` + `aria-selected` on all toggle buttons
- No keyboard handlers at all (click only)

**AlternativeCoordinatePopup.tsx**:
- Enter submits expression (onKeyDown on input)
- `role="tablist"` / `role="tab"` / `aria-selected` on mode tabs
- `role="option"` + `aria-selected` on slot keywords
- No arrow key navigation (tabs or options)

**ReferencePopup.tsx**:
- `role="option"` + `aria-selected` on keywords
- Missing aria-labels on non-text buttons (breadcrumb "all", drill "▸")
- No keyboard handlers

**Clause.tsx** (toggle buttons ↳ / ×):
- `<button type="button">` — native Enter/Space activation
- No aria-label (screen readers read literal "↳" / "×")
- No `:focus-visible` CSS styling

**NumericInput** (stepper − value +):
- Enter submits on input
- Buttons have native keyboard activation

### Existing tests

- Escape-to-close: tested in `components.test.tsx`
- Enter-to-submit: tested in `koe-popup.test.tsx`
- No tests for arrow keys, tab trapping, focus restoration

### CSS focus infrastructure

- `--chipper-focus-ring` token exists (box-shadow pattern)
- Applied to chip triggers and inputs
- NOT applied to clause toggles, popup options, or tab buttons

## What's Working

- Escape closes popup (global listener, works regardless of focus)
- Enter submits expression input (KOE and alt-coordinate)
- Chip triggers are focusable buttons with correct ARIA for popup state
- `role="listbox"` / `role="option"` / `aria-selected` give screen
  readers a semantic model
- Tab order works naturally (buttons are focusable in DOM order)

## Gaps

### Critical (AA compliance)

1. **No roving tabindex / arrow key navigation** — WCAG 2.1 SC 2.1.1
   requires all functionality be operable via keyboard. Currently:
   options in all popup types require mouse click or Tab+Enter (Tab
   through N options is not considered keyboard-operable for listbox).
   The WAI-ARIA listbox pattern requires arrow key navigation.

2. **No focus trap** — when popup is open, Tab can escape to page
   content. WAI-ARIA combobox/listbox pattern requires focus to remain
   within the popup while open.

3. **No focus restoration** — when popup closes (via Escape or
   selection), focus goes nowhere rather than returning to the trigger
   button.

4. **Missing aria-labels** — clause toggles read as "↳" / "×" to
   screen readers. ReferencePopup drill button reads as "▸". Breadcrumb
   root has no label.

### Important (good practice, not strictly AA)

5. **No focus-visible styling** on popup options, tabs, clause toggles.
   Users who rely on keyboard can't see which element is focused.

6. **No Home/End shortcuts** in option lists.

7. **No type-ahead** in keyword lists (pressing "m" to jump to "month").

8. **Escape is global** — if two sentences were on the same page, both
   would react to Escape. Should be scoped to the active popup.

## External Input

From roadmap: "roving tabindex, arrow keys, Enter/Escape across all
popup types. AA compliance."

From in-progress tech debt: "Keyboard arrow navigation in popups
(roving tabindex) — AA compliance."

From architecture doc decision (2026-04-28): "Outside-click via mousedown
+ setTimeout(0)." This mechanism doesn't conflict with keyboard support.

## Recommended Next Steps

1. **Design session (/draft)** — keyboard navigation pattern touches
   every popup component. Decisions needed:
   - Roving tabindex vs `aria-activedescendant` (former is simpler,
     latter keeps focus on the input in combobox patterns — KOE uses
     both keyword pills and text input)
   - Focus management lifecycle: open → trap → navigate → select → restore
   - Whether popup options should be single-tab-stop (arrow keys between
     them) or sequential tab stops (current behavior but with arrows added)
   - How multi-select (stays open) differs from single-select (closes)
   - NumericInput stepper: does it participate in roving tabindex or stay
     separate?

2. **Shared hook or utility** — `useRovingTabindex(items)` or similar,
   since all popup types need the same arrow key + Home/End + wrap logic.
   Avoid duplicating keyboard event handling across 4+ popup components.

3. **Focus restoration** — quick win, independent of roving tabindex.
   On popup close, `triggerRef.current?.focus()`. Could ship before the
   full keyboard pass.

4. **aria-labels** — another quick win. Add `aria-label="activate clause"`
   / `aria-label="deactivate clause"` to toggles, label drill buttons, etc.

5. **Focus-visible CSS** — extend `--chipper-focus-ring` to all
   interactive elements in popups. Mechanical once the token exists.

Implementation order: (3) + (4) + (5) are quick wins that improve
accessibility immediately. (1) + (2) are the substantive work requiring
a design pass.
