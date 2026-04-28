# Logical Architecture

Authoritative map of the Chipper codebase. If this document says a concern lives in a file, and you find that concern elsewhere, that's a bug.

**Convention**: 500 lines max per file. One concern per file. Directory names are documentation. TypeScript strict, no `any`.

**Scope**: Minimal, up-to-date source of truth for navigating the codebase. Keep ephemeral information (migration plans, implementation steps) in planning documents, not here.

---

## src/

### index.ts

Public API surface. Everything exported here is part of the library contract. Re-exports from all subpackages — consumers see a flat API.

### core/

Framework-agnostic data model and state management. No React dependency anywhere in this directory.

```
core/
├── types.ts              — Definition types: Domain, Keyword, ExpressionMode, ChipDefinition,
│                           ClauseDefinition, SentenceDefinition, Palette, ChipMode, etc.
├── state.ts              — Runtime state types: ChipState, ClauseState, SentenceState, ContextScope
├── store.ts              — SentenceStore (state + resolved domains), ResolvedDomains type
├── initialize.ts         — initializeSentenceState: resolve domains from palette, create initial state,
│                           derive validity. Also exports computeDisplayValue (shared with actions).
├── reducer.ts            — sentenceReducer: pure switch over SentenceAction union. Delegates to action handlers.
└── actions/
    ├── set-chip-value.ts — SET_CHIP_VALUE: update value, validate, display, cascade validity
    ├── toggle-clause.ts  — TOGGLE_CLAUSE: (stub) activate/deactivate optional clause
    ├── set-context.ts    — SET_CONTEXT: (stub) propagate scoped context to contingent descendants
    └── set-live-value.ts — SET_LIVE_VALUE: (stub) update live chip from external source
```

### domains/

Domain archetype factories. Each factory takes volatile config and returns a `Domain<T>`. Internal `createDomain<T>` is the shared base — not exported from the package.

```
domains/
├── create-domain.ts      — createDomain<T>(): internal base, fills defaults, passes through config
├── enum.ts               — enumDomain(): pure enum archetype, keywords-only, derived validate/display
└── index.ts              — Re-exports all archetype factories
```

Future files (one per archetype, added when needed):
- `keyword-expr.ts` — keywordOrExpressionDomain()
- `multi-select.ts` — multiSelectDomain()
- `composite.ts` — compositeDomain()
- `reference.ts` — referenceDomain()
- `alt-coordinate.ts` — alternativeCoordinateDomain()

### palette/

Palette creation and extension. The palette bridges Chipper's generic machinery and a consumer's specific vocabulary.

```
palette/
└── index.ts              ��� chipperPalette (empty default), createPalette(), extendPalette()
```

### builder/

Sentence builder API. Imperative composition of clauses from palette domains.

```
builder/
└── index.ts              — sentence(), clause(), chip(), repeating(). Builder pattern returning SentenceDefinition.
```

### components/

React components. Depend on hooks for state access.

```
components/
├── Chipper.tsx           — Auto-rendering top-level component (skeleton — renders clause/chip structure)
└── index.ts              — Re-exports
```

Future files (Stage 4 of vertical slice):
- `Sentence.tsx` — Wraps children in SentenceProvider
- `Clause.tsx` — Lead text + chips for one clause
- `Chip.tsx` — Trigger button + popup anchor
- `ChipPopup.tsx` — Positioned popup container
- `popups/EnumPopup.tsx` — Keyword list popup

### hooks/

React hooks — also the headless API (`chipper/headless`).

```
hooks/
├── context.ts            — SentenceContext, SentenceContextValue, PopupState types
├── SentenceProvider.tsx   — Provider: useReducer + popup useState + onChange callback
├── useSentence.ts        — Sentence-level state, dispatch, definition, resolved domains
├── useChip.ts            — Chip state + setValue dispatch for a single chip
├── usePopup.ts           — Singleton popup open/close (one popup per sentence)
└── index.ts              — Re-exports all hooks + SentenceProvider
```

### styles/

```
styles/
└── chipper.css           — Default theme: CSS custom properties (design tokens), BEM classes for
                            sentence, clause, chip trigger, popup. Semantic color system via
                            --chip-color-{key}. Consumer overrides via custom properties.
```

---

## demo/

Standalone demo app. Separate package with `link:..` dependency on chipper. Vite + React.

```
demo/
├── package.json          — chipper-demo, links to parent package
├── vite.config.ts        — Vite dev server config
├── index.html            — Entry HTML
└── src/
    ├── main.tsx          — React root mount
    └── App.tsx           — Demo page with example sentence
```

---

## tests/

Mirrors `src/` structure. Tests alongside the code they verify.

```
tests/
├── core/
│   ├── types.test.ts       — Builder smoke tests
│   ├── initialize.test.ts  — State initialization from definitions
│   └── reducer.test.ts     — SET_CHIP_VALUE + stub action tests
├── domains/
│   └── enum.test.ts        — enumDomain factory: validate, display, defaults, placeholder
└── hooks/
    └── hooks.test.tsx      — useSentence, useChip, usePopup, SentenceProvider onChange
```

---

## Root files

```
├── package.json             — npm package config, React 18/19 peer dep, Vite library mode
├── tsconfig.json            — TypeScript strict config (development)
├── tsconfig.build.json      — TypeScript build config (emits declarations)
├── vite.config.ts           — Library build: ES module, React externalized
├── headless.ts              — Package entry point for 'chipper/headless'
├── logical-architecture.md  — This file
├── CLAUDE.md                — Session instructions and conventions
├── LICENSE                  — MIT
└── README.md                — Quick start (placeholder)
```

---

## .meta/

Project working state. Tracked in git.

```
.meta/
├── README.md                — Convention explainer
├── decisions.md             — Append-only decision log
├── in-progress.md           — Current work state
├── designs/
│   ├── index.md             — Active design doc index
│   ├── chipper-architecture.md — Library architecture blueprint (accepted)
│   ├── domain-factories.md  — Domain factory pattern (accepted)
│   └── state-reducer.md     — State initializer + reducer (accepted)
├── assessments/
│   └── vertical-slice.md    — Vertical slice assessment
└── inbox/
    └── iroccian-calendar.yml — Eoran calendar months (reference for Q3 in domain-factories)
```
