# Assessment: Serialization / Deserialization
Date: 2026-05-24
Branch: main

## Current State

### Infrastructure already in place

**Types** (src/core/types.ts):
- `SentenceDefinition.serializer?: (state: SentenceState) => Record<string, unknown>`
- `SentenceDefinition.deserializer?: (data: Record<string, unknown>) => Record<string, unknown>`
- Both optional; "default flat serialization" implied when absent.

**Builder** (src/builder/index.ts):
- `.serializer(fn)` and `.deserializer(fn)` chainable methods on SentenceBuilder.
- Store functions and attach to the built SentenceDefinition. Working.

**Architecture doc** (designs/chipper-architecture.md §6):
- Specifies default serialization: `{ [chipId]: chipValue }` for all chips in active clauses.
- Custom serializer reshapes output (example: rename keys for API).
- Deserializer: inverse mapping, plus inference of clause activation from which chips have values.

### What does NOT exist

**No `serialize()` or `deserialize()` utility functions.** The builder
accepts the functions but nothing calls them. There's no:
- Default flat serializer implementation
- Default flat deserializer implementation
- Hydration path (create SentenceStore from saved data + definition)
- Integration with `initializeSentenceState`

### State shape to serialize

`SentenceState` contains:
```
clauses: Record<string, ClauseState>
  ├── present: boolean       (derived from contingency — NOT serialized)
  ├── active: boolean        (user-controlled — SERIALIZE for optional clauses)
  ├── chips: Record<string, ChipState>
  │   ├── value: T           (SERIALIZE)
  │   ├── displayValue       (derived — not serialized)
  │   ├── valid              (derived — not serialized)
  │   ├── dirty              (derived — not serialized)
  │   └── expressionMode?    (SERIALIZE — needed to restore mode-switching state)
  ├── valid                  (derived)
  └── visibleChips?          (derived from contingency)
contexts: ContextScope[]     (derived from chip values + contingency — NOT serialized)
valid: boolean               (derived)
```

**Minimal serialization payload**: chip values + optional clause activation
state + expression mode flags. Everything else is derivable by replaying
through the initializer/reducer.

### Relevant existing patterns

- `initializeSentenceState(definition)` creates a fresh store from a
  definition. A hydration path could be "initialize then overlay saved
  values" — avoiding duplication of domain resolution logic.
- `sentenceReducer` handles `SET_CHIP_VALUE` which already cascades
  display computation, validity, and context propagation. Replaying
  saved values through SET_CHIP_VALUE would re-derive all derived state.
- Dormant clauses already persist chip state through deactivation
  (decision 2026-05-21). So optional clause values survive toggle cycles
  — serialization should capture them regardless of active state.

## What's Working

- Builder `.serializer()` / `.deserializer()` methods compile and store
  functions correctly.
- `onChange` callback on SentenceProvider fires on every state change,
  giving consumers a natural "when to persist" hook.
- The headless API exports all necessary types for external consumers
  to build their own serialization (read SentenceState directly).

## Gaps

1. **No default serialize/deserialize implementation** — consumers have
   nothing to call. The architecture doc promises `sentence.serialize(state)`
   but it doesn't exist.

2. **No hydration path** — no way to pass saved data into
   `initializeSentenceState` or `SentenceProvider`. You can't create a
   sentence pre-populated with saved values.

3. **No `initialState` prop on SentenceProvider/Chipper** — the provider
   always initializes fresh from the definition.

4. **Expression mode state** — if a chip was in expression mode when
   saved, that flag (`ChipState.expressionMode`) must be restored.
   SET_CHIP_VALUE uses a sentinel symbol for mode transitions — the
   deserializer needs to handle this or set the flag directly.

5. **Optional clause activation** — inactive optional clauses still have
   chip values (they persist through deactivation). The serializer must
   decide: serialize inactive clause values (full state) or only active
   clause values (lossy but smaller)?

6. **Contingency re-derivation** — when restoring, clause `present` must
   be re-derived from context (not serialized). This means: restore chip
   values → rebuild context → evaluate contingency. The order matters.

7. **Reference domain display cache** — restored references show raw IDs
   until the display cache is populated. The `useReferenceDisplay` hook
   (roadmap item) addresses this, but serialization surfaces it.

## External Input

From roadmap: "Serialization / deserialization — save and restore
sentence state. Core engine feature, not yet designed. Trigger: Praxis
integration (needs to persist user configs)."

From architecture doc §6: full design sketch with examples of default
and custom patterns.

From decisions: "allowCreate deferred — entangled with backend
persistence" (2026-05-13). Serialization is the prerequisite.

Praxis use case: user configures a recurring task sentence → saves →
page reloads → sentence restores to configured state. The serialized
form becomes the task's stored configuration in the Praxis database.

## Recommended Next Steps

1. **Design session (/draft)** — key decisions:
   - **API shape**: `serialize(definition, state)` + `deserialize(definition, data)` as standalone utilities? Or methods on SentenceDefinition? Architecture doc shows `sentence.serialize(state)` but that requires the definition to carry state (it doesn't — state lives in the store).
   - **Default format**: flat `{ chipId: value }` for active chips, or include inactive optional clause values? Include expression mode flags?
   - **Hydration strategy**: (a) Initialize fresh then replay SET_CHIP_VALUE for each chip (correct, re-derives everything, but fires N reducer calls), or (b) Build the full SentenceState directly and pass to provider (faster, but duplicates derivation logic), or (c) Add `initialValues` option to `initializeSentenceState` that overlays values during initialization (clean, single pass).
   - **Provider integration**: `<Chipper initialState={data} />` or `<Chipper initialValues={{ chipId: value }} />`?
   - **Round-trip guarantee**: `deserialize(serialize(state)) === state` for all non-derived fields.

2. **Implementation is small** — once design is settled, this is likely
   one session's work. The serialize side is straightforward (walk
   clauses, collect values). The deserialize side is the interesting part
   (replay values, re-derive contingency, handle expression mode).

3. **Test with Praxis palette** — the first real consumer. Ensure the
   serialized form is what Praxis would store in its database.
