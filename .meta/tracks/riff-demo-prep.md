# riff/demo-prep

Pre-release riff sweep: display chip mode, screen reader support, demo import/export, builder DX wishlist.

Started: 2026-05-28

---

## Note 1: Readonly chip mode (superseded)

Superseded by display chip design (feature/display-chip-mode). Merged to main.

## Note 2: Screen reader support

ARIA semantic layer on top of existing keyboard navigation. Six changes:

1. **aria-invalid** on Chip trigger when `valid === false` — announces error state
2. **aria-controls** linking Chip trigger to popup via `id="chipper-popup-{chipId}"` — semantic association
3. **aria-live="polite"** on ReferencePopup items container — announces loading/error/empty state changes
4. **aria-valuemin/max/now** on NumericInput — announces numeric bounds and current value
5. **.chipper-sr-only** utility class in _base.scss — visually hidden, screen-reader accessible
6. **:focus-visible** on alt-coordinate tabs — visual focus ring (deferred from keyboard-navigation)
