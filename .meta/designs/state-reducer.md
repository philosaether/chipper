---
Status: accepted
Accepted: 2026-04-27
Implemented: 2026-04-27 (feature/demo-page)
Divergences: defensive null checks in SET_CHIP_VALUE handler (not in design, sensible addition)
Deferred: TOGGLE_CLAUSE, SET_CONTEXT, SET_LIVE_VALUE handlers; context propagation
Date: 2026-04-27
Assessment: assessments/vertical-slice.md
---

# State Initializer & Reducer — Desired State

The reducer is the runtime engine for a Chipper sentence. It creates initial state from a sentence definition, and transforms that state in response to user actions. It's a pure function with no React dependency — the hooks (Stage 3) wrap it in `useReducer`.

This design covers what the vertical slice needs: initialization and `SET_CHIP_VALUE`. It also sketches the extension points for `TOGGLE_CLAUSE` and context propagation, without implementing them.

---

## 1. Volatility Decomposition

| Concern | Volatile or Stable | Where it lives |
|---------|-------------------|----------------|
| Action types and their payloads | Stable | `reducer.ts` — the set of actions grows slowly |
| How to initialize chip state from a domain | Stable | `reducer.ts` — same logic for all domains |
| How to update chip state on value change | Stable | `reducer.ts` — validate, display, derive |
| Which domains exist and what they validate | Volatile | Palette (resolved at init time) |
| Which clauses exist and their structure | Volatile | SentenceDefinition (passed at init time) |

The reducer never imports domain factories or palette config. It receives a `SentenceDefinition` (which carries its palette) and works entirely through the `Domain<T>` interface. This keeps it generic — it doesn't know what a "month" or "cadence" is.

---

## 2. Domain Resolution

The `SentenceDefinition` stores domain references as strings (`ChipDefinition.domainName`). The reducer needs the actual `Domain` objects to initialize chip state (calling `validate`, `display`, reading `defaultValue`).

Resolution happens once, at initialization time:

```typescript
function resolveDomain(domainName: string, palette: Palette): Domain {
  const domain = palette.domains[domainName];
  if (!domain) {
    throw new Error(`Domain "${domainName}" not found in palette`);
  }
  return domain;
}
```

This is a hard error, not a fallback. If a sentence references a domain that doesn't exist in its palette, that's a bug in the consumer's configuration — failing loudly is correct.

The resolved domains need to be accessible to the reducer on every action (for `validate` and `display` calls). Two options:

**Option A: Store resolved domains alongside state.** The initializer returns both `SentenceState` and a `ResolvedDomains` map. The reducer receives both.

```typescript
type ResolvedDomains = Record<string, Domain>;  // keyed by chipId

interface SentenceStore {
  state: SentenceState;
  domains: ResolvedDomains;
}
```

**Option B: Resolve on every action.** The reducer receives the `SentenceDefinition` alongside the action and re-resolves domains from the palette each time.

Option A is better. Resolution is O(n) over chips — cheap, but pointless to repeat. And the store concept becomes necessary later anyway, when `onContextChange` produces reconfigured domains that differ from the palette originals. The `domains` map starts as a copy of palette lookups and can diverge at runtime.

---

## 3. Initialization

```typescript
function initializeSentenceState(definition: SentenceDefinition): SentenceStore {
  const domains: ResolvedDomains = {};
  const clauses: Record<string, ClauseState> = {};

  for (const clauseDef of definition.clauses) {
    const chips: Record<string, ChipState> = {};

    for (const chipDef of clauseDef.chips) {
      const domain = resolveDomain(chipDef.domainName, definition.palette);
      domains[chipDef.id] = domain;

      chips[chipDef.id] = {
        value: domain.defaultValue,
        displayValue: domain.validate(domain.defaultValue)
          ? domain.display(domain.defaultValue)
          : domain.placeholder ?? domain.display(domain.defaultValue),
        valid: domain.validate(domain.defaultValue),
        dirty: false,
      };
    }

    clauses[clauseDef.id] = {
      active: clauseDef.necessity === 'required',
      chips,
      valid: Object.values(chips).every((c) => c.valid),
    };
  }

  return {
    state: {
      clauses,
      contexts: [],
      valid: Object.values(clauses).every(
        (c) => !c.active || c.valid,
      ),
    },
    domains,
  };
}
```

### Initialization rules

- Each chip gets `domain.defaultValue` as its initial value.
- `displayValue` uses `placeholder` when the default is invalid, `display` when valid. Same logic the chip component will use — the reducer is the source of truth, not the component.
- Required clauses start active. Optional clauses start dormant.
- **Required-but-latent clauses** (e.g., "starting [on a date]" when count > 1): These have `necessity: 'required'` plus a `contingency.present` function. At initialization, without context, contingent clauses start *not present* — they don't exist in the rendered sentence. When context propagation lands (future), a context change can flip a clause to present, at which point `necessity: 'required'` kicks in and it's automatically active (user can't toggle it off). The initializer doesn't need special logic for this — contingency is a runtime concern handled by the `SET_CONTEXT` action, not by initialization.
- `valid` is derived: a clause is valid when all its chips are valid. The sentence is valid when all *active* clauses are valid. Dormant clauses don't affect sentence validity.
- `contexts` starts empty — no context propagation in the vertical slice.
- `dirty` starts false for all chips.

---

## 4. Actions

### Vertical slice (implement now)

```typescript
interface SetChipValueAction {
  type: 'SET_CHIP_VALUE';
  clauseId: string;
  chipId: string;
  value: unknown;
}
```

### Future actions (type definitions only, not handled yet)

```typescript
interface ToggleClauseAction {
  type: 'TOGGLE_CLAUSE';
  clauseId: string;
}

interface SetContextAction {
  type: 'SET_CONTEXT';
  clauseId: string;
  values: SentenceContext;
}

interface SetLiveValueAction {
  type: 'SET_LIVE_VALUE';
  chipId: string;
  value: unknown;
  error?: string;
}
```

The action union:

```typescript
type SentenceAction =
  | SetChipValueAction
  | ToggleClauseAction
  | SetContextAction
  | SetLiveValueAction;
```

All four types are defined now so the union is stable. Only `SET_CHIP_VALUE` gets a case in the reducer for the vertical slice.

---

## 5. Reducer

```typescript
function sentenceReducer(
  store: SentenceStore,
  action: SentenceAction,
): SentenceStore {
  switch (action.type) {
    case 'SET_CHIP_VALUE':
      return handleSetChipValue(store, action);
    default:
      return store;
  }
}
```

### `SET_CHIP_VALUE` handler

```typescript
function handleSetChipValue(
  store: SentenceStore,
  action: SetChipValueAction,
): SentenceStore {
  const { clauseId, chipId, value } = action;
  const domain = store.domains[chipId];
  const isValid = domain.validate(value);

  const newChipState: ChipState = {
    value,
    displayValue: isValid
      ? domain.display(value)
      : domain.placeholder ?? domain.display(value),
    valid: isValid,
    dirty: true,
  };

  const clause = store.state.clauses[clauseId];
  const newChips = { ...clause.chips, [chipId]: newChipState };
  const clauseValid = Object.values(newChips).every((c) => c.valid);

  const newClauses = {
    ...store.state.clauses,
    [clauseId]: { ...clause, chips: newChips, valid: clauseValid },
  };

  const sentenceValid = Object.values(newClauses).every(
    (c) => !c.active || c.valid,
  );

  return {
    ...store,
    state: {
      ...store.state,
      clauses: newClauses,
      valid: sentenceValid,
    },
  };
}
```

### What it does

1. Looks up the domain for the chip being changed
2. Validates the new value against the domain
3. Computes `displayValue` — uses `placeholder` when invalid, `display` when valid
4. Sets `dirty: true` (the value has been touched)
5. Recomputes clause validity (all chips valid?)
6. Recomputes sentence validity (all active clauses valid?)
7. Returns a new `SentenceStore` — no mutation

### What it doesn't do (yet)

- Context propagation — when a chip value changes, its clause may produce context that affects downstream clauses. That's `SET_CONTEXT`, wired up later.
- Clause reconfiguration — when context changes, `onContextChange` on downstream domains may return new domain overrides. The `domains` map in the store would be updated. Not needed for the slice.
- Validation cascading — a context change might invalidate a downstream chip whose keyword list just changed. Not needed for the slice.

---

## 6. Integration with React (preview)

The hooks (Stage 3) will wrap this reducer:

```typescript
// Sketch — not part of this design's implementation scope
function useSentence(definition: SentenceDefinition) {
  const [store, dispatch] = useReducer(
    sentenceReducer,
    definition,
    initializeSentenceState,
  );
  return { state: store.state, dispatch, domains: store.domains };
}
```

`useReducer` takes the initializer function directly — no `useEffect` or `useState` dance. The store (state + domains) is the single piece of React state. Components read from `store.state`; the `domains` map is available for components that need domain metadata (e.g., the popup needs `domain.keywords`).

---

## 7. File Structure

One file per concern, even when small. Each action handler gets its own file from the start — a wide, shallow foundation ready to build on without reorganizing later.

```
src/core/
  reducer.ts              — sentenceReducer switch + SentenceAction union type
  actions/
    set-chip-value.ts     — handleSetChipValue + SetChipValueAction type
    toggle-clause.ts      — handleToggleClause (stub) + ToggleClauseAction type
    set-context.ts        — handleSetContext (stub) + SetContextAction type
    set-live-value.ts     — handleSetLiveValue (stub) + SetLiveValueAction type
  initialize.ts           — initializeSentenceState, resolveDomain
  store.ts                — SentenceStore, ResolvedDomains types
  state.ts                — (existing) ChipState, ClauseState, SentenceState
  types.ts                — (existing) Domain, ChipDefinition, etc.
```

### Exports

From the package (`src/index.ts`):
- `initializeSentenceState`, `sentenceReducer`
- `SentenceStore`, `SentenceAction` types
- Individual action types (`SetChipValueAction`, etc.)

---

## 8. Extension Points

The reducer is designed to grow without restructuring:

| Future feature | What changes |
|----------------|-------------|
| `TOGGLE_CLAUSE` | New case in switch. Flips `active`, recomputes sentence validity. |
| Context propagation | `SET_CHIP_VALUE` handler gains a post-step: check if the clause produces context, dispatch `SET_CONTEXT` for affected descendants. |
| `onContextChange` | `SET_CONTEXT` handler calls `domain.onContextChange`, updates `store.domains` map, revalidates affected chips. |
| Live chips | `SET_LIVE_VALUE` handler updates chip state with fetched value or error. |
| Undo/redo | Wrap the reducer in a history middleware (same pattern as Redux undo). The store is immutable — history is just an array of past stores. |

None of these require changing the `SentenceStore` shape or the initialization logic. They add cases to the switch and, for context propagation, a helper function that walks the contingency tree.

---

## Decisions Made

- **Store shape:** Single `SentenceStore = { state, domains }` object. Atomic updates when `onContextChange` lands — no split between reducer and ref.
- **`displayValue`:** Computed in the reducer, not the component. Centralized placeholder-vs-display logic, always consistent with `valid` and `value`.
- **Domain resolution:** Once at init time (Option A). Stored in `SentenceStore.domains`, keyed by chip ID.
- **File structure:** One file per action handler from the start. Wide, shallow foundation.

## Out of Scope

- Context propagation (architecture is ready for it, implementation deferred)
- `TOGGLE_CLAUSE` implementation (type defined, handler deferred)
- Live/computed chip handling
- Serialization / deserialization
- React hooks and components (Stage 3 and 4)
