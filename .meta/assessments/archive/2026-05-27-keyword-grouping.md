# Assessment: Keyword Grouping Across Popup Types
Date: 2026-05-27
Branch: feature/keyword-grouping

## Current State

Keywords are flat arrays everywhere. The `Keyword<T>` interface (`core/types.ts:16`) has label, displayLabel, value, and partial — no grouping metadata. `KeywordConfig<T>` (`normalize-keywords.ts:16`) is the consumer-facing shorthand: value, label, display, partial. No group field on either.

Four popup types render keywords:

1. **KeywordOrExpressionPopup** — renders `keywords` as a flat flex-wrap list in `.chipper-koe-popup__keywords`. No structural divisions. Used by all KOE-backed domains (keywordDomain, textDomain, numberDomain, dateDomain, keywordOrExpressionDomain directly).

2. **MultiSelectPopup** — has a two-tier structure already: group keywords (`.chipper-multi-select-popup__keywords`) rendered above individual options (`.chipper-multi-select-popup__grid`). But within each tier, keywords are flat.

3. **AlternativeCoordinatePopup** — has multi-slot structure (`.chipper-alt-coord-popup__slot`), where each slot has its own keyword list. Slots are already visually separated. But within a single slot, keywords are flat.
- NB: The defining feature of the AltCoordDom is the tab between modes, not the slots
    - In principle, slots could be used in any keyword-accepting domain with > 1 degree of freedom

4. **ReferencePopup** — tree navigation, not keyword-list-based. Out of scope for this feature.

### Concrete use cases from the demo palette

- **dayOfMonth date mode** — 3 keywords (1st, 15th, last). Roadmap envisions a full 1–28 grid with a "shortcut row" above it. That's grouping.
    - I'd like to extend the grid to 31 (which means a partial row, left-aligned, beneath the full grid)
        - Praxis can handle the edge case, that's out of scope for us
        - How does the display work?
- **monthOfYear** — 12 keywords, all flat. Could benefit from Q1/Q2/Q3/Q4 visual grouping.
- **dueMeasure** — 5 keywords (end of day, tomorrow, end of week, next week, never). "never" is semantically distinct — a separator before it would help.
- **dayOfWeek** (multi-select) — 7 options. Weekdays/weekend grouping visual would complement the existing group keyword shortcuts.
- **cadenceMeasure** — 5 keywords. "weekday"/"weekend day" are a subgroup of the date-range keywords.

### How keywords flow from config to popup

1. Consumer defines `keywords` array in domain config
2. Domain factory calls `normalizeKeywords()` → `Keyword<T>[]`
3. Keywords stored on `Domain<T>.keywords`
4. ChipPopup reads `domain.keywords` and passes to popup component
5. Popup component maps over the array and renders pills

The pipe is flat end-to-end. Grouping needs to enter somewhere in this chain.

## What's Working

- Flex-wrap layout handles variable keyword counts gracefully
- Multi-select already separates group keywords from options (different sections, different purposes)
- Alt-coordinate slots provide visual separation between selection dimensions
- KOE has an `<hr>` separator between keywords and expression input
- Keyboard navigation indexes keywords as a flat list via `useKeyboardNavigation`
- `normalizeKeywords` is the single normalization bottleneck — changes here propagate everywhere

## Gaps

### No grouping model
There's no way to say "these keywords belong together" or "put a separator here." The only structural division in the data model is the keyword/expression split.

### Keyboard navigation assumes flat list
`useKeyboardNavigation` takes `itemCount` and navigates linearly. Groups might want visual separation without breaking navigation flow, or they might want group-aware navigation (e.g., skip to next group).

### No CSS infrastructure for groups
No `.chipper-popup-group` or similar. The only separator styling is the KOE keyword/expression `<hr>`.

### Consumer DX for specifying groups
This is the main design question. Options range from:
- **Separator sentinel** in the keywords array (e.g., `{ separator: true }`)
- **Group wrapper** around keyword subsets (e.g., `{ group: 'shortcuts', keywords: [...] }`)
- **Group key on keywords** (e.g., `{ value: '1', label: '1st', group: 'dates' }`)
- **Separate `groups` config** alongside keywords

Each has different ergonomics for consumers and different rendering implications.
- All strong options -- I'd like to see a detailed comparison
    - I.e., sample implementation for each pattern

### Interaction with domain reconfiguration
`onContextChange` can return new keywords. If grouping is part of the keyword data, it survives reconfiguration naturally. If it's a separate config, reconfiguration might need to update groups too.

## External Input

From roadmap:
> "Needed for day-of-month (shortcut row + full 1–28 grid), likely useful for multi-select and KOE too."

From decisions.md (2026-05-13):
> Multi-select already has group keywords as "shortcuts that set multiple options at once." Keyword grouping is a different concern: visual layout within a single keyword/option list.

## Recommended Next Steps

1. **Design the consumer API** — how do consumers specify groups? This is the core design question. Needs to work across KOE, multi-select options, and alt-coordinate slots.
2. **Design the rendering model** — separators, group labels, grid vs flex-wrap per group, nesting.
3. **Design keyboard navigation within groups** — flat traversal (just visual grouping) vs group-aware traversal.
4. **Build it** — likely touches: `KeywordConfig`, `normalizeKeywords`, all four popup components, CSS.
