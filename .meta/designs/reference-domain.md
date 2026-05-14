---
Status: accepted
Date: 2026-05-14
Accepted: 2026-05-14
Implemented: 2026-05-14 (feature/reference-domain)
Divergences: useReferenceDisplay hook deferred (tech debt); extra BEM classes added for styling
Deferred: eager display resolution on mount (useReferenceDisplay hook)
Assessment: assessments/reference-domain.md
---

# Reference Domain — Desired State

The reference domain is the fifth archetype. It handles chips whose value space comes from external data — entities the consumer's system knows about but Chipper doesn't. The consumer provides a data source; Chipper provides the navigation/search popup and selection mechanics. Value is an opaque string (typically an ID), with a separate display path for human readability.

The primary use case is Praxis's priority picker: a tree of goals/practices/initiatives the user navigates via breadcrumbs. But flat reference lists (user picker, project picker) are equally common and should use the same archetype.

---

## 1. Value Model

`Domain<string>`. The value is an opaque reference ID (string). Chipper never interprets it — it's a key into the consumer's data.

Display is decoupled from value: the consumer provides a `resolveDisplay` function that maps an ID to a human-readable string. This avoids forcing Chipper to understand entity names, hierarchy, or formatting.

```typescript
// What Chipper stores
chipState.value = "01ARZ3NDEKTSV4RRFFQ69G5FAV"  // opaque ID
chipState.displayValue = "… > Side Projects > Praxis"  // from resolveDisplay
```

---

## 2. Data Source Abstraction

The consumer provides a `ReferenceSource` — a small interface that Chipper calls when it needs items. The consumer maps their data shape to `ReferenceItem` once in `getItems`; Chipper handles all navigation, search, and selection from there.

```typescript
/** A single item in the reference data set. */
interface ReferenceItem {
  /** Unique ID — becomes the chip value when selected */
  id: string;

  /** Display label */
  label: string;

  /** Whether this item has children (enables drill-in affordance) */
  hasChildren?: boolean;

  /**
   * Whether this item can be selected. Default true.
   * If false, the item is a navigation-only node (category, folder).
   * Items with hasChildren can be both drillable and selectable.
   */
  selectable?: boolean;
}

/** Data source for a reference domain. */
interface ReferenceSource {
  /**
   * Fetch items at a given path in the hierarchy.
   * - Root level: path is []
   * - One level deep: path is [rootItem]
   * - Flat data: ignore path, return full list
   *
   * Called on popup open and on each drill-in navigation.
   */
  getItems: (path: ReferenceItem[]) => ReferenceItem[] | Promise<ReferenceItem[]>;

  /**
   * Search across the full data set.
   * If omitted, the popup hides the search input.
   */
  search?: (query: string) => ReferenceItem[] | Promise<ReferenceItem[]>;

  /**
   * Resolve an ID to its display string.
   * Called eagerly on chip mount to populate displayValue for saved references.
   * If omitted, the raw ID is shown as the display value.
   */
  resolveDisplay?: (id: string) => string | Promise<string>;
}
```

### Why `ReferenceItem` instead of generic `<I>`

The consumer wraps their navigable data in the `ReferenceItem` interface. Chipper doesn't care if the underlying data is flat or hierarchical — `hasChildren` and `selectable` handle both cases:

- **Flat list** (user picker): all items have `hasChildren: false` (or omitted), all selectable. `getItems` ignores the path argument.
- **Fully selectable tree** (priority picker): every node is both drillable and selectable. User can select an intermediate node or drill in.
- **Category tree** (org chart, social graph): intermediate nodes have `selectable: false` — they're navigation-only folders. Only leaf nodes can be selected.

### Sync and async

`getItems` and `search` accept both sync returns and Promises. Praxis loads the full priority tree upfront (sync), while other consumers may fetch lazily (async). The popup handles both — if it gets a Promise, it shows a loading state. If it gets an array, it renders immediately. No forced async overhead for sync data.

---

## 3. Factory

```typescript
interface ReferenceDomainConfig {
  /** Semantic color key */
  color: string;

  /** Data source — provides items, search, display resolution */
  source: ReferenceSource;

  /**
   * Shortcut keywords. Selected like enum keywords — bypass the popup.
   * Useful for "none" or "any" sentinel values.
   */
  keywords?: Keyword<string>[];

  /** Default value — empty string if omitted (invalid → placeholder) */
  defaultValue?: string;

  /** Text shown when value is invalid */
  placeholder?: string;

  /** Context keys this domain reads */
  consumes?: string[];

  /** Context keys this domain writes */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}
```

The factory:

```typescript
function referenceDomain(config: ReferenceDomainConfig): Domain<string> {
  const keywords = config.keywords ?? [];
  const keywordValues = new Set(keywords.map((k) => k.value));
  const labelByKeyword = new Map(keywords.map((k) => [k.value, k.label]));
  const displayCache = new Map<string, string>();

  return createDomain<string>({
    type: 'reference',
    color: config.color,
    keywords,
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate: (value) => {
      if (value === '') return false;
      // Keywords are always valid. For reference IDs, trust the source —
      // if the consumer selected it through the popup, it's valid.
      // Stale IDs (deleted entities) are a consumer-level concern.
      return true;
    },
    display: (value) => {
      // Keyword label takes priority
      const label = labelByKeyword.get(value);
      if (label !== undefined) return label;
      // Display cache populated by resolveDisplay and popup selection
      return displayCache.get(value) ?? value;
    },
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: { source: config.source, displayCache },
  });
}
```

### Validation: trust the source

Unlike enum (where `validate` checks set membership), reference domains accept any non-empty string. The value space is external — Chipper can't enumerate it. If a saved ID points to a deleted entity, that's the consumer's problem, not Chipper's validation layer. This matches how the enum domain trusts its keyword list — the domain defines what's valid, and anything selected through its popup is valid by construction.

The consumer can override `validate` if they need stricter checking (e.g., cache of known-good IDs).

---

## 4. Popup: ReferencePopup

The most complex popup so far. Three sections: breadcrumb trail (hierarchical only), item list, and search input (optional).

### Layout

```
┌──────────────────────────────┐
│ all > Career > Side Projects │  ← breadcrumb (hierarchical only)
├──────────────────────────────┤
│ ○ Praxis                     │  ← selectable item (click label to select)
│ ○ philbas.com                │
│ ▸ Eidea Exile                │  ← drillable + selectable (click label = select, click ▸ = drill)
│ ▹ Archived                   │  ← drillable, not selectable (click anywhere = drill)
│ ○ Chipper                    │
├──────────────────────────────┤
│ 🔍 Search...                 │  ← search input (if source.search defined)
└──────────────────────────────┘
```

### Item rendering

Each item renders differently based on its `hasChildren` and `selectable` flags:

| `hasChildren` | `selectable` | Rendering |
|---------------|--------------|-----------|
| false/omit | true (default) | Label only. Click selects. |
| true | true (default) | Label + drill button. Click label = select, click `[▸]` = drill in. |
| true | false | Entire row is a drill target. No select affordance. Muted label style. |
| false | false | Inert — rendered but not interactive. (Edge case, defensive.) |

### Behavior

**Navigation:**
- Popup opens → calls `source.getItems([])` (root level)
- User clicks `[▸]` or a non-selectable row → calls `source.getItems([...path, item])` (drill in)
- User clicks breadcrumb segment → truncates path, calls `getItems` for that level
- Keyword shortcuts (if any) render above the item list, same as KOE popup

**Selection:**
- Click a selectable item's label → `onSelect(item.id)`, close popup
- Click a keyword → `onSelect(keyword.value)`, close popup

**Search:**
- User types in search input → debounced call to `source.search(query)` (300ms)
- Results replace the item list (breadcrumb hides during search)
- Clearing search returns to the navigated level
- Click a search result → `onSelect(item.id)`, close popup

**Loading:**
- If `getItems` or `search` returns a Promise, show a loading indicator in the item list area
- If the Promise rejects, show an inline error message with a retry affordance

**Empty state:**
- No items at current level: "No items" text
- No search results: "No results for '{query}'" text

### Component structure

```
ReferencePopup
├── keyword shortcuts (optional, if keywords exist)
├── breadcrumb trail (optional, if path.length > 0)
├── item list (loading | error | items | empty)
└── search input (optional, if source.search defined)
```

One component, ~150-200 lines. Internal state: `path` (navigation stack), `items` (current level), `loading`, `error`, `searchQuery`, `searchResults`.

### Props

```typescript
interface ReferencePopupProps {
  source: ReferenceSource;
  keywords: Keyword<string>[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}
```

---

## 5. Display Resolution

When a chip has a saved reference value (e.g., restored from serialized state), the chip trigger shows the raw ID until `resolveDisplay` provides a human-readable string.

### Flow

1. Chip mounts with `value = "01ARZ3..."`, `displayValue = "01ARZ3..."` (from `domain.display`)
2. Component layer calls `source.resolveDisplay(value)` eagerly on mount (if defined)
3. Result populates the `displayCache` on the domain instance
4. Component dispatches `SET_CHIP_VALUE` with the same value — the reducer re-calls `domain.display`, which now finds the cached label

### Resolved display cache

The factory maintains a mutable cache (a `Map<string, string>`) shared between `display` and `resolveDisplay`. Two writers populate it:

- **`resolveDisplay`** — called on mount for saved reference values
- **Popup selection** — when the user selects an item, the popup writes `item.label` to the cache before calling `onSelect(item.id)`

Once cached, `domain.display(id)` returns the human-readable string on every subsequent call.

```typescript
// Inside referenceDomain factory:
const displayCache = new Map<string, string>();

return createDomain<string>({
  // ...
  display: (value) => {
    const label = labelByKeyword.get(value);
    if (label !== undefined) return label;
    return displayCache.get(value) ?? value;
  },
  meta: { source: config.source, displayCache },
});
```

### When to call resolveDisplay

The component layer (a `useReferenceDisplay` hook called from Chip) calls `resolveDisplay` on mount if:
- The chip has a non-empty value
- The value is not a keyword
- The display cache doesn't already have it

One-time call per chip mount. The cache persists for the domain instance lifetime.

### Breadcrumb truncation

CSS handles truncation — `text-overflow: ellipsis` on the popup breadcrumb, and the chip trigger already truncates long text. No config or hardcoded char limit needed. Consumers can adjust via CSS overrides as with any Chipper style.

---

## 6. Integration Points

### ChipPopup routing

New case in the `domain.type` switch:

```typescript
case 'reference':
  return (
    <ReferencePopup
      source={domain.meta?.source as ReferenceSource}
      keywords={domain.keywords as Keyword<string>[]}
      value={value as string}
      onSelect={onSelect as (value: string) => void}
      onClose={onClose}
    />
  );
```

### Domain index re-export

`src/domains/index.ts` gets `referenceDomain` and `ReferenceDomainConfig` exports.

### Package index

`src/index.ts` re-exports `referenceDomain`, `ReferenceDomainConfig`, `ReferenceSource`, `ReferenceItem`.

### Styles

New BEM blocks:
- `.chipper-reference-popup` — container
- `.chipper-reference-popup__breadcrumb` — breadcrumb trail
- `.chipper-reference-popup__breadcrumb-segment` — clickable breadcrumb segment
- `.chipper-reference-popup__items` — item list container
- `.chipper-reference-popup__item` — single item row
- `.chipper-reference-popup__item--non-selectable` — muted style, entire row drills
- `.chipper-reference-popup__item-label` — clickable label (selects)
- `.chipper-reference-popup__item-drill` — drill-in button (`[▸]`)
- `.chipper-reference-popup__search` — search input
- `.chipper-reference-popup__loading` — loading indicator
- `.chipper-reference-popup__empty` — empty/error state

Structural styles in `_base.scss`, visual styles in `_components.scss`, theme tokens in `_praxis.scss`. Follows the existing pattern — no new tokens needed, reuses `--chipper-popup-*` family.

---

## 7. Demo

Add a reference domain to the demo page. A static tree of musical genres works well — hierarchical, familiar, no backend needed:

```
Music
├── Rock
│   ├── Classic Rock
│   ├── Punk
│   └── Alternative
├── Jazz
│   ├── Bebop
│   ├── Fusion
│   └── Smooth Jazz
├── Electronic          ← selectable: false (category, not a genre)
│   ├── House
│   ├── Techno
│   └── Ambient
└── Classical
    ├── Baroque
    ├── Romantic
    └── Modern
```

"Electronic" is `selectable: false` — you can drill into its subgenres but can't select the category itself. Demonstrates the non-selectable item rendering (muted label, entire row drills, no select affordance) alongside normal selectable nodes.

Sync `getItems`, sync `search` (filter by label substring), sync `resolveDisplay` (walk tree for path). Demonstrates the full popup UX without any async complexity.

Demo sentence: extend the existing alarm clock sentence with a genre chip, e.g., "play [alarm] from [genre]".

---

## 8. File Plan

```
src/domains/reference.ts              — referenceDomain() factory + types
src/components/popups/ReferencePopup.tsx  — popup component
tests/domains/reference.test.ts       — factory tests
tests/components/reference-popup.test.tsx — popup interaction tests (if patterns exist)
```

Plus edits to:
- `src/domains/index.ts` — re-export
- `src/index.ts` — re-export
- `src/components/ChipPopup.tsx` — add routing case
- `src/styles/_components.scss` — popup styles
- `src/styles/_base.scss` — structural layout
- `demo/src/App.tsx` — add genre reference domain to demo

---

## Tradeoffs

### ReferenceItem vs generic `<I>` with extractors

**Considered**: `ReferenceSource<I>` with `toValue: (item: I) => string` and `toLabel: (item: I) => string` extractors. Maximum flexibility — consumer's data shape flows through unchanged.

**Chose**: Concrete `ReferenceItem` with `id`, `label`, `hasChildren`, `selectable`. Simpler API, no generics, consumer maps once in `getItems`. The extractor approach adds type complexity for flexibility nobody would use — every reference data source has an ID and a label.

**Revisit if**: A consumer has a data shape that can't easily map to `ReferenceItem` (e.g., composite keys, multi-label items). Unlikely.

### Validation: trust-all vs cached-set

**Considered**: Maintaining a set of seen IDs from `getItems`/`search` results and validating against it. Would catch stale references.

**Chose**: Trust any non-empty string. The value space is external and potentially huge — Chipper can't be authoritative. Stale reference detection is the consumer's responsibility (they know when entities are deleted). This matches how web forms work — a `<select>` validates against its current `<option>` list, but a reference picker validates against the backend, not the frontend cache.

**Revisit if**: Consumers frequently need stale-reference detection in the UI layer. They can override `validate` today if needed.

### Display cache: mutable Map vs reducer state

**Considered**: Storing resolved display labels in the reducer state (new field on `ChipState`, new action `SET_DISPLAY_LABEL`). Pure, immutable, fits the reducer pattern.

**Chose**: Mutable `Map` on the domain instance. The display cache is a presentation optimization, not application state — it doesn't need undo/redo, serialization, or onChange callbacks. Adding a new action and state field for a cache would be over-engineering. The Map is scoped to the domain instance lifetime, which matches the component tree lifetime.

**Revisit if**: Display labels need to survive serialization/deserialization round-trips. Then they'd need to be part of state, not a cache. But `resolveDisplay` handles this by re-resolving on mount.

### Search: inline vs popup-level

**Considered**: Search as a separate mode (like alternative-coordinate's tabs) — user switches between "browse" and "search" modes.

**Chose**: Search as a persistent input at the bottom of the popup. Results overlay the browse view. Clearing search returns to browse. This matches the Praxis priority picker's mental model and avoids mode confusion. The user can always see where they are in the tree.

**Revisit if**: The popup gets too tall with breadcrumb + items + search all visible. Could collapse to tabbed mode for narrow viewports.

### Tags / async multi-select: reference domain vs multi-select enhancement

**Considered**: Making reference domain polymorphic across popup display modes — tree navigator for hierarchical data, toggle grid for flat collections like tags. Tags draw from a dynamic source (user's existing tags, not known at build time) and support inline creation, which sounds like reference territory.

**Chose**: Tags stay in multi-select's lane. The tag picker UX (toggle grid + "new tag..." input) is identical to the existing MultiSelectPopup — the only difference is where the options come from (async fetch vs static config). Reference domain is for single-select with navigation/search. Conflating them would force the reference popup to be polymorphic across fundamentally different interaction patterns (drill-in tree vs toggle grid) — wrong axis of generalization.

The clean decomposition: multi-select gets `allowCreate` + an optional async source for its options in a future enhancement. Reference stays single-select with navigation. Both involve async data, but the popup UX and value types (`string[]` vs `string`) are completely different.

**Revisit if**: A third popup display pattern emerges that doesn't fit either archetype. Two is a coincidence, three is a pattern.

## Decisions

- **Q1 (display resolution timing)**: Eager — call `resolveDisplay` on chip mount. A chip trigger showing a raw UUID is unacceptable UX, and the call is cheap for sync sources.
- **Q2 (breadcrumb truncation)**: CSS — `text-overflow: ellipsis`. No config or hardcoded char limit. Consumers can adjust via CSS overrides.
- **Q3 (keyboard navigation)**: Follow existing pattern — ship mouse-only, add keyboard nav across all popups in a future WCAG compliance pass.

## Out of Scope

- **Async validation** — `validate` remains synchronous. Stale reference detection is the consumer's concern.
- **Multi-select reference** — selecting multiple references (e.g., multiple assignees). Would be a multi-select enhancement with async source, not a reference domain variant.
- **allowCreate for multi-select** — deferred. The tag picker UX is a multi-select concern. Will revisit when we enhance multi-select with async sources.
- **Context-sensitive filtering** — filtering reference items based on sentence context (`onContextChange` can swap the source, but the popup doesn't auto-refresh when context changes mid-browse). Needs SET_CONTEXT first.
- **Infinite scroll / pagination** — `getItems` returns the full list at a level. If a consumer has thousands of items at one level, they need to handle pagination in their `getItems` implementation.
- **Create new item** — "none of these, create a new priority" flow. Deferred alongside `allowCreate` on multi-select.
