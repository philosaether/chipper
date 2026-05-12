# Decisions

Append-only log. Don't edit old entries.

---

2026-04-23: Chipper repo initialized. Architecture accepted (designs/chipper-architecture.md). Standalone React library: sentence > clause > chip hierarchy, six domain archetypes, tree-scoped context, palette with defaults + presets, builder API with clause composition, four chip modes, BEM + CSS custom properties, AA accessibility.
2026-04-23: Single repo for code + .meta/ (not the two-repo model). Design docs are shared artifacts that code traces back to.
2026-04-23: Tooling: Vite library mode, TypeScript strict, Vitest, ESLint + Prettier. React 18/19 peer dep. BEM class prefix: chipper-.
2026-04-27: Domain factory pattern accepted (designs/domain-factories.md). Internal createDomain<T> base, archetype factories as public API. All configs accept optional consumes/produces/onContextChange pass-throughs. defaultValue and placeholder are separate concerns: defaultValue is initial T, placeholder is display text for invalid state. Enum defaults to '' (invalid), not keywords[0]. No Object.freeze — immutable by convention.
2026-04-27: State reducer pattern accepted (designs/state-reducer.md). SentenceStore = { state, domains }. Domains resolved once at init, keyed by chipId. displayValue computed in reducer (not component). One file per action handler from the start. SET_CHIP_VALUE implemented for vertical slice; TOGGLE_CLAUSE, SET_CONTEXT, SET_LIVE_VALUE typed but stubbed.
2026-04-28: React hooks design accepted (designs/react-hooks.md). Single SentenceContext carries store + dispatch + definition + popup state. useSentence (sentence-level access), useChip (chip state + setValue), usePopup (singleton open/close). Popup is UI state (useState), not reducer state. useClause deferred until TOGGLE_CLAUSE. SentenceProvider wraps useReducer + onChange. Definition static per mount.
2026-04-28: Interactive components design accepted (designs/interactive-components.md). Chipper wraps SentenceProvider + Sentence. Thin components — hooks own state, CSS owns appearance. Per-domain color via inline CSS variable (--chip-trigger-color), not BEM modifier per color. EnumPopup owns close-after-selection. Outside-click via mousedown + setTimeout(0). Popup unmounts when closed.
2026-04-28: Demo page v0.1 accepted (designs/demo-page.md). Single vertical-slice sentence, live state inspector, explainer text. Demo-specific --chip-color-month token in demo.css (not library defaults). Page structure is foundation for future complexity-tiered showcase.
2026-04-28: ClauseDefinition now uses segments model (interleaved TextSegment + ChipSegment). Builder .lead() replaced by .text(). chips[] kept as derived convenience for initializer/reducer. Resolved the "Every [2] [weeks] on [Monday]" problem from the architecture doc.
2026-04-28: Vertical slice complete and merged to main. All five stages shipped: enumDomain, state reducer, React hooks, interactive components, demo page. 66 tests passing.
2026-05-12: Theming engine design accepted (designs/theming-engine.md). SASS architecture with token contract, praxis-theme as default. Separate sass CLI build (not Vite) for CSS. Pre-computed derived colors for legacy browser support. Token prefix --chipper- (breaking from --chip-). Ship base + theme split from day one. Pastel fills for valued chips, dashed borders for placeholders.
2026-05-12: Border affords mutability — interactive chips show domain-colored border at rest, readonly chips get transparent border. Visual distinction between editable and display-only.
2026-05-12: Chip color scheme matches Praxis: dark-on-pastel at rest, inverted pastel-on-dark for selected popup option. Expanded chip keeps normal colors with accent glow. Popup pills use domain colors throughout.
