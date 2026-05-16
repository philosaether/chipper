---
Status: accepted
Date: 2026-05-16
Accepted: 2026-05-16
---

# Chip-Level Contingency — Desired State

Extend the contingency engine so individual segments (chips and text) within
a clause can appear or disappear based on context — not just whole clauses.
This keeps the contingency tree intact while supporting compound clauses
where multiple chips produce context at different levels.

**Motivating problem**: The cadence pattern needs a single clause that
shows `[cadenceType]` always, but shows `[cadencePeriod]` only when
`cadenceType === 'custom'`. Today, these must be separate clauses, which
forces `dayOfWeek` into a diamond dependency (needs context from both).
Chip-level contingency lets one clause contain both chips, produce both
context keys, and keep the tree clean.

---

## 1. Segment Contingency Model

Segments already have two types: `TextSegment` and `ChipSegment`. We add
an optional `present` predicate to both, evaluated against the clause's
own produced context (intra-clause) and inherited ancestor context.

### Type changes

```typescript
interface TextSegment {
  type: 'text';
  value: string;
  /** When should this text be visible? Omit = always visible. */
  present?: (context: SentenceContext) => boolean;
}

interface ChipSegment {
  type: 'chip';
  chipId: string;
  /** When should this chip be visible? Omit = always visible. */
  present?: (context: SentenceContext) => boolean;
}
```

A segment with no `present` is always rendered (backwards compatible).

### Context available to segment predicates

Segment predicates receive the **merged context**: ancestor context (from
the contingency tree) plus the clause's own produced values. This means
a segment can depend on a sibling chip's value within the same clause.

The ordering matters: segments are evaluated left-to-right. A chip that
produces context is resolved before segments to its right are evaluated
for presence. This is the natural reading order.

**Example — cadence clause:**

```typescript
.clause('cadence', builder()
  .text('Every')
  .chip('cadenceType')
  .chip('cadencePeriod', { present: (ctx) => ctx.cadenceType === 'custom' })
  .produces({ cadenceType: 'cadenceType', cadencePeriod: 'cadencePeriod' })
)
```

When `cadenceType` is `'custom'`, the `cadencePeriod` chip appears. When
it's `'weekly'`, only `cadenceType` is visible. Both values propagate to
contingent clauses downstream — `dayOfWeek` is contingent on `cadence`
and sees both keys.

---

## 2. Builder API

### Chip with contingency

Add optional `present` to the `chip()` method on ClauseBuilder:

```typescript
chip(id: string, domainName?: string, options?: {
  mode?: ChipMode;
  present?: (context: SentenceContext) => boolean;
}): ClauseBuilder;
```

### Text with contingency

Add optional `present` to the `text()` method:

```typescript
text(value: string, options?: {
  present?: (context: SentenceContext) => boolean;
}): ClauseBuilder;
```

### Example — full cadence sentence

```typescript
sentence(praxisPalette)
  .clause('cadence', builder()
    .text('Every')
    .chip('cadenceType')
    .chip('cadenceCount', 'numericInterval', {
      present: (ctx) => ctx.cadenceType === 'custom',
    })
    .chip('cadencePeriod', {
      present: (ctx) => ctx.cadenceType === 'custom',
    })
    .produces({ cadenceType: 'cadenceType', cadencePeriod: 'cadencePeriod' })
  )
  .line()
  .clause('dayOfWeek', builder()
    .text('on')
    .chip('dayOfWeek')
    .contingentOn('cadence', {
      present: (ctx) => {
        if (ctx.cadenceType === 'weekly') return true;
        if (ctx.cadenceType === 'custom')
          return ['week', 'month'].includes(ctx.cadencePeriod as string);
        return false;
      },
    })
  )
  .build();
```

No diamond. `dayOfWeek` has one superclause (`cadence`), and `cadence`
produces both context keys.

---

## 3. Engine Changes

### 3a. Segment presence evaluation

New function in `initialize.ts`:

```typescript
function evaluateVisibleChips(
  segments: ClauseSegment[],
  context: SentenceContext,
): string[] | undefined {
  // Returns visible chipIds as an array, or undefined if no predicates exist.
  // Text segments don't need tracking — they're evaluated at render time.
  let hasPredicates = false;
  const visible: string[] = [];
  for (const segment of segments) {
    if (segment.type === 'chip') {
      if (segment.present) {
        hasPredicates = true;
        if (segment.present(context)) visible.push(segment.chipId);
      } else {
        visible.push(segment.chipId);
      }
    }
  }
  return hasPredicates ? visible : undefined;
}
```

### 3b. Context production from visible chips only

When a clause produces context, only visible chips contribute values.
A hidden chip's value should not propagate — it's conceptually absent.

Updated `buildContextFromChips` to filter by `clauseState.visibleChips`
internally — no extra parameter needed. Also extracted `buildClauseContext`
in `context-resolution.ts` to merge ancestor context with own chip values
(used by segment predicate evaluation in reducer and component).
```

### 3c. SET_CHIP_VALUE triggers segment re-evaluation

When a chip value changes in a clause that produces context:

1. Compute the clause's full context (ancestor + own productions)
2. Evaluate segment presence against that context
3. Rebuild context production using only visible chips
4. Propagate via existing `evaluateContingency`

This is a small addition to the existing SET_CHIP_VALUE handler — the
cascade machinery already exists.

### 3d. Store visible chips per clause

Add to `ClauseState`:

```typescript
interface ClauseState {
  present: boolean;
  active: boolean;
  chips: Record<string, ChipState>;
  valid: boolean;
  /** Chips currently visible (undefined = all visible, for backwards compat) */
  visibleChips?: string[];
}
```

This lets the Clause component know which segments to render without
re-running predicates.

---

## 4. Component Changes

### Clause.tsx

The segment rendering loop checks `visibleChips` before rendering:

```typescript
{clauseDef.segments.map((segment, index) => {
  if (segment.type === 'text') {
    // Text with present predicate: check against context
    if (segment.present) {
      const context = /* resolve from state */;
      if (!segment.present(context)) return null;
    }
    return <span key={index} className="chipper-clause__text">{segment.value}</span>;
  }

  // Chip: check visibleChips from clause state
  if (clauseState.visibleChips && !clauseState.visibleChips.has(segment.chipId)) {
    return null;
  }
  return <Chip key={segment.chipId} clauseId={clauseId} chipId={segment.chipId} />;
})}
```

Text segment presence is evaluated at render time (cheap — just a
predicate call). Chip presence is pre-computed in the reducer (stored
in `visibleChips`) because it affects context propagation.

---

## 5. Validity

A hidden chip does not affect clause validity. Update
`computeClauseValidity` to accept `visibleChips`:

```typescript
function computeClauseValidity(
  chips: Record<string, ChipState>,
  visibleChips?: Set<string>,
): boolean {
  for (const [chipId, chipState] of Object.entries(chips)) {
    if (visibleChips && !visibleChips.has(chipId)) continue;
    if (!chipState.valid) return false;
  }
  return true;
}
```

Hidden chips retain their state (value, dirty flag) so that when they
reappear, the user's previous selection is preserved.

---

## 6. File Plan

**Modified files:**
```
src/core/types.ts                  — present? on TextSegment, ChipSegment
src/core/state.ts                  — visibleChips on ClauseState
src/core/initialize.ts             — initial segment evaluation
src/core/context-resolution.ts     — evaluateSegmentPresence, updated buildContextFromChips
src/core/actions/set-chip-value.ts — segment re-evaluation after value change
src/components/Clause.tsx          — conditional segment rendering
src/builder/index.ts               — present option on .chip() and .text()
```

**New files:**
```
tests/core/chip-contingency.test.ts — segment presence, context filtering, cascade
```

---

## Tradeoffs

### Segment predicates vs. a separate "chip contingency" config

- **Alternative**: Add a `ChipContingencyConfig` parallel to clause-level
  `ContingencyConfig`, with its own `present`, `configure`, etc.
- **Rejected**: Over-engineered. Chip segments don't need their own
  configure/cascade — they just appear or disappear. A single `present`
  predicate on the segment is sufficient. If we ever need chip-level
  domain reconfiguration, clause-level `configure` already handles it
  via `chipOverrides`.

### Store visibleChips vs. re-evaluate at render time

- **Alternative**: Don't store `visibleChips` — evaluate predicates in
  Clause.tsx like we do for text segments.
- **Rejected**: Chip visibility affects context propagation and validity.
  These are reducer concerns, not render concerns. Storing `visibleChips`
  keeps the reducer as the single source of truth.
- **Revisit if**: The extra state field causes stale-data bugs.

### Hidden chips exclude from context vs. produce undefined

- **Alternative**: Hidden chips produce `undefined` for their context key,
  letting downstream predicates check `ctx.key === undefined`.
- **Rejected**: Cleaner to omit the key entirely. Downstream predicates
  already handle missing keys via optional chaining. Producing `undefined`
  is indistinguishable from "never produced" in JavaScript.

---

## Open Questions

1. **Text segment context**: Text `present` predicates need context to
   evaluate. Should Clause.tsx resolve context itself (via a hook), or
   should text visibility also be pre-computed in the reducer? Leaning
   render-time — text visibility doesn't affect state, so the reducer
   doesn't need to know.
   **Resolved**: Render-time.

2. **Segment ordering guarantee**: The design says left-to-right evaluation
   matters (a chip's value is available to segments after it). In practice,
   the reducer evaluates all chip productions at once — it doesn't walk
   segments sequentially. Is sequential evaluation actually needed, or is
   "all chips in the clause contribute to context" sufficient? Leaning
   the latter — all chips produce simultaneously, predicates see the
   clause's full context.
   **Resolved**: Simultaneous.

---

## Out of Scope

- **Chip-level domain reconfiguration** — clause-level `configure` with
  `chipOverrides` already handles this. No per-chip `onContextChange`.
- **Animated segment transitions** — segments appear/disappear instantly.
- **Nested chip contingency** — a chip contingent on another chip in the
  same clause. The model supports it (predicate sees full clause context)
  but we don't need to test deep chains within a single clause.
