# Grab Bag Assessment — Builder DX & Small Fixes

**Date**: 2026-05-16
**Context**: Second vertical slice — builder-driven demo sentence with complex contingency. Discovery session; scope will grow.

---

## Items for the grab-bag branch

### Builder sugar (from inbox/builder-notes.md + session friction)

1. **`produces()` shorthand** — currently requires `produces({ cadence: 'cadence' })` when chip ID matches context key. Add string overload: `.produces('cadence')` → `{ cadence: 'cadence' }`. ~15 min.

2. **Rename `clause()` → `builder()`** — Phil's note. The top-level export `clause()` returns a `ClauseBuilder`, and `SentenceBuilder.clause(id, ...)` also uses the name `clause`. The rename disambiguates. Touches builder/index.ts exports, demo App.tsx, all tests. ~30 min (mechanical find-replace + verify).

3. **Keyword `displayLabel`** — optional field on `Keyword<T>` for chip trigger text distinct from popup label. E.g. popup shows "week" but chip shows "weekly." Domain `display()` checks `displayLabel` first. ~1 hr.

### Contingency engine polish

4. **Non-null assertion cleanup** — `contingentDef.contingency!` used 3 times in `evaluateContingency` (context-resolution.ts:93-108). Extract to local + guard. ~10 min.

5. **Clause index precomputation** — `definition.clauses.find()` called in reducer hot path (set-chip-value.ts:64, context-resolution.ts:30, :57). Precompute `Map<clauseId, ClauseDefinition>` on SentenceStore at init. Low priority at current scale but clean. ~45 min.

### Display / CSS

6. **Contingent clause indentation** — flex-direction: column stacks all clauses flat. Contingent clauses need visual subordination (margin-left or indent). Pure CSS + maybe a class on Clause.tsx. ~30 min.

### Demo

7. **New demo sentence** — the whole point of the session. Build a complex sentence from scratch using the builder, with multi-line layout, multiple contingency trees, and diverse domain types. This is the discovery vehicle; everything above gets validated through it.

---

## The "line" question

**Current state**: `SentenceDefinition.clauses` is a flat array. `Sentence.tsx` maps over it and renders each as a flex-row child of a flex-column container. There is no grouping concept.

**What "lines" need**:
- **Data model**: A way to group clauses into visual lines. Two options:
  - (A) `SentenceDefinition.lines: string[][]` — array of clause ID groups
  - (B) `ClauseDefinition.line?: number | string` — each clause declares its line
- **Builder**: A `.line()` method on SentenceBuilder, or clause-level `.onLine()`
- **Component**: `Sentence.tsx` groups clauses by line, wraps each group in a `<div class="chipper-line">`
- **CSS**: `.chipper-line` is a flex row (clauses within a line flow inline); `.chipper-sentence` remains flex column (lines stack vertically)

**Assessment: grab-bag sized.** Here's why:
- No engine changes — lines are purely presentational grouping
- No state changes — line membership doesn't affect clause state, context, or contingency
- No domain changes
- Narrow surface: ~20 lines in types, ~15 in builder, ~20 in Sentence.tsx, ~5 in CSS
- No design ambiguity — the only open question is (A) vs (B), and (A) is clearly better because it keeps line composition at the sentence level where the consumer has full visibility

**Recommendation**: Include in grab-bag. Option (A) — `lines` on the definition. If clauses aren't assigned to a line, they each get their own (backwards compatible). Builder gets `.line(clauseId, clauseId, ...)` to group.

---

## Out of scope (needs dedicated design or is Phase 2)

| Item | Why out of scope |
|------|-----------------|
| KOE mode-switching keywords | Entangled with displayLabel, popup behavior change, and expression mode flipping. Needs `/draft`. |
| Serialization/deserialization | Full feature, not a tweak |
| Chip modes (readonly, computed, live) | Full feature each |
| Keyboard navigation + screen reader | AA compliance — deserves focused attention |
| useReferenceDisplay hook | Async lifecycle, needs design |
| Default chipperPalette | Large scope (12+ domains) |
| Clause composition helpers | Depends on palette patterns |

---

## Tech debt noted but not actionable today

- `leads()` builder method stores only `_first`, ignores `_rest` (builder/index.ts:84-87). Repeating clauses will need this fixed, but repeating clauses aren't in scope yet.
- Empty `chipperPalette` vs architecture doc promise of batteries-included. Correct for now — palette comes after all archetypes are proven.
