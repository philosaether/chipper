# Rearview — Completed Roadmap Items

- **Keyword grouping across popup types** — visual separator / groups
  within a single slot's keyword list. Day-of-month grid, multi-select
  option groups, alt-coordinate slot grouping.
  Completed: 2026-05-27 (feature/keyword-grouping).

- **Tech debt sweep** — Domain<T> variance (any default), clause
  definition index (clauseById/clausesBySuper), useReferenceDisplay hook,
  displayLabel → display rename, strict-mode stragglers.
  Completed: 2026-05-27 (riff/tech-debt-sweep).

- **Architecture doc refresh** — chipper-architecture.md §2–§5, §8 updated
  to reflect current API (builder, facades, hooks, state types, package structure).
  Completed: 2026-05-27 (meta/architecture-refresh).

- **Readonly + live chip modes** — unified into display chip mode with
  four source strategies (static, derived, remote, external). Includes
  info popup, serialization rules, visual states, and builder DX sugar.
  Completed: 2026-05-28 (feature/readonly-chip-mode).

- **Theming engine v2 — runtime theme switching** — Hue abstraction,
  typed ChipperTheme, applyTheme()/clearTheme() API, createHue() helper.
  Three themes (praxis, midnight, terminal) as both TS objects and SCSS.
  Per-chip glow token for dark theme shadows.
  Completed: 2026-05-29 (feature/theming-v2).
