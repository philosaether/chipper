---
Status: accepted
Date: 2026-05-13
Accepted: 2026-05-13
Implemented: 2026-05-13 (feature/visual-polish)
Divergences: contrast values slightly lighter than proposed (within SII iteration envelope); SII fixes added post-design (KOE auto-save, numeric Enter, multiselect grid, inline prefix, slot borders)
Deferred: none
Assessment: assessments/visual-polish-and-layout.md
---

# Visual Polish Pass — Desired State

Tighten Chipper's visual presentation: popup density, typography tokens,
WCAG contrast compliance, popup caret, and a multi-font demo page that
stress-tests the library across different website aesthetics.

---

## 1. Popup Layout — Flex-Wrap for All Popup Types

### Current
Enum popup: `flex-direction: column` → one pill per row, towering list
for 12+ items. KOE/multi-select keywords already use flex-wrap.

### Change

Remove `flex-direction: column` from `.chipper-enum-popup`. All popup
types use the same flex-wrap flow — pills wrap horizontally. Add
`max-width` token to prevent popups from sprawling.

**`_base.scss` changes:**
```scss
.chipper-enum-popup {
  display: flex;
  flex-wrap: wrap;        // was flex-direction: column
  gap: 0.375rem;          // was 0.125rem
  min-width: 12rem;       // was 8rem
}
```

**`_tokens.scss` new token:**
```scss
--chipper-popup-max-width: 20rem;   // ~320px at 16px base
```

**`_base.scss` popup container:**
```scss
.chipper-popup {
  max-width: var(--chipper-popup-max-width);
}
```

Measured in rem so it scales with the consumer's font size. Starting
from `20rem` — wider than Praxis's `200px` min, narrow enough to
prevent full-viewport sprawl. We'll iterate visually.

---

## 2. Popup Font-Size Token

### Change

Add `--chipper-popup-font-size` token. Set on `.chipper-popup` so it
cascades to all popup content.

**`_tokens.scss`:**
```scss
--chipper-popup-font-size: 0.875rem;
```

**`_components.scss`:**
```scss
.chipper-popup {
  font-size: var(--chipper-popup-font-size);
}
```

Pills, inputs, tabs, and stepper buttons all inherit from the popup
container. No per-element font-size overrides needed.

---

## 3. Popup Pill Min-Height (WCAG AA Target Size)

WCAG 2.1 SC 2.5.8 requires 24×24px minimum target size for interactive
elements. Popup pills at `0.875rem` font with `0.25rem` vertical
padding can dip under 24px.

**`_base.scss`:**
```scss
.chipper-popup-option {
  min-height: 1.5rem;     // 24px at 16px base
}
```

Also apply to `.chipper-numeric-input__button` (stepper +/− buttons)
and `.chipper-alt-coord-popup__tab`.

---

## 4. Popup Caret

Add a CSS triangle connecting the popup to its trigger chip. Pure CSS,
no DOM changes.

**`_base.scss`:**
```scss
.chipper-popup::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 1rem;
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
}
```

**`_components.scss`:**
```scss
.chipper-popup::before {
  background: var(--chipper-bg-elevated);
  border-left: 1px solid var(--chipper-border);
  border-top: 1px solid var(--chipper-border);
}
```

The caret inherits popup background and border colors from tokens. No
new tokens needed.

---

## 5. Contrast Audit — Praxis Theme

Computed WCAG contrast ratios for text-on-background per hue role:

| Hue Role | Text | BG | Ratio | AA Text (4.5:1) | AA Non-Text (3:1) |
|----------|------|----|-------|-----------------|-------------------|
| gold | #8a5a00 | #ffecd0 | 5.13:1 | PASS | PASS |
| plum | #5c3d7a | #e8daef | 6.53:1 | PASS | PASS |
| **copper** | **#b87333** | **#fde8d4** | **3.19:1** | **FAIL** | PASS |
| sage | #2e5a30 | #d4edda | 6.46:1 | PASS | PASS |
| slate | #2a5082 | #d6e5f5 | 6.38:1 | PASS | PASS |
| stone | #6b5e4f | #e8e4dc | 4.96:1 | PASS | PASS |
| **teal** | **#2a7d75** | **#d6f0ee** | **4.09:1** | **FAIL** | PASS |
| rose | #994d5a | #f5dfe0 | 4.63:1 | PASS | PASS |
| **umber** | **#7d6b3a** | **#f5ecd6** | **4.42:1** | **FAIL** | PASS |

Also failing: `--chipper-text-muted` (#7a7976) on `--chipper-bg-primary`
(#fbf9f5) = 4.14:1 — fails AA text contrast.

### Fixes

Darken the three failing text colors to reach 4.5:1. Keep backgrounds
unchanged (they define the visual identity). Darken text-muted.

| Token | Current | Proposed | New Ratio |
|-------|---------|----------|-----------|
| copper text | #b87333 | #8f5a28 | ~4.7:1 |
| teal text | #2a7d75 | #1f5f59 | ~5.5:1 |
| umber text | #7d6b3a | #665528 | ~5.7:1 |
| text-muted | #7a7976 | #6b6865 | ~4.9:1 |

Exact values to be verified during SII loop — we'll darken incrementally
until the chip still looks right and passes 4.5:1.

---

## 6. Multi-Font Demo Page

Replace the single-sentence demo with **multiple panels**, each rendering
the same sentence in a different typographic context. This stress-tests
the library's `--chipper-font: inherit` strategy and shows consumers
what Chipper looks like on different kinds of websites.

### Panels

Each panel is a `<div>` with its own font-family, font-size, and a brief
label. All panels share the same `<Chipper>` instance props (same
sentence definition, same palette). Each panel gets its own independent
state.

| Panel | Font | Size | Vibe |
|-------|------|------|------|
| Bookish | `"Newsreader", Georgia, serif` | `1rem` | Praxis aesthetic — the "intended" look |
| Minimalist | `"Inter", -apple-system, sans-serif` | `0.9375rem` | Clean SaaS dashboard |
| Government | `"Times New Roman", serif` | `1rem` | Institutional, dense |
| Startup | `"DM Sans", "Helvetica Neue", sans-serif` | `1.0625rem` | Friendly, rounded |
| Terminal | `"SF Mono", "Fira Code", monospace` | `0.875rem` | Developer tooling |
| Brutalist | `"Arial", sans-serif` | `1.125rem` | No-nonsense, zero style |

Google Fonts link for Newsreader, Inter, and DM Sans in `demo/index.html`.
Terminal and Brutalist use system fonts.

### Panel CSS structure

```scss
.demo-font-panel {
  padding: 1.5rem;
  border: 1px solid var(--chipper-border);
  border-radius: var(--chipper-radius-lg);
  margin-bottom: 1.5rem;
}

.demo-font-panel__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--chipper-text-muted);
  margin-bottom: 0.75rem;
  // Label uses system font, not the panel font
  font-family: -apple-system, sans-serif;
}

.demo-font-panel__sentence {
  font-family: var(--panel-font);
  font-size: var(--panel-size);
  line-height: 2;
}
```

### State inspector

Keep the state inspector below the panels (one shared instance showing
whichever panel was last interacted with, or a collapsible per-panel).
Leaning toward one shared inspector that updates from the most recently
changed panel — simpler and demonstrates that state is independent.
- Agreed

### Sentence max-width

Not set in the library. Each demo panel constrains its own width via
`.demo-font-panel` max-width. The demo page already has
`max-width: 640px` on `.demo-page`.

---

## 7. Implementation Plan

### Files to modify

| File | Change |
|------|--------|
| `src/styles/_tokens.scss` | Add `--chipper-popup-font-size`, `--chipper-popup-max-width` |
| `src/styles/_base.scss` | Popup max-width, enum flex-wrap, pill min-height, caret pseudo-element |
| `src/styles/_components.scss` | Popup font-size, caret colors, remove enum column layout |
| `src/styles/themes/_praxis.scss` | Darken copper/teal/umber text, darken text-muted |
| `demo/src/App.tsx` | Multi-font panel layout |
| `demo/src/demo.css` | Panel styles |
| `demo/index.html` | Google Fonts link |

### Files unchanged
No component or domain logic changes. This is entirely CSS + demo.

---

## Tradeoffs

### Popup max-width: rem vs px

Could use `px` (like Praxis's `200px` min-width) for pixel-perfect
control. Going with `rem` so popups scale proportionally when consumers
change their base font-size. A consumer with `font-size: 20px` gets a
proportionally wider popup, which is the right behavior for a library.

### Enum flex-wrap vs flex-column

Column layout works for 3-5 item enums (priority: low/medium/high).
Flex-wrap is worse for short lists — pills wrap unnecessarily. But
flex-wrap degrades gracefully for long lists, and short-list popups
are narrow enough that pills won't wrap anyway. One layout that works
for all is better than a conditional layout per item count.

### Per-panel state vs shared state in demo

Each panel could share one `SentenceState` (selecting "March" in one
panel shows "March" in all). Going with independent state — it
demonstrates that `<Chipper>` instances are fully isolated, which is a
feature consumers need to understand.

### Contrast fix strategy: darken text vs lighten bg

Could lighten the pastel backgrounds to increase contrast. Darkening
text preserves the pastel visual identity (the backgrounds define the
color) and is a smaller change. If the darkened text looks too heavy,
we revisit.

## Open Questions

### Q1: Panel count

Six panels may be too many for the page. Could trim to 4 (bookish,
minimalist, startup, terminal). Leaning toward shipping all 6 and
pruning during SII if the page feels bloated.
- Demo page is for us, for now -- we'll refine *significantly* before we go live
  - So let's see it all

### Q2: Shared inspector

One inspector for 6 panels means only one panel's state is visible
at a time. Alternative: no inspector (remove it), since the panels
themselves are the demo. The inspector was useful for debugging but
may be noise on a showcase page.
- Keep it for now, for one panel. It's helpful for us

## Out of Scope

- **Multi-line sentence layout** — deferred to TOGGLE_CLAUSE branch
- **Keyboard navigation** (roving tabindex) — separate backlog item
- **Screen reader support** (aria-live, aria-invalid) — separate backlog item
- **Date grid expression mode** — future feature
- **Popup arrow positioning** (tracking which side of the trigger the popup opens on) — the caret uses a fixed `left: 1rem` position, matching Praxis. Dynamic positioning is a future enhancement.
