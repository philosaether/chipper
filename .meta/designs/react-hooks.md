---
Status: accepted
Date: 2026-04-28
Accepted: 2026-04-28
Assessment: assessments/vertical-slice.md (archived)
---

# React Hooks — Desired State

Stage 3 of the vertical slice. Three hooks that bridge the framework-agnostic reducer (Stage 2) to React components (Stage 4). These hooks *are* the headless API — the built-in components use them internally, and `chipper/headless` re-exports them directly.

---

## 1. Volatility Decomposition

| Concern | Volatile or Stable | Where it lives |
|---------|-------------------|----------------|
| React context shape and provider | Stable | `context.ts` — changes only if the store shape changes |
| Wrapping useReducer + onChange | Stable | `useSentence.ts` — thin bridge, no domain knowledge |
| Chip state access pattern | Stable | `useChip.ts` — reads from context, dispatches actions |
| Popup singleton logic | Stable | `usePopup.ts` — open/close state, one-at-a-time constraint |
| Which domains exist, what they validate | Volatile | Still in the palette, untouched by hooks |
| Component rendering decisions | Volatile | Stage 4 concern — hooks provide data, components decide layout |

All three hooks are stable code. They don't know what a "month" or "enum" is. They route data from the store to consumers and dispatch actions back.

---

## 2. React Context

A single context carries the store, dispatch, and the sentence definition (needed by components for lead text, clause structure, etc.):

```typescript
interface SentenceContextValue {
  store: SentenceStore;
  dispatch: React.Dispatch<SentenceAction>;
  definition: SentenceDefinition;
}

const SentenceContext = createContext<SentenceContextValue | null>(null);
```

One context, not three. Components that need only chip state still read from the same context — splitting would add complexity without reducing renders (chips re-render on any sentence state change anyway, since clause/sentence validity is derived).

### Provider

The provider is a thin wrapper that the `<Sentence>` component (Stage 4) will render. But since hooks are Stage 3 and components are Stage 4, the provider is part of the hooks layer:

```typescript
interface SentenceProviderProps {
  definition: SentenceDefinition;
  onChange?: (state: SentenceState) => void;
  children: React.ReactNode;
}

function SentenceProvider({ definition, onChange, children }: SentenceProviderProps) {
  const [store, dispatch] = useReducer(
    sentenceReducer,
    definition,
    initializeSentenceState,
  );

  // Fire onChange after every state transition
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current?.(store.state);
  }, [store.state]);

  const contextValue = useMemo(
    () => ({ store, dispatch, definition }),
    [store, dispatch, definition],
  );

  return (
    <SentenceContext.Provider value={contextValue}>
      {children}
    </SentenceContext.Provider>
  );
}
```

**onChange fires on every state transition**, including the initial one. The consumer decides when to persist. We use a ref for onChange to avoid it as a useReducer/useEffect dependency — the callback identity shouldn't trigger re-renders or re-fires.

**Definition is treated as static** for the lifecycle of a SentenceProvider mount. If the consumer passes a new definition, we don't reinitialize — that's a remount (`key={definitionId}`). This matches React's `useReducer` initializer semantics.

---

## 3. useSentence

Sentence-level access. Used by the `<Sentence>` component and any consumer that needs the full picture.

```typescript
function useSentence(): {
  state: SentenceState;
  dispatch: React.Dispatch<SentenceAction>;
  definition: SentenceDefinition;
  domains: ResolvedDomains;
}
```

Implementation is just context access:

```typescript
function useSentence() {
  const context = useContext(SentenceContext);
  if (!context) {
    throw new Error('useSentence must be used within a <SentenceProvider>');
  }
  return {
    state: context.store.state,
    dispatch: context.dispatch,
    definition: context.definition,
    domains: context.store.domains,
  };
}
```

No parameters. There's one sentence per provider, so there's nothing to select. The hook destructures the store for ergonomics — consumers write `state.clauses` not `store.state.clauses`.

---

## 4. useChip

Chip-level access. The workhorse hook — every `<Chip>` component calls this.

```typescript
function useChip(clauseId: string, chipId: string): {
  value: unknown;
  displayValue: string;
  valid: boolean;
  dirty: boolean;
  domain: Domain;
  chipDefinition: ChipDefinition;
  setValue: (value: unknown) => void;
  loading?: boolean;
  error?: string;
}
```

Implementation:

```typescript
function useChip(clauseId: string, chipId: string) {
  const { state, dispatch, definition, domains } = useSentence();

  const chipState = state.clauses[clauseId]?.chips[chipId];
  if (!chipState) {
    throw new Error(
      `Chip "${chipId}" not found in clause "${clauseId}".`,
    );
  }

  const domain = domains[chipId];

  const chipDefinition = definition.clauses
    .find((c) => c.id === clauseId)
    ?.chips.find((ch) => ch.id === chipId);

  const setValue = useCallback(
    (value: unknown) => {
      dispatch({ type: 'SET_CHIP_VALUE', clauseId, chipId, value });
    },
    [dispatch, clauseId, chipId],
  );

  return {
    ...chipState,
    domain,
    chipDefinition: chipDefinition!,
    setValue,
  };
}
```

### Why not useClause?

The architecture doc mentions `useClause`. For the vertical slice we don't need it — `useSentence` gives you clause state, and `useChip` gives you chip state. A `useClause` hook becomes useful when `TOGGLE_CLAUSE` lands and the `<Clause>` component needs toggle/activation logic. We'll add it then. No stub needed — it's not in the hook index until it has a purpose.

When `useClause` arrives, `useChip` will still read directly from context via `useSentence` — not through `useClause`. They're siblings that both read from the same context, selecting different slices. `useClause` owns clause-level concerns (toggle, activation); `useChip` needs sentence-level things (dispatch, domains map). No intermediary needed.

---

## 5. usePopup

Singleton popup management. Only one chip popup can be open at a time. Clicking a chip while another is open closes the first and opens the second.

### Why a hook, not reducer state?

Popup open/close is **UI state, not sentence state**. Which popup is open doesn't affect the sentence's value, validity, or serialization. It doesn't belong in the SentenceStore. It's a presentation concern managed alongside the sentence but not inside it.
- Makes sense.

### Design

```typescript
interface PopupState {
  /** Currently open chip, or null if no popup is open */
  chipId: string | null;
  clauseId: string | null;
  /** The trigger element — popup positions relative to this */
  anchorElement: HTMLElement | null;
}

function usePopup(): {
  /** Current popup state */
  popup: PopupState;
  /** Open popup for a chip. Closes any currently open popup. */
  open: (clauseId: string, chipId: string, anchorElement: HTMLElement) => void;
  /** Close the currently open popup */
  close: () => void;
  /** Is a specific chip's popup currently open? */
  isOpen: (chipId: string) => boolean;
}
```

### Singleton mechanism

The popup state lives in the SentenceContext alongside the store — it's sentence-scoped, not global. This means two Chipper sentences on the same page each have independent popup state.

The context expands:

```typescript
interface SentenceContextValue {
  store: SentenceStore;
  dispatch: React.Dispatch<SentenceAction>;
  definition: SentenceDefinition;
  popupState: PopupState;
  setPopupState: React.Dispatch<React.SetStateAction<PopupState>>;
}
```

The provider adds a `useState` for popup:

```typescript
const [popupState, setPopupState] = useState<PopupState>({
  chipId: null,
  clauseId: null,
  anchorElement: null,
});
```

`usePopup` reads and writes this state:

```typescript
function usePopup() {
  const { popupState, setPopupState } = useContext(SentenceContext)!;

  const open = useCallback(
    (clauseId: string, chipId: string, anchorElement: HTMLElement) => {
      setPopupState({ chipId, clauseId, anchorElement });
    },
    [setPopupState],
  );

  const close = useCallback(() => {
    setPopupState({ chipId: null, clauseId: null, anchorElement: null });
  }, [setPopupState]);

  const isOpen = useCallback(
    (chipId: string) => popupState.chipId === chipId,
    [popupState.chipId],
  );

  return { popup: popupState, open, close, isOpen };
}
```

### Closing behavior

The popup closes when:
1. The user clicks a different chip (open handles this — it just sets new state)
2. The user presses Escape
3. The user clicks outside the popup and its trigger
4. A value is selected (for single-select domains like enum)

Behaviors 2-4 are implemented in the popup component (Stage 4), not in the hook. The hook provides `close()` — the component decides when to call it.

### Anchor element

The popup needs to position itself relative to the chip trigger button. The trigger passes its DOM element via `open(clauseId, chipId, triggerRef.current)`. The popup component reads `popup.anchorElement` for positioning.

Positioning strategy itself (above/below, flip on overflow) is a Stage 4/5 concern. The hook just stores the anchor reference.

---

## 6. File Structure

```
src/hooks/
  context.ts        — SentenceContext, SentenceContextValue, PopupState types
  SentenceProvider.tsx — Provider component (useReducer + popup useState + onChange)
  useSentence.ts    — Sentence-level state access
  useChip.ts        — Chip state + setValue dispatch
  usePopup.ts       — Singleton popup open/close
  index.ts          — Re-exports all hooks + SentenceProvider
```

`context.ts` owns the React context creation and type definitions. The provider is a `.tsx` file since it renders JSX. Everything else is `.ts`.

### Exports

From `src/hooks/index.ts`:
- `SentenceProvider` (component)
- `useSentence`, `useChip`, `usePopup` (hooks)
- `SentenceContextValue`, `PopupState` (types)

From `src/index.ts` (package public API) — same re-exports.

From `headless.ts` — same re-exports. The headless entry point is literally the hooks.

---

## 7. Vertical Slice Scope

For "Wake me up when [September] ends":
- `SentenceProvider` wrapping the demo
- `useSentence` for the `<Sentence>` component to access state
- `useChip` for the `<Chip>` component to access the enum chip + `setValue`
- `usePopup` for the enum popup open/close

All three hooks are fully implemented. No stubs — they're small enough to do completely.

---

## Open Questions

*None currently — the design is constrained by the architecture doc and the reducer design that precedes it.*

## Out of Scope

- `useClause` — deferred until TOGGLE_CLAUSE implementation
- `useLiveSource` — deferred until live chip support
- Popup positioning logic — Stage 4/5 concern
- Keyboard navigation within popups — Stage 4 accessibility concern
- Memoization / render optimization — premature until we have components to profile
