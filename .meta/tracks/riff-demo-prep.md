# riff/demo-prep

Pre-release riff sweep: readonly + live chip modes, screen reader support, demo import/export, builder DX wishlist.

Started: 2026-05-28

---

## Note 1: Readonly chip mode

Three changes to make readonly chips fully correct:

**Chip.tsx** — When `mode.type !== 'interactive'`:
- Render a `<span>` instead of `<button>` (or `<span role="text">`) — readonly chips aren't interactive, shouldn't be tab stops or announce as buttons
- Drop `aria-expanded` and `aria-haspopup` attributes
- Skip popup mount entirely (already guarded by `isInteractive` in click handler, but `showPopup` check should also gate on `isInteractive`)

**CSS** — Current `--readonly` styles (transparent border, opacity 0.7, cursor default) look right. No changes needed.

**Exports** — Export `ChipMode` from `src/index.ts` so consumers can type their mode configs.

**Demo** — Add a readonly chip to an existing demo sentence. The task sentence is a natural fit: "create a task named [task name] **in [project]**" where project is a readonly keyword chip showing a fixed value. Shows the visual difference inline with interactive chips.
