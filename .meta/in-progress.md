# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

Nothing active — session ended 2026-05-30.

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
- [x] npm publish — @philosaether/chipper@0.1.0 on npm. Fixed declaration
      emission (tsconfig.build.json), cleaned demo (deleted App1/2/3),
      updated package metadata.

## Next Session

Chipper library work is done for now. Next steps:
- **philbas.com** — start demo page v1.0 (design + roadmap in
  `~/Development/html/.meta/inbox/chipper-demo-page-*.md`)
- **Chipper post-release** — architecture doc refresh, test strict-mode
  cleanup, or any post-release roadmap items as needed.

## Tech Debt

- Test files have strict-mode errors (implicit any, missing `!` assertions).
  Not blocking — tests pass at runtime. Low priority.
- Architecture doc §2 still references old chip modes (readonly/live/computed).
  Should be updated to reflect unified display mode on next arch refresh.
- Architecture doc §7 should be updated to reflect theming v2 (hue
  abstraction, runtime switching, three themes).
