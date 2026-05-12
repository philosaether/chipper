# Assessment: Chipper v1.0 Feature Scope
Date: 2026-05-12
Branch: main

## Current State

### Built (shipped, tested)
- **enumDomain** factory — pure enum archetype with keywords, validation, display
- **createDomain\<T\>** base — internal factory all archetypes share
- **State reducer** — SentenceStore with SET_CHIP_VALUE implemented
- **React hooks** — useSentence, useChip, usePopup, SentenceProvider
- **Components** — Chipper, Sentence, Clause, Chip, ChipPopup, EnumPopup
- **Builder API** — sentence(), clause() with .text()/.chip()/.required()/.optional()/.build()
- **Palette** — createPalette(), extendPalette()
- **SASS theming engine** — token contract, praxis-theme, three CSS exports
- **Demo page v0.1** — single sentence, state inspector, explainer

### Designed (in architecture doc, not built)
- 5 remaining domain archetypes (keyword-expr, multi-select, composite, reference, alt-coordinate)
- 3 stubbed action handlers (TOGGLE_CLAUSE, SET_CONTEXT, SET_LIVE_VALUE)
- Contingency system (clause dependencies, context propagation)
- Repeating clauses
- Chip modes: readonly, live, computed
- Serialization/deserialization
- Default chipperPalette with general-purpose domains
- Preset palettes (scrum, crm, notification)
- Custom popup renderers per domain
- \<ChipperDebug\> component
- Keyboard arrow navigation in popups (roving tabindex)
- Screen reader support (aria-live, aria-invalid)
- Demo page v0.2+ (complexity toggle, playground)

## Praxis UX Cross-Reference

Praxis's htmx chip implementation defines 17 chip types across 4 sentence patterns. Here's how they map to Chipper's designed archetypes:

| Praxis Chip | Chipper Archetype | Notes |
|-------------|------------------|-------|
| interval (day/weekday/weekly/custom) | **Composite** | Keywords collapse DOF; "custom" spawns count+period+day+start |
| day (weekday multi-select, date, ordinal) | **Alternative-coordinate** | Multiple modes over same value space, context-sensitive to period |
| time (presets + custom HH:MM) | **Keyword-or-expression** | Keywords for morning/afternoon, expression for custom time |
| due (presets + custom offset) | **Keyword-or-expression** | Keywords for end-of-day/tomorrow, expression for +Nd/+Nw |
| tags (multi-select + create) | **Multi-select** | Toggle grid with inline creation |
| priority picker (tree navigation) | **Reference** | Dynamic value space, breadcrumb nav, search |
| event subject (enum) | **Pure enum** | Fixed list: task, goal, initiative, practice, any priority |
| event outcome (context-dependent enum) | **Pure enum** + onContextChange | Options change based on subject selection |
| task name (free text) | **Keyword-or-expression** | Expression-only (no keywords), 200 char limit |
| collate target (enum) | **Pure enum** | children / descendants |
| collate name (template text) | **Keyword-or-expression** | Expression with template variables ({{today}}, {{count}}) |
| description (textarea) | **Keyword-or-expression** | Expression-only, 800 char, markdown |
| number (stepper) | **Keyword-or-expression** | Expression with +/- buttons, min/max |
| period (enum) | **Pure enum** | days/weeks/months/quarters/years |
| month (context-dependent enum) | **Pure enum** + onContextChange | Options differ by period (quarter vs year) |
| start (presets + date picker) | **Keyword-or-expression** | Keywords + date expression mode |

**Coverage: complete.** Every Praxis chip maps to one of the six designed archetypes. No new archetype needed.

### Praxis sentence patterns mapped to Chipper features:

| Pattern | Chipper Features Required |
|---------|--------------------------|
| Required clauses ("Every [interval]") | clause().required() — **built** |
| Optional clauses ("↳ due [date]") | clause().optional() + TOGGLE_CLAUSE — **stubbed** |
| Chip spawning (interval→day+period+number) | Composite domain + contingency — **designed** |
| Context propagation (period→day mode) | SET_CONTEXT + onContextChange — **designed** |
| Event trigger pattern | Pure enum + context-dependent enum — **designed** |
| Repeating "when" clauses | repeating() builder + TOGGLE_CLAUSE — **designed** |
| Template variables in names | Expression mode with substitution — needs design attention |

## W2 Tax Form Gap Analysis

A W2 entry form requires these field types:

| W2 Field | Type | Chipper Coverage |
|----------|------|-----------------|
| Employer name, address, employee name | Free text | **Keyword-or-expression** (expression-only) |
| EIN, SSN | Formatted text (XX-XXXXXXX, XXX-XX-XXXX) | **Keyword-or-expression** with input mask — needs **input mask expression mode** |
| Wages, tips, tax withheld (boxes 1-20) | Currency / numeric | **Keyword-or-expression** with numeric expression — needs **numeric formatting** |
| State (box 15) | Enum (50 states + DC + territories) | **Pure enum** — covered |
| Filing status indicators | Boolean / enum | **Pure enum** — covered |
| Tax year | Enum (year list) | **Pure enum** — covered |
| Checkbox fields (statutory employee, retirement, 3rd-party sick pay) | Boolean toggle | **No direct mapping** — needs **boolean chip** or multi-select with single option |

### What's missing for W2:

1. **Numeric expression mode with formatting.** Currency display ($XX,XXX.XX), decimal precision, negative values. The keyword-or-expression archetype supports this structurally, but no numeric expression mode is implemented. This is the most important gap — nearly every W2 box is a dollar amount.

2. **Input mask expression mode.** SSN (XXX-XX-XXXX), EIN (XX-XXXXXXX), ZIP codes. Pattern-constrained text input with visual formatting. This is a specialization of the expression mode concept — validate against a regex, display with formatting characters.

3. **Boolean/toggle chip.** W2 has three checkboxes (box 13). Could be handled by a single-option multi-select, but a dedicated boolean domain would be cleaner and map naturally to "Statutory employee: [yes/no]" in sentence form.

4. **Sentence layout for forms.** W2 is a *form*, not a natural-language sentence. Chipper sentences read like "Wake me up when [September] ends." A W2 reads like "Box 1 — Wages: [$52,000.00]". The sentence builder can technically compose this, but the clause structure (label + chip, no connecting text) is an unusual pattern. The demo would need to show this working naturally.

5. **Multi-sentence coordination.** A W2 has ~20 fields. That's either one giant sentence (awkward) or multiple sentences (one per section: employer info, income, taxes, state). Chipper explicitly scopes at one sentence per instance — multi-sentence coordination is the consumer's responsibility. This is fine architecturally, but the W2 demo needs to show how a consumer composes multiple `<Chipper>` instances into a form.

### What's NOT missing:

- Validation (each domain validates; sentence-level validity is derived)
- Serialization (W2 data can be serialized to JSON for submission)
- Theming (a "taxes" theme can look appropriately institutional)
- Read-only display (readonly chip mode shows submitted values)

## Feature Inventory for v1.0

Grouping by clean implementation boundaries — each is independently implementable:

### Domain Archetypes (5 features)
1. **keywordOrExpressionDomain** — keywords + freeform input. Popup shows keywords above, input field below. Covers: time, due, task name, description, number, start, collate name. *Highest value — unlocks most Praxis chips.*
2. **multiSelectDomain** — toggle grid of options with optional create. Covers: tags, day-set (weekday mode).
3. **compositeDomain** — child chips rendered as clause siblings; keywords collapse DOF. Covers: interval/cadence.
4. **referenceDomain** — async value space with navigation/search popup. Covers: priority picker.
5. **alternativeCoordinateDomain** — tabbed expression modes. Covers: day (date vs weekday mode), month (quarter vs year mode).

### Core Engine (4 features)
6. **TOGGLE_CLAUSE** — activate/deactivate optional clauses. Prerequisite for any sentence with optional parts.
7. **SET_CONTEXT + context propagation** — scoped context through contingency tree. Prerequisite for composite and context-dependent chips.
8. **Contingency system** — clause presence/configuration based on context. Enables chip spawning and conditional UI.
9. **Serialization/deserialization** — save and restore sentence state. Required for any real consumer integration.

### Chip Modes (3 features)
10. **Readonly mode** — display-only chips. Small change in Chip.tsx (already has the BEM class).
11. **Computed mode** — derived values from sentence state. Needs useLiveSource equivalent for internal dependencies.
12. **Live mode** — external data fetching with polling. Needs SET_LIVE_VALUE + useLiveSource hook.

### Expression Modes (3 features — new, not in current designs)
13. **Text input expression mode** — freeform text with optional character limit. The basic expression mode popup.
14. **Numeric expression mode** — number input with min/max, step, optional currency/decimal formatting. +/- stepper variant.
15. **Masked input expression mode** — pattern-constrained text (SSN, EIN, ZIP, phone). Regex validation + display formatting.

### UI Polish (4 features)
16. **Keyboard navigation** — roving tabindex in popups, arrow keys, Enter/Escape. AA compliance.
17. **Screen reader support** — aria-live for value changes, aria-invalid for errors, role=option on popup items.
18. **\<ChipperDebug\>** — JSON/YAML state viewer component.
19. **Boolean domain** — simple yes/no toggle chip. Thin wrapper on enum with two options but distinct UX (toggle vs popup).

### Palette & Presets (2 features)
20. **Default chipperPalette** — general-purpose domains (temporal, text, numeric). The out-of-box experience.
21. **Clause composition helpers** — every(), whenever(), dueIn() reusable clause functions.

### Demo & Docs (3 features)
22. **Demo page v0.2** — multiple example sentences (simple/intermediate/power-user) with complexity toggle.
23. **Theme toggle on demo** — Chipper sentence that switches the page theme live.
24. **Additional themes** — "taxes" (institutional minimal) and one fun theme (terminal/duplo/brick).

### Integration (1 feature)
25. **Praxis palette** — 16 domains from htmx prototype, built in Praxis repo. Not a Chipper feature per se, but the first real consumer test.

## External Input

- **in-progress.md** lists remaining archetypes, action handlers, and default palette as next up
- **Architecture doc** has full specs for all features above
- **Praxis/.meta/designs/** has action-wizard-dag.md and dsl-v2.md defining the complete sentence patterns
- **User goal**: open-source Chipper as a showcase for philset skills + article on AI co-creation. Code quality and demo polish are first-class requirements.

## Recommended Next Steps

Not a roadmap — a grab bag of features with clean boundaries, roughly ordered by unlock value:

**Highest unlock value** (each enables many downstream features):
- keywordOrExpressionDomain (#1) — most Praxis chips need this
- TOGGLE_CLAUSE (#6) — every real sentence has optional clauses
- Text input expression mode (#13) — the basic freeform input popup

**High value** (enables specific patterns):
- multiSelectDomain (#2) — tags, day-sets
- SET_CONTEXT + contingency (#7, #8) — chip spawning, context-dependent options
- Serialization (#9) — required for any save/restore flow

**Medium value** (polish and completeness):
- compositeDomain (#3) — cadence/interval pattern
- alternativeCoordinateDomain (#5) — day/month multi-mode
- Numeric expression mode (#14) — W2 and any data-entry use case
- Keyboard navigation (#16) — AA compliance

**Lower priority for v1** (nice to have):
- referenceDomain (#4) — async search UI, complex popup
- Masked input (#15) — SSN/EIN formatting, niche but important for tax demo
- Boolean domain (#19) — thin wrapper, quick win
- Live/computed modes (#11, #12) — impressive demo but not needed for forms

**Demo/docs** (parallel track):
- Demo v0.2, theme toggle, additional themes, documentation
