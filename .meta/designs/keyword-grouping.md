---
Status: accepted
Date: 2026-05-27
Accepted: 2026-05-27
Implemented: 2026-05-27 (feature/keyword-grouping)
Divergences: group separator uses dedicated class (chipper-keyword-group__separator) instead of reusing chipper-koe-popup__separator — intentional
Deferred: none
Assessment: assessments/keyword-grouping.md
---

# Keyword Grouping — Desired State

Consumers can visually group keywords within any popup type — separators,
labeled sections, grid layouts — without changing how keywords are selected
or validated. Grouping is a rendering concern that rides on the existing
keyword data model.

---

## Consumer API Pattern Comparison

Four patterns for how consumers specify groups. Each shown with the
dayOfMonth use case (shortcut row + full 1–31 grid).

### Pattern A: Separator Sentinel

Mixed array of keywords and separator markers.

```typescript
const dayOfMonth = keywordDomain({
  color: 'sage',
  keywords: [
    { value: '1', label: '1st' },
    { value: '15', label: '15th' },
    { value: 'last', label: 'last day' },
    '---',  // separator sentinel
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    // ... through 31
  ],
});
```

**Pros**: Minimal API change. Feels like markdown. No nesting.
**Cons**: No group labels. No per-group layout control (can't say "this
group is a grid, that group is flex-wrap"). Duplicate `value: '1'` problem
in dayOfMonth — shortcuts and grid share values. Separator is positional,
not semantic — fragile under `onContextChange` that rebuilds keyword arrays.

### Pattern B: Group Wrapper (chosen)

Keywords array accepts group objects alongside plain keywords.

```typescript
const dayOfMonth = keywordDomain({
  color: 'sage',
  keywords: [
    {
      label: 'shortcuts',
      keywords: [
        { value: '1', label: '1st' },
        { value: '15', label: '15th' },
        { value: 'last', label: 'last day' },
      ],
    },
    {
      label: 'date',
      layout: 'grid',
      columns: 7,
      keywords: Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    },
  ],
});
```

**Pros**: Labels, per-group layout, semantic grouping. Clean nesting.
Groups survive `onContextChange` because they're part of the keyword data.
No value duplication problem — shortcuts group has display-only labels,
grid group has the selectable values (or both can select the same value
and the domain doesn't care).
**Cons**: Deeper nesting in config. `normalizeKeywords` needs to handle
mixed arrays. Type union: `(KeywordConfig<T> | KeywordGroup<T>)[]`.

### Pattern C: Group Key on Keywords

Each keyword gets an optional `group` field. Groups are inferred from
contiguous runs.

```typescript
const dayOfMonth = keywordDomain({
  color: 'sage',
  keywords: [
    { value: '1', label: '1st', group: 'shortcuts' },
    { value: '15', label: '15th', group: 'shortcuts' },
    { value: 'last', label: 'last day', group: 'shortcuts' },
    { value: '1', label: '1', group: 'date' },
    { value: '2', label: '2', group: 'date' },
    // ... through 31
  ],
});
```

**Pros**: Flat array, no nesting. Groups are inline metadata.
**Cons**: No per-group layout control without a separate group config.
Verbose — `group` repeated on every keyword. Contiguous-run inference
is fragile (what if keywords are reordered?). Group labels require
additional config somewhere. Same value duplication issue as pattern A.
Ruled out: we want group-level config (layout, prefix/suffix per group).

### Pattern D: Separate Groups Config

Keywords stay flat. A parallel `groups` config defines structure.

```typescript
const dayOfMonth = keywordDomain({
  color: 'sage',
  keywords: [
    { value: '1', label: '1st' },
    { value: '15', label: '15th' },
    { value: 'last', label: 'last day' },
    // ... 1 through 31
  ],
  groups: [
    { label: 'shortcuts', values: ['1', '15', 'last'] },
    { label: 'date', values: [...range(1, 31).map(String)], layout: 'grid', columns: 7 },
  ],
});
```

**Pros**: Keywords untouched — grouping is purely additive. Layout config
lives on the group, not the keyword.
**Cons**: Values referenced by string — no type safety, easy to drift.
Doesn't compose with `onContextChange` (reconfigured keywords might not
match group value references). Two parallel data structures to maintain.
Ruled out: drift risk and `onContextChange` fragility.

---

## Data Model

### KeywordGroup

New type alongside `KeywordConfig`:

```typescript
/** A named group of keywords rendered as a visual section in the popup. */
interface KeywordGroup<T = string> {
  /** Display label rendered above the keywords (omit for unlabeled group) */
  label?: string;

  /** Keywords in this group */
  keywords: KeywordConfig<T>[];

  /** Layout mode: 'flow' (default flex-wrap) or 'grid' (CSS grid) */
  layout?: 'flow' | 'grid';

  /** Grid column count (required when layout is 'grid') */
  columns?: number;

  /** Text rendered before the keyword pills (e.g., "the") */
  prefix?: string;
}
```

### KeywordGroupItem type union

Domain config `keywords` fields accept the mixed array:

```typescript
type KeywordGroupItem<T> = KeywordConfig<T> | KeywordGroup<T>;
```

**Mixed arrays**: plain `KeywordConfig` items at the top level are
collected into a single implicit group (no label, flow layout) placed
*before* any explicit groups. This means `[kw, kw, group, kw]` produces
**two** groups: one implicit group with all three ungrouped keywords, then
the explicit group. If you need ungrouped keywords to appear *after* an
explicit group, wrap them in a group.

This keeps the common case simple (a few extra keywords don't surprise
you with extra separators) while still being explicit about ordering
when it matters.

### Normalized form

`normalizeKeywords` outputs a new structure for popup consumption:

```typescript
interface NormalizedKeywordGroup<T> {
  label?: string;
  layout: 'flow' | 'grid';
  columns?: number;
  prefix?: string;
  keywords: Keyword<T>[];
}
```

All keyword arrays normalize to `NormalizedKeywordGroup<T>[]` — even a
flat keyword list becomes `[{ layout: 'flow', keywords: [...] }]`.

### Where it lives on Domain<T>

`Domain<T>.keywords` stays as `Keyword<T>[]` (flat, for validation and
display lookup). A new `Domain<T>.keywordGroups` field carries the
grouped structure for popup rendering:

```typescript
interface Domain<T> {
  // ... existing fields ...
  keywords: Keyword<T>[];              // flat — validation, display, keyboard nav
  keywordGroups?: NormalizedKeywordGroup<T>[];  // grouped — popup rendering
}
```

When `keywordGroups` is present, popups render from it. When absent
(backwards compat, simple domains), popups fall back to `keywords`
as a single implicit group.

---

## Rendering

### Popup structure

Each `NormalizedKeywordGroup` renders as:

```html
<div class="chipper-keyword-group">
  <!-- label, if present -->
  <span class="chipper-keyword-group__label">shortcuts</span>
  <!-- prefix, if present -->
  <span class="chipper-keyword-group__prefix">the</span>
  <!-- keywords container, layout varies -->
  <div class="chipper-keyword-group__items
              chipper-keyword-group__items--flow">
    <!-- or chipper-keyword-group__items--grid -->
    <button>...</button>
    <button>...</button>
  </div>
</div>
```

Groups are separated by existing `chipper-koe-popup__separator` styling
(subtle border). First group has no top separator.

### Grid layout

```scss
.chipper-keyword-group__items--grid {
  display: grid;
  grid-template-columns: repeat(var(--chipper-group-columns, 7), 1fr);
  gap: var(--chipper-popup-gap);
}
```

`--chipper-group-columns` set via inline style from `columns` config.
Partial rows (e.g., days 29–31) left-align naturally with CSS grid.

### Flow layout

Same as current flex-wrap behavior. No change.

### dayOfMonth display

For the 1–31 grid: the domain's `display()` function handles chip trigger
text (e.g., "the 15th"). The grid pills show the keyword `label` (just
the number: "1", "2", ... "31"). These are independent — `label` is
popup text, `display`/`displayLabel` is chip trigger text.

The shortcut row keywords ("1st", "15th", "last day") have distinct labels
and can have `displayLabel` for chip trigger text. If shortcuts and grid
share the same `value`, both are valid selections — selecting "15" from the
grid and "15th" from shortcuts produce the same domain value.

---

## Keyboard Navigation

**Flat traversal, visual-only grouping.** Groups are a rendering concern.
Arrow keys walk linearly through all keywords across all groups. No
group-aware skip or boundary behavior.

Rationale: group-aware navigation (Tab to jump between groups) adds
complexity with minimal benefit — most groups are small enough that
linear traversal is fine. The dayOfMonth grid (31 items) is the largest
case, and arrow keys through a grid feel natural.

`useKeyboardNavigation` continues to receive a flat `itemCount`. Popups
flatten `keywordGroups` into the same linear index they use today. No
hook changes needed.

---

## Integration Points

### Domain factories

Each factory that accepts `keywords` grows the type to
`KeywordGroupItem<T>[]`. Affected:

- `keywordOrExpressionDomain` (and all KOE-backed facades)
- `multiSelectDomain` — both `options` and `keywords` accept groups
- `alternativeCoordinateDomain` — `ModeSlot.keywords` accepts groups

### normalizeKeywords

The existing function normalizes `KeywordConfig<T>[]` → `Keyword<T>[]`.
New companion:

```typescript
function normalizeKeywordGroups<T>(
  items: KeywordGroupItem<T>[],
): { flat: Keyword<T>[]; groups: NormalizedKeywordGroup<T>[] }
```

Returns both flat (for validation/display) and grouped (for rendering).
Domain factories call this instead of `normalizeKeywords` when groups
are present.

### Popup components

All keyword-rendering popups check for `keywordGroups` on the domain.
If present, render grouped. If absent, render flat (current behavior —
zero change for ungrouped domains).

**Shared rendering**: a `KeywordGroupList` component (or render helper)
handles the group → pills mapping. Used by KOE popup, multi-select popup
(for both keywords and options), and alt-coordinate slot rendering. Avoids
duplicating the group/layout/label logic in every popup.

### onContextChange

`onContextChange` can return `Partial<Domain<T>>` including `keywords`.
With this design, it can also return `keywordGroups`. Since groups
contain their keywords, reconfiguration is self-contained — no
cross-referencing needed.

---

## Tradeoffs

### Group wrapper vs separator sentinel
Chose group wrapper (pattern B) over separator sentinel (pattern A).
Separator sentinel is simpler for the "just put a line here" case, but
can't support labels or per-group layout. The dayOfMonth grid is the
driving use case, and it needs layout control. Would revisit if we found
that most consumers only want separators — but even then, a group with
no label and no layout config effectively *is* a separator.

### keywordGroups as separate field vs replacing keywords
Chose dual fields (`keywords` flat + `keywordGroups` structured) over
replacing `keywords` with a grouped-only structure. The flat array is
used by validation, display lookup, and keyboard navigation — all of
which need linear access. Duplicating data is a small cost for keeping
these concerns clean. Would revisit if the duplication caused bugs
(normalizeKeywordGroups produces both from the same source, so they
can't drift).

### Flat keyboard nav vs group-aware nav
Chose flat traversal. Group-aware navigation (Tab between groups, arrows
within) is more discoverable in large grids but adds hook complexity
and a new interaction pattern to learn. Flat arrows through a 7-column
grid work well — left/right moves within a row, wrapping at edges.
Would revisit if usability testing showed users struggling with large
grids.

### Ungrouped keyword collection
Chose "collect all ungrouped keywords into one implicit group at the top"
over "each run of ungrouped keywords becomes its own group." The latter
would make `[kw, kw, group, kw]` produce three groups, which is
surprising. The former keeps the simple case predictable: stray keywords
go in one bucket. If you need positional control, wrap them explicitly.

---

## Open Questions

None — all resolved.

---

## Out of Scope

- **Nested groups** (groups within groups) — no use case.
- **Collapsible groups** — accordion-style show/hide. Future enhancement if
  popups get too tall.
- **Group-aware keyboard navigation** — flat traversal for now.
- **Reference popup grouping** — reference domains use tree navigation, not
  keyword lists.
- **`displayLabel` → `display` rename** — deferred to tech debt sweep riff.
- **KOE slots** — generalize alt-coordinate slots to KOE. Deferred
  post-release.
