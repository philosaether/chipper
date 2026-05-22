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
│                           derive validity, run initial context pass. Also exports computeDisplayValue
│                           and buildContextFromChips (shared with actions and context-resolution).
├── context-resolution.ts — Contingency engine: resolveContext (tree walk), evaluateContingency
│                           (presence, domain reconfiguration, cascade), runInitialContextPass.
├── reducer.ts            — sentenceReducer: pure switch over SentenceAction union. Delegates to action handlers.
├── mode-switching.ts     — TRIGGER_SENTINEL symbol for mode-transition signaling in SET_CHIP_VALUE (internal)
├── resolve-keyword-label.ts — resolveKeywordLabel(): resolve static or dynamic keyword labels with context
└── actions/
    ├── set-chip-value.ts — SET_CHIP_VALUE: update value, validate, display, cascade validity, trigger context propagation
    ├── toggle-clause.ts  — TOGGLE_CLAUSE: flip user-controlled activation on optional clauses
    ├── set-context.ts    — SET_CONTEXT: delegate to evaluateContingency for presence + reconfiguration
    └── set-live-value.ts — SET_LIVE_VALUE: (stub) update live chip from external source
```

### domains/

Domain archetype factories. Each factory takes volatile config and returns a `Domain<T>`. Internal `createDomain<T>` is the shared base — not exported from the package.

```
domains/
├── create-domain.ts           — createDomain<T>(): internal base, fills defaults, passes through config
├── facades.ts                 — Sugar factories: textDomain, numberDomain, dateDomain, keywordDomain
│                                 All delegate to keywordOrExpressionDomain
├── keyword-or-expression.ts   — keywordOrExpressionDomain() + expressionDomain() alias: keywords + text input
│                                 Expression helpers: textExpression(), numericExpression(), dateExpression()
│                                 inputType: 'text' | 'number' | 'date'
├── multi-select.ts            — multiSelectDomain(): toggle grid, Domain<string[]>, group keyword shortcuts
├── alternative-coordinate.ts  — alternativeCoordinateDomain(): tabbed modes with slots, compose/decompose
├── reference.ts               — referenceDomain(): external data, navigation/search popup, display cache
└── index.ts                   — Re-exports all archetype factories + facades
```

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
└── index.ts              — sentence(), builder(), chip(), repeating(). Builder pattern returning SentenceDefinition.
                           contingentOn() accepts bare lambda as presence shorthand.
```

### components/

React components. Depend on hooks for state access.

```
components/
├── Chipper.tsx           — Auto-render entry point: wraps SentenceProvider + Sentence
├── Sentence.tsx          — Renders clauses grouped by LineDefinition. Auto-indents lines
│                           where all clauses are optional or contingent.
├── Clause.tsx            — Three modes: latent (hidden), dormant (muted italic plain text),
│                           active (interactive chips with × toggle)
├── Chip.tsx              — Trigger button + popup mount point, per-domain color via CSS variable
├── ChipPopup.tsx         — Popup container: Escape, outside-click, archetype routing
├── popups/
│   ├── KeywordOrExpressionPopup.tsx — Keywords + text input for koe domains (also handles keywords-only)
│   ├── MultiSelectPopup.tsx — Toggle grid for multi-select domains (stays open)
│   ├── AlternativeCoordinatePopup.tsx — Tabbed popup with slot-based selection
│   └── ReferencePopup.tsx — Tree navigation + search for reference domains
└── index.ts              — Re-exports all components
```

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

SASS-based theming engine. Compiled via `sass` CLI (not Vite) into three CSS outputs: `dist/styles.css` (batteries-included), `dist/base.css` (no theme), `dist/themes/praxis.css` (theme only). All tokens use `--chipper-` prefix.

```
styles/
├── chipper.scss          — Entry: base + components + praxis theme → dist/styles.css
├── chipper-base.scss     — Entry: base + components, no theme → dist/base.css
├── _base.scss            — Structural only: layout, display, position. No colors or borders.
├── _tokens.scss          — Token contract: every --chipper-* custom property with neutral fallbacks
├── _mixins.scss          — SASS helpers: chip-colors() generates -text/-bg/-hover per hue role
├── _components.scss      — BEM visual rules referencing tokens. All colors, borders, shadows.
└── themes/
    ├── _praxis.scss      — Praxis theme: surfaces, accents, 9 classification hue roles
    └── praxis-theme.scss — Entry: standalone theme import → dist/themes/praxis.css
```

---

## demo/

Standalone demo app (v0.1). Separate package with `file:..` dependency on chipper. Vite + React. Resolves chipper imports from source via Vite alias.

```
demo/
├── package.json          — chipper-demo, file:.. dep on parent
├── vite.config.ts        — Vite dev server + alias to parent src/
├── index.html            — Entry HTML
└── src/
    ├── main.tsx          — React root mount
    ├── App.tsx           — Demo page: sentence, state inspector, explainer
    └── demo.css          — Demo page styles + --chip-color-month token
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
│   └── keyword.test.ts     — keywordDomain factory: validate, display, defaults, placeholder
├── hooks/
│   └── hooks.test.tsx      — useSentence, useChip, usePopup, SentenceProvider onChange
├── components/
│   └── components.test.tsx  — Chipper auto-render, popup interaction, selection, onChange
└── fixtures/
    └── month-keywords.ts   — Shared test fixture: month keyword subsets for enum domain tests
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
