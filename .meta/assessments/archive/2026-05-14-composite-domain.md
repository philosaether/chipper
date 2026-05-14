# Assessment: Composite Domain Archetype
Date: 2026-05-14
Branch: main

## Current State

### What the architecture says

The composite domain is archetype #4 of six. From `chipper-architecture.md`:

- **Value type**: `Record<string, unknown>` — child values keyed by child chip ID
- **Keywords**: Collapse all or some child DOF to fixed values (e.g., "daily" collapses count+period+day+start into one preset)
- **Child rendering**: Clause siblings, not popup nesting (O3, resolved). The DOM doesn't mirror the contingency graph — the data model handles ownership, the DOM handles readability.
- **Popup**: "Child chips (recursive)" per the popup routing table
- **Primary use case**: Praxis cadence/interval chip — keywords for simple modes ("daily", "weekdays", "weekly"), expandable to count + period + day + start child chips for custom schedules

### What exists today

**Domain infrastructure** — four archetypes implemented:
- `enumDomain` — `Domain<string>`, keywords only
- `keywordOrExpressionDomain` — `Domain<string>`, keywords + text/number input
- `multiSelectDomain` — `Domain<string[]>`, toggle grid, group keywords
- `alternativeCoordinateDomain` — `Domain<string>`, tabbed modes with slots

All share `createDomain<T>` base. All store archetype-specific config in `domain.meta`. All route through `ChipPopup.tsx`'s switch on `domain.type`.

**State model** — chips are flat per clause:
```
SentenceState.clauses[clauseId].chips[chipId] → ChipState
```
Domains resolved once at init into `SentenceStore.domains[chipId]`.

**Builder** — clause segments are static arrays of text + chip references, fixed at build time. No dynamic segment insertion.

**Contingency** — types defined (`ContingencyConfig`, `ClauseOverrides`, `ContextScope`), but SET_CONTEXT and TOGGLE_CLAUSE are stubs. The plumbing exists in the type system but nothing flows yet.

**Chip component** — renders a trigger button + popup. No concept of "child chips" or composite expansion. Each chip is independent.

## What's Working

- Domain factory pattern is mature and consistent across four archetypes
- `meta` field on `Domain<T>` handles archetype-specific data cleanly
- Popup routing via `domain.type` switch is extensible
- Validity cascade (chip → clause → sentence) already recurses correctly
- Builder segments model handles interleaved text and chips

## Gaps

### 1. The rendering problem (architectural)

The architecture says composite child chips render as **clause siblings**. But clause segments are **static** — defined at build time. There's no mechanism to dynamically show/hide chips within a clause based on the composite parent's state.

Two approaches:

**A. Segments stay static, visibility is CSS/conditional rendering.** All child chips are always in the clause definition. When the composite parent has a keyword selected (collapsed), child chips render as hidden or suppressed. When expanded, they appear. The clause segments include both the parent chip and its children; the component layer controls visibility.

**B. Composite is modeled as contingent clauses, not one clause.** The parent keyword chip is in one clause. The child chips are in a separate contingent clause that appears/disappears via the contingency system. This aligns with the existing TOGGLE_CLAUSE stub and doesn't require dynamic segments.

Option B maps much more naturally to the existing architecture. The cadence example becomes:

```
Clause "trigger" (required):  "Every [cadence]"        ← enum with collapse keywords
Clause "trigger-detail" (contingent on trigger):
  "[count] [period] on [day] starting [start]"          ← appears when cadence = "custom"
```

The "composite domain" isn't a single `Domain<Record<string, unknown>>` at all — it's a **coordination pattern** across a keyword chip and a contingent clause of child chips. The parent domain is a regular enum (or keyword-or-expression) whose value determines whether the detail clause is present. The contingency system handles the lifecycle.

This reframing means compositeDomain doesn't need to be a new archetype factory. It needs:
- TOGGLE_CLAUSE + contingency working
- A builder convenience for defining collapse-keyword + contingent-detail patterns
- Context propagation so the detail clause can read the parent's state

### 2. TOGGLE_CLAUSE is stubbed

Required for any optional clause (not just composites). The handler needs to:
- Flip `ClauseState.active`
- Recompute clause and sentence validity
- Potentially trigger contingency evaluation

### 3. SET_CONTEXT is stubbed

Required for context propagation. Composite-style patterns need context so that:
- The parent keyword value determines detail clause presence (`contingency.present`)
- Child chip domains can reconfigure based on parent state (`onContextChange`)

### 4. Contingency evaluation not implemented

`ContingencyConfig.present` and `configure` are defined in types but never called. When a chip value changes, the reducer doesn't walk the contingency tree to show/hide dependent clauses.

### 5. No CompositePopup component

If we go with approach B (contingent clauses), no special popup is needed — the parent uses EnumPopup or KeywordOrExpressionPopup. The "composite popup" row in the architecture's popup routing table would be unnecessary.

If we stay with approach A (single composite domain), we need a popup that either:
- Shows keyword presets (like enum)
- Or shows child chip mini-forms inline

## External Input

**Architecture doc (O3)**: "Composite child chips render as siblings in the clause, not inside the parent chip's popup. The DOM doesn't need to mirror the contingency graph."

**Domain factories doc (§7)**: Composite config adds `children: Record<string, Domain>`. Value is `Record<string, unknown>`. Keywords collapse all/some children to fixed values.

**Praxis cross-reference** (v1-feature-scope.md): Interval chip maps to composite. Keywords collapse DOF; "custom" spawns count+period+day+start.

**in-progress.md**: TOGGLE_CLAUSE listed as "high unlock value" — prerequisite for both composite and any sentence with optional clauses.

## Recommended Next Steps

1. **Resolve the modeling question**: Is composite a new domain archetype (`compositeDomain()` factory with `Domain<Record<string, unknown>>`) or a coordination pattern built from existing primitives (enum parent + contingent clause of child chips)? The contingent-clause approach (B) is simpler, leverages existing infrastructure, and aligns with O3's "siblings in the clause" decision. But it changes the mental model from the architecture doc.

2. **Implement TOGGLE_CLAUSE** regardless of which approach wins — it's a prerequisite for both and unblocks optional clauses generally.

3. **Implement SET_CONTEXT + contingency evaluation** — the other prerequisite. Without context propagation, neither approach works.

4. **Design the builder API** for whichever approach wins. If contingent-clause, it's just builder sugar for the enum + contingent clause pattern. If new archetype, it needs child domain registration and value composition.

5. **Add CompositePopup** only if approach A wins. If approach B, the existing popup components suffice.
