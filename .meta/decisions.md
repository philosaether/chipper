# Decisions

Append-only log. Don't edit old entries.

---

2026-04-23: Chipper repo initialized. Architecture accepted (designs/chipper-architecture.md). Standalone React library: sentence > clause > chip hierarchy, six domain archetypes, tree-scoped context, palette with defaults + presets, builder API with clause composition, four chip modes, BEM + CSS custom properties, AA accessibility.
2026-04-23: Single repo for code + .meta/ (not the two-repo model). Design docs are shared artifacts that code traces back to.
2026-04-23: Tooling: Vite library mode, TypeScript strict, Vitest, ESLint + Prettier. React 18/19 peer dep. BEM class prefix: chipper-.
