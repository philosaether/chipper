# Assessment: Repeating Clauses
Date: 2026-05-24
Branch: main

## Current State

### What exists

**Types** (src/core/types.ts):
- `RepeatingClauseConfig` interface: `firstLead`, `restLead`, `min`, `max`,
  `template` (a `ClauseDefinition`).
- `SentenceDefinition.repeatingClauses` field: `Record<string, RepeatingClauseConfig>`,
  optional. Never populated by any code path.

**Builder** (src/builder/index.ts):
- `repeating(clauseBuilder, options)` function: exported, takes a
  `ClauseBuilder` + `{ min, max }`, returns a `RepeatingClauseConfig`.
  Extracts `firstLead`/`restLead` from the first text segment (currently
  sets both to the same value — `_rest` is ignored in `leads()`).
- `leads(first, rest)` method on `ClauseBuilder`: accepts two strings but
  only pushes `_first` to segments. `_rest` is silently discarded.
  Noted as tech debt in archived assessment (2026-05-16).

**Runtime support**: None.
- `initializeSentenceState` does not process `repeatingClauses`.
- `sentenceReducer` has no repeating-group actions.
- `TOGGLE_CLAUSE` flips a single clause — no chain awareness.
- The sentence builder's `.clause()` method accepts `ClauseBuilder` only,
  not `RepeatingClauseConfig`. There is no way to pass a repeating config
  into a sentence definition through the builder API.

**Tests**: None for `repeating()`.

### Architecture doc reference

chipper-architecture.md §4 shows the intended API:
```typescript
.clause('conditions', repeating(clause()
  .optional()
  .leads('when', 'and')
  .chip('condition', 'conditionExpr')
, { min: 0, max: 5 }))
```

Architecture §4 describes behavior:
- Instance N+1 present only when instance N is active
- First instance uses `leads[0]`, rest use `leads[1]`
- Each instance independently optional
- `min`/`max` control bounds

## What's Working

The `repeating()` function compiles without errors and produces a
`RepeatingClauseConfig` object. That's the extent of it — it's a
type-correct data structure with no consumers.

## Gaps

1. **No runtime engine support** — the initializer, reducer, and
   TOGGLE_CLAUSE handler are unaware of repeating groups. This is the
   largest gap. Repeating clauses need:
   - Initialization: create N clause instances from the template (N = min)
   - TOGGLE_CLAUSE or new action: when the last instance is activated,
     add another (up to max). When deactivated, remove trailing instances
     (down to min).
   - State: each instance needs a unique clause ID (e.g., `conditions_0`,
     `conditions_1`).

2. **No sentence builder integration** — `.clause()` doesn't accept
   `RepeatingClauseConfig`. The sentence builder needs an overload or
   a new method (e.g., `.repeating()`) to stamp out the template into
   clause definitions.

3. **`leads()` drops `_rest`** — only the first lead text is captured.
   The architecture intends first/rest differentiation ("when" vs "and").

4. **No line integration** — the architecture shows repeating clauses on
   separate lines (each "and [condition]" gets its own line). The current
   `LineDefinition` model is static (built at definition time). Dynamic
   clause instances need dynamic line allocation.

5. **No punc() interaction** — how does `.punc()` resolve when the number
   of clauses changes at runtime? The precomputed `subsequentIds` array
   is built at definition time from a fixed set of clauses.

6. **No contingency interaction** — the architecture says instance N+1
   is present when instance N is active. This is a contingency
   relationship, but it's implicit (not declared via `.contingentOn()`).
   Either the engine needs special-case logic for repeating groups, or
   the builder stamps out explicit contingency chains.

## External Input

From `.meta/inbox/repeating-clauses.md`:
- Demo sentence wants "when [conditions are met]" optional clause
- Second through fifth instances read "and [conditions are met]"
- Up to configurable max (5)
- Questions: what should the helper be called? What format? What other
  helpers are worth building alongside?

From `.meta/inbox/devex-wishlist.md`:
- "Clause definition ergonomics" — `.clause('id', builder())` is verbose,
  needs a smoother idiom. Repeating clauses will amplify this friction.

From `.meta/designs/contingency-engine.md` (out of scope):
- "Repeating clauses — TOGGLE_CLAUSE doesn't handle repeating groups yet"

## Recommended Next Steps

1. **Design session (/draft)** — this needs a design doc before
   implementation. Key decisions:
   - **Static vs dynamic expansion**: Does `.build()` stamp out N clause
     definitions at build time (simpler, fixed max), or does the engine
     create/destroy instances at runtime (more complex, truly dynamic)?
     Static expansion is strongly favored — it avoids runtime definition
     mutation and plays nicely with precomputed `subsequentIds`, line
     grouping, and all existing rendering.
   - **Builder API**: `.repeating()` on sentence builder, or overload
     `.clause()` to accept `RepeatingClauseConfig`?
   - **Contingency chain**: Auto-generated contingency (instance N+1
     contingent on instance N) vs special-case engine logic.
   - **punc() interaction**: If static expansion, punc just works
     (subsequentIds includes all instances). If dynamic, punc needs
     rethinking.
   - **Naming**: "repeating" is accurate. Alternatives: "chain", "multi",
     "group". Architecture doc uses "repeating" — probably keep it.

2. **Fix `leads()` first** — quick fix, unblocks the design. Store
   `_rest` and use it in the repeating template.

3. **Consider the handcoded approach** — for the demo, hardcoding 5
   clauses with explicit contingency chains would work today with zero
   engine changes. If the demo is urgent and the general solution isn't,
   this is a valid interim step. The general `repeating()` can be built
   later and the demo migrated.
