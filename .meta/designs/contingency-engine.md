---
Status: accepted
Date: 2026-05-14
Accepted: 2026-05-14
Implemented: 2026-05-14 (feature/contingency-engine)
Divergences: none
Deferred: context-resolution.test.ts (isolated unit tests — covered indirectly via contingency.test.ts)
Assessment: assessments/archive/2026-05-14-composite-domain.md
Extended-by: chip-contingency.md (segment-level present predicates, visible-only context production)
---

# Contingency Engine — Desired State

The contingency engine is how clauses depend on each other. A chip value changes in one clause, context propagates down the contingency tree, and downstream clauses appear, disappear, or reconfigure. This is the core engine that makes complex sentence patterns possible — cadence chip spawning child clauses, period selection changing day-picker modes, nested scopes preventing key collisions.

The engine implements four concerns from `chipper-architecture.md` §1 that are currently stubbed or missing: clause presence (present/latent), clause activation (active/dormant via TOGGLE_CLAUSE), context propagation (tree-scoped SET_CONTEXT), and domain reconfiguration (onContextChange). Together, these let consumers build arbitrarily deep contingency graphs from existing primitives. No new domain types.

---

## 1. Clause State: Presence and Activation

The architecture doc defines four clause presentation properties. Two are already implemented (necessity, configuration). Two are not (presence, activation). The current `ClauseState.active` conflates them.

### New state model

```typescript
interface ClauseState {
  /** Whether the clause is rendered. Engine-controlled via contingency. */
  present: boolean;

  /** Whether the clause contributes to sentence value. User-controlled for optional clauses. */
  active: boolean;

  chips: Record<string, ChipState>;
  valid: boolean;
}
```

**Rules:**
- A clause contributes to the sentence when `present AND active`
- Required clauses: `active` is always `true`
- Optional clauses: `active` starts `false`, user toggles via ↳/×
- Non-contingent clauses: `present` is always `true`
- Contingent clauses: `present` determined by `contingency.present(context)`

**Initialization:**
```typescript
clauses[clauseDef.id] = {
  present: !clauseDef.contingency,   // contingent clauses start latent
  active: clauseDef.necessity === 'required',
  chips,
  valid: computeClauseValidity(chips),
};
```

**Validity cascade:**
```typescript
// A clause only affects sentence validity when present AND active
function computeSentenceValidity(clauses: Record<string, ClauseState>): boolean {
  return Object.values(clauses).every((c) => !(c.present && c.active) || c.valid);
}
```

### Initial context pass

After initialization, run a context evaluation pass using default chip values. This ensures the initial state is consistent — if a parent chip defaults to a non-collapse value, its contingent clauses start present.

---

## 2. TOGGLE_CLAUSE: User Activation

Flips `active` on optional clauses. Only affects activation, never presence.

```typescript
export function handleToggleClause(
  store: SentenceStore,
  action: ToggleClauseAction,
): SentenceStore {
  const { clauseId } = action;
  const clause = store.state.clauses[clauseId];
  if (!clause) throw new Error(`Clause "${clauseId}" not found.`);

  const newClause: ClauseState = { ...clause, active: !clause.active };
  const newClauses = { ...store.state.clauses, [clauseId]: newClause };

  return {
    ...store,
    state: { ...store.state, clauses: newClauses, valid: computeSentenceValidity(newClauses) },
  };
}
```

### Clause.tsx: toggle UI

Optional, non-contingent clauses get ↳/× toggle buttons. Contingent clauses have no toggle — when latent, the component returns null.

```tsx
// Contingent and not present: don't render
if (clauseDef.contingency && !clauseState?.present) {
  return null;
}

// Optional (user-toggleable), not active: show ↳ + placeholder
if (clauseDef.necessity === 'optional' && !clauseState?.active) {
  return (
    <div className="chipper-clause chipper-clause--dormant">
      <button className="chipper-clause__toggle"
        onClick={() => dispatch({ type: 'TOGGLE_CLAUSE', clauseId })}>↳</button>
      <span className="chipper-clause__placeholder">
        {clauseDef.placeholder ?? clauseId}
      </span>
    </div>
  );
}

// Active optional: show × before segments
// Required: show segments (no toggle)
```

---

## 3. Context Propagation: Tree-Scoped

Context propagates down the contingency tree, not through a flat shared bag. A clause produces context visible to its contingent descendants. The same key name at different levels doesn't collide.

### The multiple-period problem (architecture doc §1)

```
Every [2] [quarters]               ← trigger produces { period: "quarters" }
  on the [15th]                    ← day consumes period → "quarters"
  of the [2nd month],             ← month consumes period → "quarters"
create a task named [review]
  due in [2] [weeks]              ← due produces { period: "weeks" } in its own scope
```

Cadence's `period: "quarters"` and due's `period: "weeks"` coexist without collision because they live in different scopes of the contingency tree.

### Context resolution

When a chip consumes a context key, it walks up the contingency chain to the nearest ancestor that produces it:

```typescript
function resolveContext(
  clauseId: string,
  definition: SentenceDefinition,
  contexts: ContextScope[],
): SentenceContext {
  const resolved: SentenceContext = {};
  let currentId: string | undefined = clauseId;

  while (currentId) {
    const clauseDef = definition.clauses.find((c) => c.id === currentId);
    const superclauseId = clauseDef?.contingency?.superclauseId;

    if (superclauseId) {
      const scope = contexts.find((s) => s.clauseId === superclauseId);
      if (scope) {
        // Nearest ancestor wins — don't overwrite already-resolved keys
        for (const [key, value] of Object.entries(scope.values)) {
          if (!(key in resolved)) {
            resolved[key] = value;
          }
        }
      }
    }

    currentId = superclauseId;
  }

  return resolved;
}
```

### SET_CONTEXT handler

Updates a clause's context scope, then cascades through contingent descendants — evaluating presence, applying domain reconfiguration, and recursing into subtrees.

```typescript
export function handleSetContext(
  store: SentenceStore,
  action: SetContextAction,
): SentenceStore {
  const { clauseId, values } = action;

  // 1. Update this clause's context scope
  const existingIndex = store.state.contexts.findIndex((s) => s.clauseId === clauseId);
  const parentScopeId = findParentScopeId(clauseId, store.definition);
  const newScope: ContextScope = { clauseId, values, parentScopeId };
  const newContexts = existingIndex >= 0
    ? store.state.contexts.map((s, i) => i === existingIndex ? newScope : s)
    : [...store.state.contexts, newScope];

  // 2. Evaluate all clauses contingent on this one
  let newClauses = { ...store.state.clauses };
  let newDomains = { ...store.domains };

  for (const contingentDef of store.definition.clauses) {
    if (contingentDef.contingency?.superclauseId !== clauseId) continue;

    const context = resolveContext(contingentDef.id, store.definition, newContexts);

    // 2a. Evaluate presence
    const shouldBePresent = contingentDef.contingency.present
      ? contingentDef.contingency.present(context)
      : true;

    const current = newClauses[contingentDef.id];
    if (current && current.present !== shouldBePresent) {
      newClauses = {
        ...newClauses,
        [contingentDef.id]: { ...current, present: shouldBePresent },
      };
    }

    // 2b. Apply clause-level domain overrides (configure)
    if (contingentDef.contingency.configure && shouldBePresent) {
      const overrides = contingentDef.contingency.configure(context);
      if (overrides.chipOverrides) {
        for (const [chipId, domainOverride] of Object.entries(overrides.chipOverrides)) {
          const baseDomain = store.domains[chipId];
          if (baseDomain) {
            newDomains = { ...newDomains, [chipId]: { ...baseDomain, ...domainOverride } };
          }
        }
      }
    }

    // 2c. Apply domain-level reconfiguration (onContextChange)
    if (shouldBePresent) {
      for (const chipDef of contingentDef.chips) {
        const domain = newDomains[chipDef.id];
        if (domain?.onContextChange) {
          const domainOverride = domain.onContextChange(context);
          newDomains = { ...newDomains, [chipDef.id]: { ...domain, ...domainOverride } };
        }
      }
    }

    // 2d. Revalidate chips whose domains changed
    for (const chipDef of contingentDef.chips) {
      if (newDomains[chipDef.id] !== store.domains[chipDef.id]) {
        const clause = newClauses[contingentDef.id];
        const chipState = clause?.chips[chipDef.id];
        if (clause && chipState) {
          const domain = newDomains[chipDef.id]!;
          const isValid = domain.validate(chipState.value);
          const newChips = {
            ...clause.chips,
            [chipDef.id]: {
              ...chipState,
              valid: isValid,
              displayValue: computeDisplayValue(domain, chipState.value, isValid),
            },
          };
          newClauses = {
            ...newClauses,
            [contingentDef.id]: { ...clause, chips: newChips, valid: computeClauseValidity(newChips) },
          };
        }
      }
    }

    // 2e. Cascade: if this newly-present clause also produces context, recurse
    if (shouldBePresent && contingentDef.contextProductions && newClauses[contingentDef.id]?.present) {
      const childContext = buildContextFromChips(contingentDef, newClauses[contingentDef.id]!);
      const cascaded = handleSetContext(
        { ...store, state: { ...store.state, contexts: newContexts, clauses: newClauses }, domains: newDomains },
        { type: 'SET_CONTEXT', clauseId: contingentDef.id, values: childContext },
      );
      newClauses = cascaded.state.clauses;
      newContexts = cascaded.state.contexts;
      newDomains = cascaded.domains;
    }

    // 2f. When a clause becomes latent, remove its context and cascade latency
    if (!shouldBePresent) {
      const scopeIndex = newContexts.findIndex((s) => s.clauseId === contingentDef.id);
      if (scopeIndex >= 0) {
        newContexts = newContexts.filter((_, i) => i !== scopeIndex);
      }
      // Cascade latency through subtree
      for (const grandchild of store.definition.clauses) {
        if (grandchild.contingency?.superclauseId === contingentDef.id) {
          const gc = newClauses[grandchild.id];
          if (gc?.present) {
            newClauses = { ...newClauses, [grandchild.id]: { ...gc, present: false } };
          }
        }
      }
    }
  }

  return {
    ...store,
    domains: newDomains,
    state: {
      ...store.state,
      contexts: newContexts,
      clauses: newClauses,
      valid: computeSentenceValidity(newClauses),
    },
  };
}
```

---

## 4. Wiring: SET_CHIP_VALUE Triggers Context Propagation

After updating chip state, the handler checks whether the clause produces context. If so, it builds context values from chip states and calls handleSetContext inline.

```typescript
// At end of handleSetChipValue, before returning:
const clauseDef = store.definition.clauses.find((c) => c.id === clauseId);
if (clauseDef?.contextProductions) {
  const contextValues: SentenceContext = {};
  for (const [contextKey, sourceChipId] of Object.entries(clauseDef.contextProductions)) {
    const chipState = newChips[sourceChipId];
    if (chipState) {
      contextValues[contextKey] = chipState.value;
    }
  }

  return handleSetContext(
    updatedStore,
    { type: 'SET_CONTEXT', clauseId, values: contextValues },
  );
}
```

### Definition access

The reducer needs `SentenceDefinition` to find contingent clauses and context productions. Add a `definition` reference to `SentenceStore`:

```typescript
interface SentenceStore {
  state: SentenceState;
  domains: ResolvedDomains;
  definition: SentenceDefinition;
}
```

Static per mount. Set by the initializer.

---

## 5. The Cadence Pattern: Validation Test Case

The Praxis cadence chip is the most complex contingency graph in the system. It validates that the engine handles multi-level cascading, domain reconfiguration, and tree-scoped context.

### Contingency graph

```
cadence (KOE: collapse keywords + numeric stepper)
│ produces: { cadence }
│
├─ keyword "day"           → trigger-detail: LATENT
├─ keyword "weekday"       → trigger-detail: LATENT
├─ keyword "weekend day"   → trigger-detail: LATENT
├─ keyword "week on..."    → trigger-detail: PRESENT (period locked to "weeks")
├─ keyword "custom"        → trigger-detail: PRESENT (period selectable)
└─ expression "N"          → trigger-detail: PRESENT (period selectable)
       │
       └─ trigger-detail clause
          │ chips: [count, period, daySet, start]
          │ period produces: { period }
          │
          ├─ period = "weeks"    → day in weekday mode, month-clause LATENT
          ├─ period = "months"   → day in date mode, month-clause LATENT
          ├─ period = "quarters" → day in date mode, month-clause PRESENT (quarter keywords)
          └─ period = "years"    → day in date mode, month-clause PRESENT (year keywords)
                                        │
                                        └─ month-clause
                                           chips: [month] with context-dependent keywords
```

### Builder sketch

```typescript
const collapseKeywords = ['day', 'weekday', 'weekend day'];

sentence(praxisPalette)
  .clause('trigger', clause()
    .required()
    .text('Every')
    .chip('cadence', 'cadence')
    .produces({ cadence: 'cadence' })
  )
  .clause('trigger-detail', clause()
    .required()
    .contingentOn('trigger', {
      present: (ctx) => !collapseKeywords.includes(ctx.cadence as string),
      configure: (ctx) => {
        if (ctx.cadence === 'week on...') {
          return { chipOverrides: { period: { defaultValue: 'weeks' } } };
        }
        return {};
      },
    })
    .chip('count', 'count')
    .chip('period', 'period')
    .text('on')
    .chip('daySet', 'daySet')
    .text(', starting')
    .chip('start', 'start')
    .produces({ period: 'period' })
  )
  .clause('month-clause', clause()
    .required()
    .contingentOn('trigger-detail', {
      present: (ctx) => ['quarters', 'years'].includes(ctx.period as string),
      configure: (ctx) => ({
        chipOverrides: {
          month: { keywords: getMonthKeywords(ctx.period as string) },
        },
      }),
    })
    .text('of')
    .chip('month', 'month')
  )
  .build();
```

No special APIs. Just `.contingentOn()`, `.produces()`, and `configure` — all already typed. The engine makes them work.

---

## 6. File Plan

**Modified files:**
```
src/core/state.ts                   — add `present` to ClauseState
src/core/store.ts                   — add `definition` to SentenceStore
src/core/initialize.ts              — set `present`, stash definition, initial context pass
src/core/actions/toggle-clause.ts   — implement handler (user activation)
src/core/actions/set-context.ts     — implement handler (presence, reconfiguration, cascade)
src/core/actions/set-chip-value.ts  — wire context propagation after value update
src/components/Clause.tsx           — toggle UI for optional, null for latent contingent
src/styles/_base.scss               — dormant clause layout
src/styles/_components.scss         — dormant clause visual styles
```

**New files:**
```
src/core/context-resolution.ts      — resolveContext(), buildContextFromChips(), findParentScopeId()
tests/core/toggle-clause.test.ts    — TOGGLE_CLAUSE tests
tests/core/set-context.test.ts      — context propagation + contingency + cascade tests
tests/core/context-resolution.test.ts — context tree resolution tests
```

---

## Tradeoffs

### Presence/activation as separate fields vs. single flag

**Considered**: Keep single `active`, infer meaning from clause definition.

**Chose**: Separate `present` and `active`. The architecture doc defines them independently. Presence is engine-controlled (contingency), activation is user-controlled (optional toggle). Conflating them makes the reducer unable to distinguish the two concerns.

### Tree-scoped context vs. flat

**Considered**: Flat context — simpler, defer tree scoping.

**Chose**: Tree-scoped from the start. The multiple-period problem is a real Praxis scenario visible in the screenshots (cadence produces "period", due clause produces its own "period"). Flat context forces unique key names, pushing unnecessary complexity onto consumers. The tree walk is a simple while loop up the contingency chain.

### Inline cascade vs. event queue

**Considered**: Enqueue follow-up SET_CONTEXT actions, process iteratively.

**Chose**: Recursive inline cascade. The contingency graph is a forest (no loops), so recursion terminates. Depth is 2-3 levels in practice. An event queue adds indirection for no benefit.

### Both `configure` and `onContextChange` vs. one mechanism

**Considered**: Only `configure` (clause-level) or only `onContextChange` (domain-level).

**Chose**: Both. `configure` is for builder-level overrides: "when period is weeks, swap daySet to weekday mode." `onContextChange` is for factory-level self-reconfiguration: "this domain knows how to adapt." They serve different granularities and compose cleanly — configure runs first, then onContextChange.

### Definition on store vs. passed to reducer

**Considered**: Changing the reducer API to accept definition as a third argument.

**Chose**: Store definition reference on `SentenceStore`. Avoids breaking the public API. Definition is static per mount.

## Open Questions

### Q1: Chip value reset after domain reconfiguration

When a domain reconfigures (keywords change), should the chip value reset to `defaultValue`? Or keep the current value and let it go invalid?

Leaning keep and invalidate. The user sees the placeholder treatment (dashed border) and clicks to re-select. Silently resetting loses user input.
- Agreed

### Q2: Context cleanup on latency

When a clause becomes latent, should its context scope be removed and latency cascade to its subtree?

Leaning yes. Stale context from a latent clause could cause downstream clauses to remain present when they shouldn't. The handler in §3 already includes this (step 2f).
- Agreed

### Q3: onContextChange calling convention

Should `onContextChange` receive the full resolved context or only consumed keys?

Leaning full context. The domain can ignore keys it doesn't care about. Filtering adds complexity.
- Agreed

## Out of Scope

- **Repeating clauses** — TOGGLE_CLAUSE doesn't handle repeating groups yet
- **Serialization of contingent state** — presence is derived from context, not serialized
- **Composite builder helper** — consumer convenience; the primitives are sufficient
- **CompositePopup** — not needed; parent is KOE, children are clause siblings
- **Animated clause transitions** — clause appear/disappear is instant; transitions post-v1
