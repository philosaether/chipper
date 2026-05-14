# Assessment: Reference Domain Archetype
Date: 2026-05-14
Branch: main

## Current State

### What the architecture says

Reference is archetype #5 of six. From `chipper-architecture.md`:

- **Value type**: Dynamic — reference ID (string) pointing to external data
- **Value space**: Fetched from external source, not predefined at build time
- **Keywords**: Few or none — options come from async search/navigation
- **Popup**: "Search/navigation UI" — distinct from all other archetype popups
- **Use case**: Priority picker (tree navigation with breadcrumbs), user picker, entity refs

From the domain factories doc (§7): `search: (query: string) => Promise<T[]>`. Async value space. Validate may need async variant. Display shows label from last resolved result.

### What exists today

**Domain infrastructure** — four archetypes implemented, all synchronous. `Domain<T>` has no async affordances except:
- `ChipState.loading?: boolean` and `ChipState.error?: string` — present in the type but never set by any component or action handler
- `SET_LIVE_VALUE` action — defined, stubbed, returns store unchanged
- `LiveSource` interface — defined for live chips (polling/fetch), but this is chip-mode level, not domain level

**Popup components** — all four current popups render from synchronous data. No loading states, no search input, no debounced fetching.

**Praxis priority picker** (`chip_priority_picker.html`): The existing HTMX implementation uses breadcrumb navigation through a tree. User clicks to drill into children, path truncates at 40 chars. Fetches tree data on popup open (lazy). Stores priority ID + display path.

### What Praxis needs

From the v1-feature-scope assessment, one Praxis chip maps to reference:
- `priority_ref` — tree navigation with breadcrumb path, search

The Praxis palette (16 domains) lives in the Praxis repo, not Chipper. `referenceDomain()` provides the factory; Praxis configures it with its priority tree fetcher.

## What's Working

- Domain factory pattern mature across four archetypes — `createDomain<T>` base, `meta` for archetype-specific data, popup routing via `domain.type` switch
- `ChipState` already has `loading` and `error` fields
- Builder, hooks, and component patterns all proven
- Context support (`consumes`, `produces`, `onContextChange`) available on every domain

## Gaps

### 1. No async pattern in the library

This is the fundamental gap. Every existing domain resolves values synchronously — keywords and expression modes are defined at palette creation time. Reference introduces:
- **Fetch on popup open** — lazy loading, not upfront
- **Search with debounce** — user types, results stream in
- **Loading/error UI** — spinner, "no results", "fetch failed"
- **Stale validation** — saved reference ID may point to deleted entity

Design questions:
- Does the factory take a `fetch` function, a URL pattern, or both?
- Is caching the domain's responsibility or the consumer's?
- How does `validate()` work when the value space is remote? Trust caller? Async validate? Cache valid IDs?

### 2. Most complex popup yet

ReferencePopup needs:
- Search input with debounce
- Results list with loading/empty/error states
- Optional breadcrumb navigation for hierarchical data (priority tree)
- Selection that closes popup (like enum, unlike multi-select)

This is substantially more complex than any existing popup (~200-250 lines vs ~40-80 for others).

### 3. Hierarchical vs flat

Priority picker is hierarchical (tree navigation). User picker is flat (search + list). These are different UX patterns. Does reference handle both, or is hierarchical a separate variant?

### 4. SET_LIVE_VALUE handler still stubbed

If the popup fetches data asynchronously, state updates need to flow through the reducer. The existing stub returns store unchanged.

## Engine Dependencies

| Engine Feature | Required? | Notes |
|----------------|-----------|-------|
| TOGGLE_CLAUSE | No | Reference is a chip-level concern, not clause-level |
| SET_CONTEXT | No | Reference can consume context (filter by team), but basic reference works without it |
| SET_LIVE_VALUE | Soft yes | Needed for async state updates (loading, error, fetched options) |
| Contingency | No | Not needed for basic reference |
| Serialization | No | Reference values are just strings — serialize naturally |

**Key finding**: Reference domain has **no hard engine blockers**. It needs SET_LIVE_VALUE (small, focused handler) but not TOGGLE_CLAUSE or SET_CONTEXT.

## External Input

**Architecture doc**: Lists reference as "Dynamic value space from external data. Navigation/search UI."

**Domain factories doc (§7)**: Config adds `search: (query: string) => Promise<T[]>`. Async value space.

**v1-feature-scope assessment**: Reference rated "lower priority for v1" due to complex popup, but it's the only archetype that covers priority_ref — a core Praxis chip.

**Praxis priority picker template**: Working HTMX implementation provides clear UX reference for the hierarchical variant.

## Recommended Next Steps

1. **Design the async source abstraction.** This is the core design question — how does a consumer tell Chipper where to fetch reference data? The factory config needs to handle both flat search (user picker) and hierarchical navigation (priority tree) without over-engineering.

2. **Design the ReferencePopup.** Most complex popup yet. Sketch the search + results + breadcrumb UI. Consider whether hierarchical is a mode or a separate component.

3. **Implement SET_LIVE_VALUE.** Small handler (~40 lines). Unblocks async state updates. Could be done as pre-work before the full reference design.

4. **Build referenceDomain factory + ReferencePopup.** Once design is settled, implementation follows the established factory pattern.

5. **Defer context-sensitive filtering.** "Show users in [selected team]" is powerful but requires SET_CONTEXT. Build basic reference first, add context filtering when the engine supports it.
