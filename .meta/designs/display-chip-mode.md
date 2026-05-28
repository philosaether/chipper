---
Status: accepted
Date: 2026-05-28
Accepted: 2026-05-28
Supersedes: chipper-architecture.md §2 "Chip Modes" (readonly/live/computed split)
---

# Display Chip Mode — Desired State

Unify the three non-interactive chip modes (readonly, live, computed) into
a single **display** mode. A display chip shows a value that the user
cannot edit. The value comes from a *source* — static, derived from
sentence state, or fetched externally. The consumer doesn't think in
terms of "readonly vs live vs computed"; they think "this chip shows
data from somewhere."

---

## 1. Unified Mode Type

Replace the three-way `ChipMode` split with:

```typescript
type ChipMode =
  | { type: 'interactive' }
  | { type: 'display'; source: DisplaySource };

type DisplaySource<T = unknown> =
  | { type: 'static'; value: T }
  | { type: 'derived'; compute: (state: SentenceState) => T }
  | { type: 'remote'; url: string; extract: (response: unknown) => T; interval?: number }
  | { type: 'external'; subscribe: (callback: (value: T) => void) => (() => void) };
```

**`static`** — Fixed value. `display: 'Praxis'` disables all chip
interactivity and just shows that string. Primary use case: debugging
and scaffolding. When a consumer is climbing the Chipper learning curve,
`display: {string}` is an escape hatch that skips domain config entirely
and renders exactly what you give it. Also useful for sentences where a
value is contextually fixed (project name, user role, etc.).

**`derived`** — Computed from sentence state. The shopping cart "cost"
chip that recomputes when [item] changes. No explicit dependency list —
recomputes on every state change (memoized by the hook).

**`remote`** — Fetched from a URL. One-shot (no interval) or polling.
`extract` is always a function — no string path form (see Tradeoffs).

**`external`** — Consumer provides a subscribe function that pushes
values. Covers WebSockets, EventSource, RxJS observables, or any
consumer-managed data stream. The subscribe function returns an
unsubscribe cleanup.

### Builder DX

```typescript
// Static — shortest form, debugging escape hatch
.chip('project', 'projectName', { display: 'Praxis' })

// Derived from sentence state
.chip('cost', 'currency', {
  display: (state) => lookupPrice(state.clauses['item']?.chips['item']?.value)
})

// Remote fetch
.chip('weather', 'text', {
  display: { url: '/api/weather', extract: (r: any) => r.temp, interval: 60000 }
})

// External subscription
.chip('price', 'currency', {
  display: { subscribe: (cb) => stockTicker.on('AAPL', cb) }
})
```

The `display` key on `ChipOptions` is sugar that constructs the
appropriate `DisplaySource`:
- Primitive value → `{ type: 'static', value }`
- Function → `{ type: 'derived', compute }`
- Object with `url` → `{ type: 'remote', ... }`
- Object with `subscribe` → `{ type: 'external', ... }`

This replaces the current `mode` key on `ChipOptions`. The `mode` key
is removed — `display` presence means display mode, absence means
interactive.

## 2. Display Formatting

Every display source resolves to a raw value `T`. The chip's domain
handles display formatting via `domain.display(value)`, same as
interactive chips. No separate `format` function on the source — the
domain is already the formatting layer.

Exception: `remote` sources need to transform a JSON response into
a domain-compatible value. That's what `extract` does — it's a *value
extraction* step, not a display formatting step.

## 3. Info Popup (Provenance)

Display chips support an optional **info popup** — a read-only popup
that shows where the value comes from. This reuses the popup positioning
infrastructure but renders informational content instead of input controls.

```typescript
interface DisplayConfig<T = unknown> {
  source: DisplaySource<T>;
  /** Content shown in info popup. Omit for no popup. */
  info?: string | ((value: T, state: SentenceState) => string);
}
```

**Interaction model: click to reveal** (option A). Display chip renders
as a `<button>` with display-mode styling. Click opens the info popup,
click again or outside-click closes it. Keyboard accessible via
Enter/Space.

The visual styling (no border, pastel bg) already distinguishes display
chips from interactive ones. The popup contains only text — no input
fields — which reinforces the "information, not input" affordance. If
user testing reveals confusion, an info icon in the chip trigger is a
low-cost addition.

### Info popup rendering

The info popup reuses `ChipPopup`'s positioning (absolute, caret) but
renders a simple text block instead of domain-specific input UI:

```
┌──────────────────────────┐
│ Time elapsed since       │
│ May 15, 2026             │
└──────────────────────────┘
```

BEM class: `chipper-chip-info` (distinct from `chipper-popup` to avoid
inheriting input-popup styles).

**Stale state**: when a remote/external chip is stale, the info popup
should indicate it — e.g., "Last updated: 2 minutes ago" appended to
the info content.

**Error state**: the info popup shows generic "Source loading error"
text, not the raw error message. Raw errors are for the console.

## 4. Chip State for Display Chips

Display chips use the same `ChipState` shape. Additional fields:

```typescript
interface ChipState<T = unknown> {
  // ... existing fields ...

  /** Whether a remote/external source is currently fetching */
  loading?: boolean;

  /** Error message from source resolution */
  error?: string;

  /** Timestamp of last successful source resolution (remote/external only) */
  lastUpdated?: number;
}
```

`loading` and `error` already exist on `ChipState`. `lastUpdated` is
new — useful for stale-data indicators on polling chips.

## 5. Runtime Machinery

### Static

No runtime machinery. Value set during initialization, never changes.

### Derived

A `useDisplaySource` hook subscribes to sentence state and recomputes:

```typescript
function useDisplaySource(chipDef: ChipDefinition, state: SentenceState, dispatch: Dispatch) {
  const source = chipDef.mode.type === 'display' ? chipDef.mode.source : null;

  useEffect(() => {
    if (source?.type !== 'derived') return;
    const newValue = source.compute(state);
    dispatch({ type: 'SET_DISPLAY_VALUE', chipId: chipDef.id, value: newValue });
  }, [source, state, dispatch, chipDef.id]);
}
```

Memoization: the hook should compare the computed result to the previous
value and skip the dispatch if unchanged, to avoid render loops.

### Remote

Same hook handles fetch + polling:

```typescript
useEffect(() => {
  if (source?.type !== 'remote') return;
  let active = true;

  const fetchValue = async () => {
    dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value: undefined, loading: true });
    try {
      const response = await fetch(source.url);
      const data = await response.json();
      const value = source.extract(data);
      if (active) dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value });
    } catch (e) {
      if (active) dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value: undefined, error: String(e) });
    }
  };

  fetchValue();
  const intervalId = source.interval ? setInterval(fetchValue, source.interval) : undefined;
  return () => { active = false; clearInterval(intervalId); };
}, [source, chipId, dispatch]);
```

### External

```typescript
useEffect(() => {
  if (source?.type !== 'external') return;
  const unsubscribe = source.subscribe((value) => {
    dispatch({ type: 'SET_DISPLAY_VALUE', chipId, value });
  });
  return unsubscribe;
}, [source, chipId, dispatch]);
```

## 6. Reducer Action

Rename `SET_LIVE_VALUE` → `SET_DISPLAY_VALUE`. Same shape, actually
implemented:

```typescript
interface SetDisplayValueAction {
  type: 'SET_DISPLAY_VALUE';
  chipId: string;
  value: unknown;
  loading?: boolean;
  error?: string;
}
```

The handler updates `ChipState.value`, recomputes `displayValue` via
`domain.display()`, and sets `loading`/`error`/`lastUpdated`.

## 7. Serialization

**Static** display chips are serialized — they hold a real value that's
part of the sentence's meaning. This also supports the debugging use
case: a consumer using `display: {string}` to scaffold a sentence can
verify their ViewModel methods against serialized output.

**Derived, remote, and external** display chips are excluded from
serialization — their values are ephemeral (derived from state or
fetched from external sources, not user decisions).

`deserialize()` skips non-static display chips. `serialize()` includes
static display chip values alongside interactive chip values.

## 8. Visual States

| State | Appearance |
|-------|-----------|
| Normal | Pastel bg, no border, full opacity (current readonly style) |
| Loading | Subtle pulse animation on bg color |
| Error | `--chipper-error` border, error icon or text |
| Stale | Slightly dimmed bg (data older than 2× interval) |
| Info open | Accent glow (matches interactive expanded state) |

Stale and error states are also reflected in the info popup content
(see §3).

---

## Tradeoffs

### Unified mode vs three separate modes

**Chosen**: unified `display` mode with source discriminated union.
**Rejected**: keeping `readonly` / `live` / `computed` as separate modes.
**Why**: the consumer doesn't care about the source mechanism — they want
"this chip shows data." The rendering, styling, info popup, and
serialization behavior are identical across all sources. Separate modes
would mean triplicated rendering logic for no user-facing benefit.
**Revisit if**: a source type needs fundamentally different rendering
(unlikely — all display chips are "value in a chip trigger").

### `display` key vs `mode` key on ChipOptions

**Chosen**: `display` as a top-level key that replaces `mode`.
**Rejected**: keeping `mode: { type: 'display', source: ... }`.
**Why**: the builder sugar `display: 'Praxis'` or `display: (state) => ...`
is much more ergonomic than
`mode: { type: 'display', source: { type: 'static', value: 'Praxis' } }`.
The `mode` key was already awkward — it's a concept that only matters
internally.
**Revisit if**: we need `mode` for something else on ChipOptions.

### `display` key vs `.computed()` builder method

**Chosen**: `display` as an option on `.chip()`.
**Rejected**: separate `.computed('id', 'domain', { display: fn })` method.
**Why**: `.chip()` is the primitive — display is a property of the chip,
not a different kind of segment. A second builder method creates an
inconsistency (chip = input, computed = display) for no functional benefit.
The `display` option naturally extends the existing `.chip()` API.

### Derived dependencies: explicit vs recompute-on-every-change

**Chosen**: recompute on every state change, memoize result.
**Rejected**: explicit `dependencies: string[]` array (the old
`ComputedSource` approach).
**Why**: dependency arrays are error-prone and add DX friction.
Sentence state is small (typically <20 chips). Computing a derived
value on every state change and comparing the result is cheap.
**Revisit if**: sentences with many display chips show performance issues
from excessive recomputation.

### Remote extract: function-only vs string paths

**Chosen**: `extract` is always a function `(response: unknown) => T`.
**Rejected**: string dot-path (`'data.temperature'`) and JSONPath
(`'$.store.book[0].author'`).
**Why**: The function form is already concise (`(r) => r.data.temp`),
is TypeScript-checkable, handles every edge case (array access,
fallbacks, transforms), and requires zero library dependencies. A
dot-path saves ~10 characters but adds a code path to maintain and
document. JSONPath is a full query language (~5-15KB dependency) with
competing spec interpretations — overkill for "pull one value from a
JSON response."
**Revisit if**: consumers frequently complain that the function form is
too verbose (unlikely given the one-liner pattern).

### Info popup: click vs hover vs hybrid

**Chosen**: click to reveal (option A).
**Why**: simplest to implement correctly across devices and assistive
tech. Button element gives keyboard accessibility for free. Visual
styling distinguishes display chips from interactive ones.
**Revisit if**: user testing shows click-to-reveal causes confusion
("can I edit this?"). Fallback: hover tooltip with `aria-describedby`.

## Open Questions

None — all resolved during iteration.

## Out of Scope

- **Bidirectional display chips** — display chips that can *also* accept
  input in some cases. If needed, that's a new mode, not a display variant.
- **Display chip domain factories** — no `displayDomain()` factory.
  Display chips use existing domains for formatting; the mode controls
  sourcing, not value space.
- **Stale-data UI beyond dimming** — refresh buttons, "last updated" text
  in the chip trigger, etc. Can be added later if consumers need it.
  (Info popup does show staleness context.)
- **JSONPath / dot-path extract** — function-only for v1. String
  convenience could be added later without breaking changes.
