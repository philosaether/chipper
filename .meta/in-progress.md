# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

Nothing active — session ending 2026-05-30.

## Parked

Nothing parked.

## Done This Session (2026-05-30)

- [x] Screen reader support (riff/demo-prep) — aria-invalid, aria-controls,
      aria-live, aria-valuemin/max/now, .chipper-sr-only, focus-visible on
      alt-coord tabs. Keyboard nav deferred items resolved.
- [x] Builder DX wishlist (riff/demo-prep) — chip() footgun fix, isNumeric()
      + isOneOf() predicate helpers, PuncConfig → PuncOptions rename.
- [x] Demo page v1.0 design accepted (designs/demo-page-v1.md) — maze
      architecture, 14 demos, 6 implementation layers, deep-links. Moved
      to philbas.com for implementation against published npm package.

## Next Session

- **npm publish** — only pre-release item remaining. Final polish pass,
  then publish. Demo page work continues in philbas.com.

## Tech Debt

- Test files have strict-mode errors (implicit any, missing `!` assertions).
  Not blocking — tests pass at runtime. Low priority.
- Architecture doc §2 still references old chip modes (readonly/live/computed).
  Should be updated to reflect unified display mode on next arch refresh.
- Architecture doc §7 should be updated to reflect theming v2 (hue
  abstraction, runtime switching, three themes).

## v1.0 Feature Inventory

See `roadmap.md` Pre-Release section for remaining items.
See `archive/rearview.md` for completed items.
