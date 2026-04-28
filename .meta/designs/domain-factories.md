---
Status: accepted
Date: 2026-04-27
Accepted: 2026-04-27
Implemented: 2026-04-27 (feature/demo-page)
Divergences: none
Deferred: five future archetype factories (keyword-expr, multi-select, composite, reference, alt-coordinate)
Assessment: assessments/vertical-slice.md
---

# Domain Factories — Desired State

Domain factories are how archetypes become concrete domains. Each factory takes volatile config (what keywords exist, what color to use, what the default is) and returns a fully conformant `Domain<T>` object with stable behavior (validation, display, context handling). The factory is the volatility boundary: consumers configure, they don't implement.

This design covers the shared machinery all factories use, then applies it to `enumDomain` as the first implementation.

---

## 1. Volatility Decomposition

Every domain has these concerns:

| Concern | Volatile or Stable | Where it lives |
|---------|-------------------|----------------|
| Which keywords exist | Volatile | Consumer config |
| What color to use | Volatile | Consumer config |
| What the default value is | Volatile | Consumer config |
| How to validate a value | **Depends on archetype** | Factory provides default, consumer can override |
| How to display a value | **Depends on archetype** | Factory provides default, consumer can override |
| Expression modes | Volatile | Consumer config (some archetypes have none) |
| Context keys (consumes/produces) | Volatile | Consumer config |
| `onContextChange` behavior | Volatile | Consumer config (optional) |
| The shape of `Domain<T>` | Stable | `core/types.ts` — never changes |
| Filling in defaults for omitted fields | Stable | Factory logic |

The factory's job: accept the volatile parts, fill in sensible defaults for anything omitted, and return a `Domain<T>`. The consumer never calls `new Domain()` or manually assembles the interface.

---

## 2. `createDomain<T>` — The Shared Base

All six archetype factories share a single internal function that handles the common assembly work. This is not exported — consumers use the archetype factories (`enumDomain`, `keywordOrExpressionDomain`, etc.), never the base.

```typescript
// src/domains/create-domain.ts

interface BaseDomainConfig<T> {
  type: string;
  color: string;
  keywords?: Keyword<T>[];
  expressionModes?: ExpressionMode<T>[];
  defaultValue: T;
  placeholder?: string;
  validate?: (value: T) => boolean;
  display?: (value: T) => string;
  consumes?: string[];
  produces?: string[];
  onContextChange?: (context: SentenceContext) => Partial<Domain<T>>;
}

function createDomain<T>(config: BaseDomainConfig<T>): Domain<T> {
  return {
    type: config.type,
    color: config.color,
    keywords: config.keywords ?? [],
    expressionModes: config.expressionModes ?? [],
    defaultValue: config.defaultValue,
    placeholder: config.placeholder,
    validate: config.validate ?? (() => true),
    display: config.display ?? ((value: T) => String(value)),
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  };
}
```

### What `createDomain` does

- Fills `keywords` and `expressionModes` with empty arrays when omitted
- Provides fallback `validate` (always true) and `display` (`String(value)`)
- Passes through everything else verbatim

### What `createDomain` does NOT do

- No archetype-specific logic (that's the factory's job)
- No runtime mutation — returns a plain object
- No registration or side effects

### Why internal-only

Exporting `createDomain` would let consumers bypass archetype factories and assemble arbitrary domains. That defeats the purpose — archetypes exist so consumers don't have to think about which fields interact. If a consumer needs a truly custom domain that doesn't fit any archetype, they can implement `Domain<T>` directly. The interface is right there. But the happy path is always through a factory.

---

## 3. Archetype Factory Pattern

Each archetype factory:

1. Defines a **config interface** specific to that archetype — only the fields that make sense for it
2. Derives `validate` and `display` from the config when the consumer doesn't provide them
3. Calls `createDomain<T>` with the assembled config
4. Lives in its own file under `src/domains/`

The pattern for every factory:

```typescript
// src/domains/<archetype>.ts

interface <Archetype>DomainConfig<T> {
  // Archetype-specific fields the consumer provides
}

function <archetype>Domain<T>(config: <Archetype>DomainConfig<T>): Domain<T> {
  // Derive validate/display from archetype semantics
  // Call createDomain<T>(...)
}
```

Each factory file is self-contained. No factory imports from another factory. Shared logic lives only in `createDomain`.

All factory configs accept optional `consumes`, `produces`, and `onContextChange` as pass-through fields. The archetype determines *default* behavior; the consumer can always extend.

---

## 4. `defaultValue` and `placeholder` — Two Distinct Concerns

A chip has two display states that are easy to conflate:

- **Pre-selected value** — chip starts with a valid keyword, passes validation, user doesn't need to touch it.
- **No selection yet** — chip shows descriptive text, fails validation, user must interact.

These map to two separate fields:

| Field | Type | Purpose |
|-------|------|---------|
| `defaultValue` | `T` | The initial value for the chip's state. If it passes `validate`, the chip renders as "done." If it fails, the chip renders in placeholder style. |
| `placeholder` | `string` | Display text shown in the chip trigger when the current value is invalid. |

`defaultValue` is a real value of type `T`. `placeholder` is display text of type `string`. They never overlap — `placeholder` is not a value, and `defaultValue` is not display text. This keeps the type system honest: you can't pass `'a specific month'` as a `defaultValue` for a `Domain<number>`.

The chip component (Stage 4) checks `domain.validate(value)`:
- **Valid:** renders `domain.display(value)` at full opacity
- **Invalid:** renders `domain.placeholder ?? domain.display(value)` with the placeholder CSS treatment (reduced opacity)

`placeholder` lives on `BaseDomainConfig` so all archetypes get it. The `Domain<T>` interface in `core/types.ts` gets a new optional field:

```typescript
/** Text shown in the chip trigger when the current value is invalid */
placeholder?: string;
```

For enum domains specifically, `defaultValue` defaults to `''` (empty string) when omitted — which fails validation and triggers the placeholder. We do *not* default to `keywords[0]`, because a silent pre-selection that passes validation means the chip looks "done" when the user never touched it.

---

## 5. `enumDomain` — First Application

An enum domain is the simplest archetype: all values are keywords, no expression modes, no context. The value space is fully defined by the keyword list.

### Config Interface

```typescript
interface EnumDomainConfig {
  /** Semantic color key (maps to CSS custom property --chip-color-{color}) */
  color: string;

  /** The complete set of allowed values */
  keywords: Keyword<string>[];

  /**
   * Default value. If omitted, defaults to empty string (invalid → placeholder).
   * If provided, must be a value from the keyword list.
   */
  defaultValue?: string;

  /** Text shown in the chip trigger when the value is invalid */
  placeholder?: string;

  /** Optional: context keys this domain reads */
  consumes?: string[];

  /** Optional: context keys this domain writes */
  produces?: string[];

  /** Optional: reconfigure domain when context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}
```

Note what's absent from the required fields:
- No `type` — derived as `'enum'`
- No `expressionModes` — enums don't have them
- No `validate` — derived from keyword list
- No `display` — derived from keyword list

The config surface is minimal. A consumer provides *only* what's volatile: color and keywords.

### Factory Implementation

```typescript
function enumDomain(config: EnumDomainConfig): Domain<string> {
  const validValues = new Set(config.keywords.map((k) => k.value));
  const labelByValue = new Map(config.keywords.map((k) => [k.value, k.label]));

  return createDomain<string>({
    type: 'enum',
    color: config.color,
    keywords: config.keywords,
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate: (value) => validValues.has(value),
    display: (value) => labelByValue.get(value) ?? value,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  });
}
```

### Derived behavior

- **`validate`**: value must be in the keyword list. `Set.has()` — O(1).
- **`display`**: returns the keyword's label for the value. Falls back to the raw value if not found (defensive, shouldn't happen with valid data).
- **`defaultValue`**: empty string when omitted. `validate('')` returns false → chip renders placeholder.

### Usage examples

```typescript
// Green Day fan — starts with September pre-selected, passes validation
const greendayMonth = enumDomain({
  color: 'month',
  keywords: [...allTwelveMonths],
  defaultValue: 'september',
});

// Generic month domain — starts empty, user must choose
const monthDomain = enumDomain({
  color: 'month',
  keywords: [...allTwelveMonths],
  placeholder: 'a specific month',
});
```

Registering in a palette and building a sentence:

```typescript
const palette = extendPalette({
  domains: { month: monthDomain },
});

const wakeUpSentence = sentence(palette)
  .clause('when', clause()
    .required()
    .lead('Wake me up when')
    .chip('month', 'month')
  )
  .build();
```

---

## 6. File Structure

```
src/domains/
  create-domain.ts    — createDomain<T>() (internal, not exported from package)
  enum.ts             — enumDomain() + EnumDomainConfig
  index.ts            — re-exports all archetype factories
```

`index.ts` exports only the factories:

```typescript
export { enumDomain, type EnumDomainConfig } from './enum';
// Future: keywordOrExpressionDomain, multiSelectDomain, etc.
```

`createDomain` is not exported from `index.ts` or from the package. It's an implementation detail of `src/domains/`.

The package-level `src/index.ts` re-exports from `src/domains/index.ts`:

```typescript
export { enumDomain, type EnumDomainConfig } from './domains';
```

---

## 7. How the Next Five Archetypes Will Follow

Each future archetype factory follows the same pattern. The differences are in what config they accept and what behavior they derive:

| Archetype | Config adds | Derived behavior |
|-----------|-------------|-----------------|
| **keyword-or-expression** | `expression: ExpressionMode<T>` | `validate` checks keywords first, then expression mode. `display` checks keyword label, falls back to expression `display`. |
| **multi-select** | `options: string[]`, `allowCreate?: boolean` | Value is `string[]`. `validate` checks each element. `display` joins labels. Keywords are group shortcuts (e.g., "weekdays" = Mon-Fri). |
| **composite** | `children: Record<string, Domain>` | Value is `Record<string, unknown>`. `validate` delegates to children. `display` joins child displays. Keywords collapse all/some children to fixed values. |
| **reference** | `search: (query: string) => Promise<T[]>` | Async value space. `validate` may need async variant. `display` shows label from last resolved result. |
| **alternative-coordinate** | `modes: ExpressionMode<T>[]` | Multiple expression modes, each a different coordinate system over the same value space. Tabbed UI. |

Every one of these calls `createDomain<T>` at the end. The archetype factory is a thin layer that translates archetype-specific config into the universal `Domain<T>` shape.

---

## 8. Context-Driven Reconfiguration

Domain objects on the `SentenceDefinition` are effectively immutable. When context changes, the reducer handles reconfiguration:

1. User changes a chip value → dispatches `SET_CHIP_VALUE`
2. Reducer updates chip state and propagates context (e.g., `{ period: 'quarters' }`)
3. A downstream chip's domain has `onContextChange` defined
4. Reducer calls `domain.onContextChange(newContext)` → gets `Partial<Domain>`
5. Reducer creates a new domain: `{ ...originalDomain, ...overrides }`
6. The new domain is stored in *runtime state*, not on the definition

The domain knows *what* should change (which keywords, which validation rules). The reducer knows *when* (context propagated). This keeps the reducer generic.

---

## Decisions Made

- **Q1:** All factory configs accept optional `consumes`, `produces`, and `onContextChange` as pass-through fields.
- **Q2:** No `Object.freeze()`. Domain objects are immutable by convention. The reducer produces new objects when context changes; originals are never mutated.
- **Q3:** Domains that span multiple coordinate systems (e.g., Terran + Eoran months) use `alternativeCoordinateDomain`. The escape hatch for truly novel domains is implementing `Domain<T>` directly.
- **Q4:** `defaultValue` and `placeholder` are separate fields. `defaultValue` is the initial `T` value; `placeholder` is display text for the invalid state. Enum domains default to `''` (invalid), not `keywords[0]`.

## Out of Scope

- Popup rendering per archetype (that's Stage 4, components layer)
- The specific keyword lists for the default `chipperPalette` (that's palette config, not factory logic)
- Context propagation mechanics (that's `core/context-propagation.ts`)
- Archetype implementations beyond `enumDomain` (those follow this pattern when needed)
