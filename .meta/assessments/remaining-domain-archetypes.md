# Assessment: Remaining Domain Archetypes
Date: 2026-05-13
Branch: main

## Current State

Two of six archetypes are implemented:
- **enumDomain** — `src/domains/enum.ts`, tested, popup in `EnumPopup.tsx`
- **keywordOrExpressionDomain** — `src/domains/keyword-or-expression.ts`, tested, popup in `KeywordOrExpressionPopup.tsx`

Both follow the same pattern:
1. Factory function takes config, calls `createDomain<T>()` internally
2. Matching popup component in `src/components/popups/`
3. `ChipPopup.tsx` routes by `domain.type` string
4. Tests in `tests/domains/`

Four archetypes remain: multiSelect, composite, reference, alternativeCoordinate.

## What's Working

The domain factory pattern is clean and extensible. Adding a new archetype means:
1. New factory file in `src/domains/` (config type + factory function)
2. New popup in `src/components/popups/`
3. New `case` in `ChipPopup.tsx` routing switch
4. Re-export from `src/domains/index.ts` and `src/index.ts`
5. Tests in `tests/domains/`

The `createDomain<T>()` base handles all common fields. Each archetype only implements its unique validate/display/config logic.

## Per-Archetype Analysis

### 1. multiSelectDomain — `Domain<string[]>`

**What it is**: Toggle grid of options, optional inline creation. Covers tags, day-set.

**Value type**: `string[]` (array of selected option values)

**Factory work**: Straightforward. Config takes `options` (keyword list), `allowCreate` boolean. Validate checks all values are known options (or any string if allowCreate). Display joins selected labels.

**Popup work**: New UI pattern — toggle buttons (not single-select). Each option is a toggleable pill. If `allowCreate`, add an input row (reuse KOE input pattern). Popup does NOT close on selection (user toggles multiple).

**Dependencies**: None. Self-contained archetype with no engine prerequisites.

**Complexity**: Low-medium. Factory is simple. Popup is new behavior (multi-toggle vs single-select-and-close), but not complicated.

**Estimated scope**: ~100 lines factory, ~80 lines popup, ~80 lines tests.

### 2. compositeDomain — `Domain<Record<string, unknown>>`

**What it is**: Multiple DOF delegated to child chips. Keywords collapse all/some DOF. Covers cadence/interval.

**Value type**: `Record<string, unknown>` (composite of child values)

**Factory work**: Config takes `children` (array of child chip definitions with domain names), `keywords` (shortcuts that set all children at once). Validate checks all children are valid. Display concatenates child displays.

**Popup work**: According to architecture doc (O3), child chips render as **siblings in the clause**, not inside a popup. So the composite domain's popup may just be a keyword list (like enum) for the shortcut keywords, with child chips appearing as separate chip triggers in the clause flow.

**Dependencies**: **This is the hard one.** Composite fundamentally needs:
- **TOGGLE_CLAUSE or dynamic chip visibility** — keywords collapse DOF, meaning child chips appear/disappear based on whether a keyword was selected
- **SET_CONTEXT** — composite children need context from the parent to know their configuration
- The Clause component needs to handle dynamic chip lists (chips that appear/disappear based on composite state)

Without TOGGLE_CLAUSE and SET_CONTEXT implemented, composite can only be partially built — the factory and keyword-selection part works, but the child-chip spawning doesn't.

**Complexity**: High. This archetype is entangled with core engine features that are currently stubbed.

**Estimated scope**: ~150 lines factory, ~60 lines popup (keyword-only), ~120 lines tests, BUT requires implementing TOGGLE_CLAUSE + SET_CONTEXT + clause rendering changes.

### 3. referenceDomain — `Domain<string>` (reference ID)

**What it is**: Async value space with navigation/search popup. Covers priority picker, user picker.

**Value type**: `string` (the selected reference ID)

**Factory work**: Config takes a `source` (async function or URL to fetch options), `search` config, `display` mapping. Validate checks value exists in resolved options. The domain needs to handle async resolution of its value space.

**Popup work**: Entirely new — search input + scrollable results list, possibly with breadcrumb navigation for hierarchical data. Loading/error states. This is the most complex popup by far.

**Dependencies**:
- Needs async data fetching pattern (no existing pattern in chipper)
- Popup needs loading state styling
- May want `useLiveSource` or similar hook (currently not implemented)

**Complexity**: High. Async introduces new patterns (loading states, error handling, caching) that don't exist anywhere in the codebase yet.

**Estimated scope**: ~120 lines factory, ~150 lines popup, ~100 lines tests, plus async infrastructure.

### 4. alternativeCoordinateDomain — `Domain<string>`

**What it is**: Multiple expression modes over the same value space. Covers day (date vs weekday), month (quarter context vs year context). Tabbed popup with different input modes.

**Value type**: `string` (the selected value, regardless of which mode produced it)

**Factory work**: Config takes `modes` array (each with its own keywords + expression). Validate and display already exist on each ExpressionMode. The domain wraps them.

**Popup work**: Tabbed container — one tab per mode, each tab renders its own keyword list and/or input. Tab selection is local popup state.

**Dependencies**:
- The architecture doc mentions this is often **context-sensitive** (e.g., day mode depends on which period is selected). That means `onContextChange` needs to work, which means SET_CONTEXT needs to be implemented.
- However, the basic archetype (tabs with fixed modes) works without context.

**Complexity**: Medium. The factory is straightforward. The popup is a new pattern (tabs) but not inherently difficult.

**Estimated scope**: ~100 lines factory, ~100 lines popup, ~80 lines tests.

## Gaps

1. **Composite and alternativeCoordinate need context propagation** to reach full usefulness. Without SET_CONTEXT, they work but can't respond to sibling chip changes.
2. **Composite needs TOGGLE_CLAUSE** for child chip visibility toggling (keyword collapses DOF → children hide).
3. **Reference needs async infrastructure** — no async patterns exist in the codebase.
4. **No popup styling exists** beyond enum pills and KOE input. Multi-select toggle, tabs, and search results all need new BEM blocks in `_components.scss`.

## Recommended Next Steps — Batching Strategy

**Batch A: Do this morning (one branch, independent, no engine prerequisites)**
- **multiSelectDomain** — fully self-contained, no engine dependencies
- **alternativeCoordinateDomain** — base version with fixed modes (context-sensitivity deferred)

These two are clean leaf features. Each is a factory + popup + tests + ChipPopup routing. They follow the exact pattern established by enum and KOE. No core engine changes needed.

**Defer: separate feature branches**
- **compositeDomain** — needs TOGGLE_CLAUSE + SET_CONTEXT implemented first. Should be its own branch paired with the engine work, since the domain is meaningless without child chip spawning.
- **referenceDomain** — needs async patterns designed first. This is the most complex archetype and introduces patterns (loading states, caching, async data) that should get their own design pass.

**Why this split**: multiSelect and altCoordinate are "more popup types for the same chip model." Composite and reference change the chip model itself — composite adds dynamic clause rendering, reference adds async data fetching. Those are engine-level changes that deserve their own design sessions.
