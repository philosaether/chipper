# Design Documents

Current design docs only. If it's here, it's active. Superseded docs live in `archive/designs/`.

| Doc | Status | Summary |
|-----|--------|---------|
| [chipper-architecture.md](chipper-architecture.md) | accepted | Library architecture: components, state, builder API, palette, package structure. |
| [domain-factories.md](domain-factories.md) | accepted | Domain factory pattern: createDomain base, archetype factory conventions, enumDomain first application. |
| [state-reducer.md](state-reducer.md) | accepted | State initializer and reducer: SentenceStore, domain resolution, SET_CHIP_VALUE, extension points. |
| [react-hooks.md](react-hooks.md) | accepted | React hooks: useSentence, useChip, usePopup, SentenceProvider. Stage 3 of vertical slice. |
| [interactive-components.md](interactive-components.md) | accepted | Interactive components: Sentence, Clause, Chip, ChipPopup, EnumPopup. Stage 4 of vertical slice. |
| [demo-page.md](demo-page.md) | accepted | Demo page v0.1: vertical slice sentence, state inspector, explainer. Stage 5 of vertical slice. |
| [theming-engine.md](theming-engine.md) | accepted | SASS theming engine: token contract, file architecture, praxis-theme as default. |
| [keyword-or-expression-domain.md](keyword-or-expression-domain.md) | accepted | keywordOrExpressionDomain: keywords + text input popup, second archetype. |
| [multi-select-alt-coordinate.md](multi-select-alt-coordinate.md) | accepted | multiSelectDomain + alternativeCoordinateDomain: toggle grid and tabbed mode popups. |
| [visual-polish.md](visual-polish.md) | accepted | Visual polish: popup density, font-size token, WCAG contrast, caret, multi-font demo. |
| [reference-domain.md](reference-domain.md) | accepted | Reference domain: async/hierarchical data source, navigation/search popup. |
| [contingency-engine.md](contingency-engine.md) | accepted | Contingency engine: clause presence/activation, tree-scoped context, domain reconfiguration, cascade. |
| [builder-dx.md](builder-dx.md) | accepted | Builder DX: rename clause→builder, chip/produces shorthands, keyword displayLabel, default, palette rename, expression helpers. |
| [chip-contingency.md](chip-contingency.md) | accepted | Chip-level contingency: segment visibility within a clause based on context, visible-only context production. |
| [mode-switching.md](mode-switching.md) | accepted | Mode-switching: trigger keywords enter expression mode, regular keywords exit. Mode-aware KOE popup layout. |
| [koe-facades.md](koe-facades.md) | accepted | KOE facade domains: textDomain, numberDomain, dateDomain, keywordDomain sugar over KOE. enumDomain unification. |
| [v1-docs.md](v1-docs.md) | accepted | v1 developer documentation: single README.md with quick start, domain types, sentence building, theming, API reference. |
| [context-punctuation.md](context-punctuation.md) | accepted | Context-aware punctuation: dynamic TextSegment.value, .punc() builder sugar, default trailing-delimiter resolver. |
| [keyboard-navigation.md](keyboard-navigation.md) | accepted | Keyboard navigation: useKeyboardNavigation hook, aria-activedescendant, focus trap/restore, AA compliance. |
| [serialization.md](serialization.md) | accepted | Serialization: serialize/deserialize utilities, initialValues overlay, SerializedSentence format, SentenceViewModel pattern. |
