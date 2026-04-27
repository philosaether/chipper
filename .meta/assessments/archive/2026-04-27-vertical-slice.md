# Assessment: Vertical Slice — "Wake me up when [September] ends."
Date: 2026-04-27
Branch: main

## Target

A running demo page that renders one sentence with one clause, one enum chip, and a working popup. The user clicks [September], sees a list of months, picks one, and the chip updates. Every Chipper layer participates.

## Current State

### What exists and works

| Layer | File(s) | Status |
|-------|---------|--------|
| **Types** | `core/types.ts`, `core/state.ts` | Complete. All definition and state interfaces are in place. |
| **Builder** | `builder/index.ts` | Working. `sentence()`, `clause()`, `chip()`, `repeating()` all produce correct `SentenceDefinition` objects. Tests pass. |
| **Palette** | `palette/index.ts` | Working. `createPalette()` and `extendPalette()` do shallow merge. `chipperPalette` exists but is empty (no domains registered). |
| **Domains** | `domains/index.ts` | **Stub only.** Exports nothing. No archetype factories exist. |
| **State/Reducer** | — | **Does not exist.** No `core/reducer.ts`, no initial state factory. |
| **Hooks** | `hooks/index.ts` | **Stub only.** Exports nothing. |
| **Components** | `components/Chipper.tsx` | Skeleton. Renders clause leads and chip placeholders from the definition. No state, no popup, no interaction. |
| **CSS** | `styles/chipper.css` | Tokens + structural classes for sentence, clause, chip trigger, and popup. Enough for visual rendering. Popup is `display: none` by default. |
| **Tests** | `tests/core/types.test.ts` | One file. Builder smoke tests pass. |
| **Demo** | `demo/` | Shell exists. `App.tsx` renders `<Chipper>` with a hardcoded sentence. Vite config, `index.html`, `main.tsx` all in place. Uses `link:..` for the chipper dependency. |
| **Build** | `vite.config.ts`, `tsconfig.json`, `tsconfig.build.json` | Configured for library mode (ES module, React externalized). |

### What's missing for the vertical slice

1. **`enumDomain()` factory** — needs to produce a `Domain<string>` with keywords, validate, display, defaultValue. This is the simplest archetype: no expression modes, no context.

2. **State reducer** — needs to:
   - Initialize `SentenceState` from a `SentenceDefinition` (resolve domains from palette, create initial `ClauseState`/`ChipState` per clause/chip)
   - Handle `SET_CHIP_VALUE` action (update chip value, revalidate, recompute `displayValue`)
   - Handle `TOGGLE_CLAUSE` action (not needed for the slice, but the reducer should exist structurally)

3. **React context + hooks** — needs:
   - `SentenceProvider` — holds state + dispatch, wraps the sentence
   - `useSentence()` — access sentence state
   - `useChip(clauseId, chipId)` — access chip state + setValue
   - `usePopup()` — singleton open/close (which chip's popup is open)

4. **Interactive components** — needs:
   - `Chipper.tsx` rewritten to use `SentenceProvider` and render real components
   - `Clause.tsx` — renders lead text + chips for one clause
   - `Chip.tsx` — renders trigger button, manages popup open/close, displays current value
   - `ChipPopup.tsx` — positioned container for popup content
   - `popups/EnumPopup.tsx` — renders keyword list, handles selection

5. **CSS additions** — semantic color modifier on chip triggers (e.g., `--month` color), popup keyword list styles, expanded/active states.

6. **Demo update** — `App.tsx` rewritten with the "Wake me up when [September] ends." sentence using a month enum domain.

## Gaps

- No runtime state whatsoever — the library currently produces definitions but can't *run* a sentence.
- No domain implementations — palette domains are referenced by name but never resolved to actual `Domain` objects. The builder stores `domainName` strings; nothing resolves them yet.
- No popup rendering — CSS has the structure but no JS drives it.
- The `Chipper` component ignores `value` and `onChange` props entirely.
- Demo `node_modules` may or may not be installed (the `link:..` dep requires the library to be built first, or Vite needs alias config).

## Recommended Stages

Build layer by layer, each stage producing something testable before moving to the next. Each stage should be one commit's worth of work.

### Stage 1: `enumDomain()` factory
**File:** `src/domains/enum.ts`, update `src/domains/index.ts`
**What:** Factory function that takes `{ type, color, keywords, defaultValue? }` and returns a fully conformant `Domain<string>`. No expression modes. `validate` checks value is in keyword list. `display` returns the matching keyword label.
**Test:** Unit test creating an enum domain, validating values, displaying labels.
**Why first:** Everything downstream needs at least one real domain. This is the foundation chip.

### Stage 2: State initializer + reducer
**File:** `src/core/reducer.ts`
**What:** `initializeSentenceState(definition)` creates initial state by resolving each clause's chips against the palette, creating `ChipState` with `defaultValue` from domain. `sentenceReducer(state, action)` handles `SET_CHIP_VALUE` (update value, run `domain.validate`, run `domain.display`, recompute clause/sentence validity).
**Test:** Unit test initializing state from a sentence definition with one enum chip, dispatching SET_CHIP_VALUE, verifying state transitions.
**Why second:** The reducer is pure logic, no React. It proves the state model works before we wire UI.

### Stage 3: React context + hooks
**Files:** `src/hooks/useSentence.ts`, `src/hooks/useChip.ts`, `src/hooks/usePopup.ts`, `src/hooks/index.ts`
**What:** `SentenceContext` (React context) holds `{ state, dispatch, definition }`. `useSentence()` reads it. `useChip(clauseId, chipId)` returns `{ value, displayValue, valid, setValue }`. `usePopup()` manages singleton open state — `{ openChipId, open(id), close() }`.
**Test:** Can defer to integration test in Stage 5, or write a light hook test with a test wrapper.
**Why third:** Hooks are the bridge between pure state and React rendering. They depend on the reducer (Stage 2) but not on components.

### Stage 4: Interactive components
**Files:** `src/components/Sentence.tsx`, `src/components/Clause.tsx`, `src/components/Chip.tsx`, `src/components/ChipPopup.tsx`, `src/components/popups/EnumPopup.tsx`, update `src/components/Chipper.tsx`
**What:**
- `Sentence` wraps children in `SentenceProvider`, initializes reducer
- `Clause` renders lead text + `Chip` components for each chip definition
- `Chip` renders a trigger button showing `displayValue`, opens popup on click
- `ChipPopup` positions below the trigger, closes on outside click / Escape
- `EnumPopup` lists keywords as buttons, dispatches `SET_CHIP_VALUE` on click
- `Chipper` (auto-renderer) composes `Sentence > Clause > Chip` from definition
**Test:** Can defer to demo (Stage 5) as the integration test.
**Why fourth:** Components consume hooks (Stage 3) and domains (Stage 1). They're the thinnest possible layer over the state.

### Stage 5: CSS + demo
**Files:** `src/styles/chipper.css` (additions), `demo/src/App.tsx`
**What:** Add `--chip-color-month` token, keyword list styles in popup, expanded state on trigger. Demo defines a month enum domain, builds the "Wake me up when [September] ends." sentence, renders `<Chipper>`. User can click the chip, see months, pick one.
**Test:** Manual — run `npm run dev` in demo/, click through.
**Why last:** This is the integration point. If Stages 1-4 are solid, this is just wiring.

### What each stage proves

| Stage | Proves |
|-------|--------|
| 1 | A domain can be created, validates, displays |
| 2 | State initializes from a definition, transitions are correct |
| 3 | React can read and update Chipper state |
| 4 | Components render from state, popups work |
| 5 | All layers compose into a working UI |
