# In Progress

Current work state. Update constantly, delete items when done.

---

## Active

- **Theming v2** (feature/theming-v2) — runtime theme switching, hue
  abstraction, applyTheme API, three shipped themes. Design: theming-v2.md.

## Parked

- **riff/demo-prep** — pre-release riff sweep. Display chip mode done,
  remaining items not started. Branch has one track note (readonly chip,
  superseded by display chip design). Resume to tackle remaining riffs.

## Done This Session (2026-05-28)

- [x] Display chip mode — design + implementation + review (feature/readonly-chip-mode):
      Unified readonly/live/computed into single display mode with four source
      strategies (static, derived, remote, external). Info popup, builder DX,
      serialization, visual states, demo page with live weather data.
- [x] Visual polish pass — elevation shadows on expanded chips + popups,
      chip-themed input focus colors, info popup styling
- [x] Reference popup fixes — drill-only click bug, search focus color,
      non-selectable row styling
- [x] Auto-indent refinement — only indent when line has optional clause toggle
- [x] README display chips section

## Next Session

Pick from pre-release roadmap. Likely candidates:

- **Demo page v1.0** (draft) — cohesive release page, error behavior validation
- **Screen reader support** (riff) — ARIA semantic layer on keyboard nav
- **Builder DX wishlist** (riff) — clause ergonomics, `.chip()` footgun, config naming
- **Theming engine v2** (draft) — runtime theme switching
- **Demo import/export panel** (riff) — serialization API showcase

See `roadmap.md` for full list.

## Tech Debt

- Test files have strict-mode errors (implicit any, missing `!` assertions).
  Not blocking — tests pass at runtime. Low priority.
- Architecture doc §2 still references old chip modes (readonly/live/computed).
  Should be updated to reflect unified display mode on next arch refresh.

## v1.0 Feature Inventory

See `roadmap.md` Pre-Release section for remaining items.
See `archive/rearview.md` for completed items.
