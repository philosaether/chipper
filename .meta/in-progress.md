# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- **Keyword grouping** — implementing designs/keyword-grouping.md.
  Branch: feature/keyword-grouping.

## Next Session

Pick from pre-release roadmap. Likely candidates:

- **Screen reader support** — aria-live, aria-invalid, role=option. Keyboard
  nav infrastructure is in place; this is the ARIA semantic layer on top.
- **Demo page v1.0** — rebuild as cohesive release page. Multi-font panels,
  explainer update, import/export panel (tests serialization API).
- **Builder DX wishlist riff** — clause ergonomics, predicate helpers,
  `.chip()` footgun, `displayLabel` → `display`, config/options naming.
- **Keyword grouping** — visual separator / groups in popup keyword lists.
- **Theming engine v2** — runtime theme switching as first-class library feature.

See `roadmap.md` for full pre-release and post-release item lists.

## Tech Debt

- Architecture doc refresh — chipper-architecture.md §3 and §4 are stale.
  logical-architecture.md is current.
- `Domain<T>` variance — blocks demo tsconfig (strict mode).
- Clause definition index — repeated `.find()`/`.filter()` in reducer. Not
  urgent at sentence scale.
- `useReferenceDisplay` hook — restored references show raw IDs until popup
  interaction. Serialization design defers cache hydration to this hook.

## v1.0 Feature Inventory

Full assessment: assessments/v1-feature-scope.md.

### Done This Session (2026-05-24)
- [x] Context-aware punctuation — `.punc()` builder method (done 2026-05-24)
- [x] Keyboard navigation — useKeyboardNavigation hook, focus trap/restore,
      all popup types, aria-labels, focus-visible CSS (done 2026-05-24)
- [x] Serialization/deserialization — serialize/deserialize utilities,
      initialValues overlay, custom serializer support (done 2026-05-24)
- [x] Reference domain demo — genre tree sentence on demo page (done 2026-05-24)
- [x] praxisPalette extracted to separate file (done 2026-05-24)

### Previously Done
- All domain archetypes (KOE, multiSelect, altCoordinate, reference, composite)
- Core engine (contingency, context propagation, chip-level contingency,
  line grouping, mode-switching, context-aware display)
- Builder DX (rename clause→builder, chip/produces shorthands, expression
  helpers, keyword displayLabel, default cascade, contingentOn lambda)
- Theming engine + praxis theme
- v1 developer documentation (README.md)

### Remaining for v1.0
See `roadmap.md` Pre-Release section.
