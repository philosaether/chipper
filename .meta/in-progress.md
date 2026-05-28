# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- [ ] Display chip mode implementation (feature/readonly-chip-mode)
      Design: designs/display-chip-mode.md
      Steps: types → reducer → builder DX → rendering → info popup → visual states → demo

## Done This Session (2026-05-27)

- [x] Roadmap audit — categorized pre-release items (3 drafts, 5 riffs, 1 gate)
- [x] Keyword grouping — design + implementation + review (feature/keyword-grouping)
- [x] Tech debt sweep — all 5 items (riff/tech-debt-sweep):
      Domain<T> variance, clause index, useReferenceDisplay, displayLabel rename, strict-mode
- [x] Architecture doc refresh — §2–§5, §8 (meta/architecture-refresh)

## Next Session

Pick from pre-release roadmap. Likely candidates:

- **Demo page v1.0** (draft) — cohesive release page, error behavior validation
- **Screen reader support** (riff) — ARIA semantic layer on keyboard nav
- **Readonly + live chip modes** (riff) — types exist, needs rendering + fetching
- **Builder DX wishlist** (riff) — clause ergonomics, `.chip()` footgun, config naming
- **Theming engine v2** (draft) — runtime theme switching

See `roadmap.md` for full list.

## Tech Debt

- Test files have strict-mode errors (implicit any, missing `!` assertions).
  Not blocking — tests pass at runtime. Low priority.

## v1.0 Feature Inventory

See `roadmap.md` Pre-Release section for remaining items.
See `archive/rearview.md` for completed items.
