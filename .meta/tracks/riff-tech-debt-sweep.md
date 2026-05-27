# riff/tech-debt-sweep

Pre-release tech debt: variance, clause index, ref display, displayLabel rename, strict-mode stragglers.

Started: 2026-05-27

---

## Note 1: displayLabel → display rename on Keyword<T>

Rename `Keyword<T>.displayLabel` to `Keyword<T>.display` across the
internal type and all code that reads it. The consumer-facing
`KeywordConfig.display` field already uses the right name — this is the
internal side catching up.

Affected:
- `core/types.ts` — `Keyword.displayLabel` → `Keyword.display`
- `normalize-keywords.ts` — `normalizeKeywords` maps `config.display` → `display` (was `displayLabel`)
- `normalize-keywords.ts` — `buildDisplayMap` reads `k.display` (was `k.displayLabel`)
- `multi-select.ts` — `display()` reads `keyword.display`
- `alternative-coordinate.ts` — `buildLabelByValue` reads `keyword.display`

No consumer API change — `KeywordConfig.display` is already the public name.

## Note 2: Clause definition index

Precompute `clauseById: Map<string, ClauseDefinition>` and
`clausesBySuper: Map<string, ClauseDefinition[]>` on `SentenceStore` at
init time. Replace 6 `.find()`/`.filter()` calls in context-resolution,
set-chip-value, Clause.tsx, and Chip.tsx.

The maps are built once in `initializeSentenceState` alongside domain
resolution. Store fields are readonly — clauses don't change after init.

Touches:
- `core/store.ts` — add index fields to `SentenceStore`
- `core/initialize.ts` — build indices during init
- `core/context-resolution.ts` — use `clauseById` / `clausesBySuper`
- `core/actions/set-chip-value.ts` — use `clauseById`
- `components/Clause.tsx` — use `clauseById`
- `components/Chip.tsx` — use `clauseById`

## Note 3: useReferenceDisplay hook

Problem: restored reference chips show raw IDs until the user opens the
popup, because `domain.display()` reads from a `displayCache` that's
empty on load. The popup populates it on interaction, but there's no
eager resolution path.

Solution: a `useReferenceDisplay` hook that runs on chip mount. For each
reference-type chip whose value is a non-keyword ID, call
`source.resolveDisplay(value)` and write the result to the domain's
`displayCache`. Then dispatch a no-op SET_CHIP_VALUE to force a
re-render with the resolved display text.

Hook lives in `hooks/useReferenceDisplay.ts`. Imported by `Chip.tsx`
and called conditionally when `domain.type === 'reference'`.

Kept internal — not exported from `chipper/headless`. Headless consumers
can call `source.resolveDisplay` directly.

## Note 4: Domain<T> variance fix

Problem: `Domain<string>` is not assignable to `Domain<unknown>` because
`validate`, `display`, and `ExpressionMode<T>` have contravariant `T`
positions. `Palette.domains` is `Record<string, Domain>` (i.e.,
`Domain<unknown>`), so domain factories that return `Domain<string>` or
`Domain<string[]>` fail strict type checks.

The core tension: Domain internally needs `T` for type-safe validate/display,
but externally the palette and store treat all domains uniformly as `Domain`
(erased `T`). We don't want consumers casting or the palette to be generic.

Approach: make `Domain` an opaque container at the boundary. The `T`
parameter becomes `any` at the palette/store level via a type-erased
alias:

```typescript
// The internal, fully-typed interface stays as-is
interface Domain<T = any> { ... }
```

Changing the default from `unknown` to `any` fixes the variance issue:
`Domain<string>` is assignable to `Domain<any>` because `any` is
bivariant. The internal type safety is preserved by the domain factories
(which constrain `T`), and consumers never interact with `T` directly —
they use `useChip().value` (typed as `unknown`) and cast at the boundary.

This is the simplest fix with zero runtime changes. The alternative
(a branded/opaque type or separate erased interface) adds complexity for
no practical benefit — we're pre-v1 with no external consumers.

Touches:
- `core/types.ts` — change `Domain<T = unknown>` to `Domain<T = any>`
- `core/types.ts` — change `Keyword<T = unknown>` to `Keyword<T = any>` (same issue)
- `core/types.ts` — change `ExpressionMode<T = unknown>` to `ExpressionMode<T = any>`
