---
Status: accepted
Date: 2026-05-22
Accepted: 2026-05-22
Implemented: 2026-05-22 (feature/koe-facades)
Divergences: none
Deferred: none
Assessment: assessments/koe-facade-api.md
---

# KOE Facade Domains — Desired State

Sugar domain factories that hide KOE internals for the most common chip
types. Consumers define text inputs, number inputs, and date pickers
without thinking about expression modes, input types, or KOE popup layout.
Secondary goal: unify `enumDomain` into the same family as `keywordDomain`.

---

## New domain factories

All four facades delegate to `keywordOrExpressionDomain`. They live in
`src/domains/facades.ts` — one file, each function 10–25 lines. The
internal `type` field is `'keyword-or-expression'` for all of them;
popup routing goes through `KeywordOrExpressionPopup`.


### `textDomain(config)`

Free-text input. The most basic freeform chip.

```typescript
interface TextDomainConfig {
  color: string;
  placeholder?: string;
  default?: string;           // defaults to '' (invalid → shows placeholder)
  maxLength?: number; // default 140
  validate?: (value: string) => boolean;
  display?: (value: string) => string;
  keywords?: KeywordConfig<string>[];  // optional presets
}
```

Implementation: delegates to `keywordOrExpressionDomain` with
`expression: textExpression({ maxLength, validate, display })`.

When `keywords` is provided, expression is always-on (no trigger) — the
popup shows keyword pills above and text input below, same as current
KOE layout. No trigger-gated mode for facades; that's a power-user
feature for manual KOE config.

### `numberDomain(config)`

Numeric input with stepper UI.

```typescript
interface NumberDomainConfig {
  color: string;
  placeholder?: string;
  default?: string;           // defaults to '' (invalid → shows placeholder)
  min?: number;
  max?: number;
  step?: number;              // default 1
  prefix?: string | ((ctx: SentenceContext) => string);
  suffix?: string | ((ctx: SentenceContext) => string);
  validate?: (value: string) => boolean;
  display?: (value: string) => string;
  keywords?: KeywordConfig<string>[];
}
```

Implementation: delegates with
`expression: numericExpression({ min, max, step, prefix, suffix, validate, display })`.

### `dateDomain(config)`

Calendar date picker.

```typescript
interface DateDomainConfig {
  color: string;
  placeholder?: string;
  default?: string;           // defaults to '' (invalid → shows placeholder)
  validate?: (value: string) => boolean;  // beyond YYYY-MM-DD
  display?: (value: string) => string;
  keywords?: KeywordConfig<string>[];     // e.g., "tomorrow", "next Monday"
}
```

Implementation: delegates with `expression: dateExpression({ validate, display })`.

### `keywordDomain(config)`

Keywords-only domain. Replaces `enumDomain`.

```typescript
interface KeywordDomainConfig {
  color: string;
  keywords: KeywordConfig<string>[];
  default?: string;           // defaults to first keyword value
  placeholder?: string;
}
```

Implementation: delegates to `keywordOrExpressionDomain` with no
`expression` config. The KOE popup already handles the keywords-only
case — when `expressionMode` is undefined, the expression section
doesn't render.

## Unifying enumDomain → keywordDomain

`EnumPopup` (42 lines) is a strict subset of `KeywordOrExpressionPopup`.
Both render keyword pills, highlight the current selection, and close
after selection. The only functional difference is the popup routing
in `ChipPopup.tsx`: `domain.type === 'enum'` → `EnumPopup`,
`domain.type === 'keyword-or-expression'` → `KeywordOrExpressionPopup`.

### What changes

1. `keywordDomain()` calls `keywordOrExpressionDomain()` internally.
   The domain gets `type: 'keyword-or-expression'`, no expression modes.
2. `EnumPopup.tsx` is deleted. `ChipPopup.tsx` enum case is removed.
3. All call sites (`enumDomain` → `keywordDomain`) updated immediately.
   No deprecated alias — pre-v1, no backwards compat tax.
4. Tests that assert `domain.type === 'enum'` update to
   `domain.type === 'keyword-or-expression'`.

### What stays the same

- Consumer behavior: keyword pills, single-select, close after selection.
- The popup rendering path for keywords-only KOE is already correct —
  the KOE popup's expression section doesn't render when there's no
  expression mode.

### CSS concern

`EnumPopup` uses `.chipper-enum-popup` as its wrapper class.
`KeywordOrExpressionPopup` uses `.chipper-koe-popup__keywords`. The
keywords-only KOE path wraps pills in `.chipper-koe-popup__keywords`
inside `.chipper-koe-popup`. No visual difference in practice — both
are flex-wrap containers with the same pill styling. Any enum-specific
CSS rules (if they exist) would need to target `.chipper-koe-popup`
instead. Quick grep to confirm before deleting.

## File changes

```
src/domains/
├── facades.ts        — NEW: textDomain, numberDomain, dateDomain, keywordDomain
├── enum.ts           — DELETE (all call sites migrated to keywordDomain)
├── keyword-or-expression.ts — unchanged
├── index.ts          — re-export new facades, remove enum re-export
└── ...

src/components/
├── ChipPopup.tsx     — remove enum case from switch
├── popups/
│   ├── EnumPopup.tsx — DELETE
│   └── ...

src/index.ts          — export new facades + types, remove enumDomain export
```

## Default value behavior

All facades follow the same convention:

| Scenario | Default value | Chip display |
|----------|--------------|--------------|
| `default` specified | Uses that value | Shows display text |
| `placeholder` specified, no `default` | `''` (invalid) | Shows placeholder |
| Neither specified | `''` (invalid) | Shows `''` (empty chip) |
| `keywordDomain` only: no `default` | First keyword value | Shows first keyword label |

This matches current `expressionDomain` and `enumDomain` behavior.

## Public API after this change

```
// Facade domains (new)
textDomain(config)        — free-text input
numberDomain(config)      — numeric stepper
dateDomain(config)        — calendar picker
keywordDomain(config)     — keyword list (replaces enumDomain)

// Power-user domains (existing, unchanged)
keywordOrExpressionDomain(config)  — full KOE control
expressionDomain(config)           — expression-only KOE

// Expression helpers (existing, unchanged)
textExpression(options)
numericExpression(options)
dateExpression(options)

// Other archetypes (existing, unchanged)
multiSelectDomain(config)
alternativeCoordinateDomain(config)
referenceDomain(config)

// Removed
enumDomain          — deleted, use keywordDomain
EnumPopup           — deleted, KOE popup handles keywords-only
```

Consumer progression: start with facades, drop to `keywordOrExpressionDomain`
when you need triggers or advanced expression config, use archetype-specific
factories for multi-select/alt-coordinate/reference.

## Tradeoffs

### Facades in one file vs one file per facade

**Chosen: single `facades.ts` file.** Each facade is 10–25 lines. Four
functions in one file is ~80 lines total — well under the 500 line limit.
Separate files would be four tiny files with identical imports. If any
facade grows complex enough to justify its own file, split then.

### keywordDomain as KOE wrapper vs keeping enum as separate archetype

**Chosen: KOE wrapper.** The enum code path is a strict subset of KOE.
Maintaining two popup components for identical behavior is cost without
benefit. The only risk is CSS class name changes, which is trivial to
verify.

**What would change the calculus:** If `EnumPopup` needed divergent
behavior (e.g., grouped keywords with headers, different selection
mechanics), keeping it as a separate archetype would be justified. No
such need is on the horizon.

### Delete enumDomain immediately vs deprecated re-export

**Chosen: delete immediately.** Pre-v1, no backwards compat tax.
All call sites (tests, demo, theme toggle) migrated to `keywordDomain`
in the same change. No aliases, no debt.

### Naming: textDomain/numberDomain vs textInputDomain/numericInputDomain

**Chosen: short names.** `textDomain`, `numberDomain`, `dateDomain` —
named for the value type. "Input" is implementation detail. "Numeric" vs
"number" — `numberDomain` matches `inputType: 'number'` and is more
natural in consumer code (`this chip is a number`).

## Expression position option

Per-chip config for expression input placement relative to keywords.
Surfaces on `ExpressionConfig` as `position?: 'above' | 'below'`
(default `'below'` — current behavior). The facades pass it through
when `keywords` is provided.

This is the second time we've wanted expression-above-keywords. Adding
it now while we're in this code. The popup component reads the position
from `expressionMode` and conditionally renders the input row before or
after the keywords section.

Facades don't change the default — `textDomain` with keywords still
puts expression below. Consumers who want input-first explicitly set
`position: 'above'` in their config. No surprise behavior for new users.

## Open Questions

None — all resolved.

## Out of Scope

- **Trigger-gated expression mode** — facades don't expose triggers.
  Consumers who need trigger behavior use `keywordOrExpressionDomain`
  directly.
- **New popup components** — facades reuse existing KOE popup. No new
  UI.
- **multiSelect / altCoordinate / reference facades** — these archetypes
  have genuinely distinct popup UIs and don't share the "everything is
  KOE" pattern.
- **Demo page v0.3 action line** — will consume the facades but is a
  separate implementation session.
- **v1 developer documentation** — will document the facades but is a
  separate design session.
