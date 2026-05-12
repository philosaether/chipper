---
Status: accepted
Date: 2026-05-12
Accepted: 2026-05-12
Assessment: ../assessments/theming-engine.md
---

# Chipper Theming Engine — Desired State

A SASS-based theming system that cleanly separates structural layout from visual presentation, defines a token contract that any theme must fulfill, and ships praxis-theme as the first (and default) concrete theme. Consumers can fork an existing theme, customize tokens, or build from scratch — all without touching library internals.

This design updates architecture doc §7 (Styling), which currently describes a single-theme model with CSS custom properties. The custom property contract remains the public theming API; SASS is the authoring layer that produces it.

---

## 1. SASS File Architecture

```
src/styles/
├── chipper.scss                # Entry: base + components + default theme
├── _base.scss                  # Structural only: layout, display, position
├── _tokens.scss                # Token contract: custom property declarations with fallbacks
├── _mixins.scss                # Shared SASS patterns (chip-color pairs, focus rings)
├── _components.scss            # BEM component rules referencing tokens
└── themes/
    ├── _praxis.scss            # Praxis theme: all token values
    └── (future: _terminal.scss, _taxes.scss, etc.)
```

### Responsibilities

**`_base.scss`** — Pure structure. Flexbox layout, positioning, display modes, z-index stacking. No colors, no borders, no shadows, no transitions. A consumer loading only `_base.scss` gets a functional but visually bare Chipper. This file should rarely change once stable.

**`_tokens.scss`** — The token contract. Declares every CSS custom property Chipper uses, grouped by category, with sensible fallback values. This is the API documentation for theme authors: "provide these, and Chipper looks correct." Fallbacks are deliberately neutral (gray-ish) so an incomplete theme degrades visibly but not brokenly.

**`_mixins.scss`** — DRY helpers. A `chip-color` mixin that takes a hue role name and generates the `--chip-color-{name}-text` and `--chip-color-{name}-bg` pair. A `focus-ring` mixin. A `transition-set` mixin. Keeps `_components.scss` and theme files lean.

**`_components.scss`** — BEM component styles that reference tokens via `var()`. All visual rules live here: colors, borders, border-radius, shadows, transitions, opacity. This is the bridge between structure and theme — it says "the chip trigger has a border" but the *color* of that border comes from a token.

**`themes/_praxis.scss`** — Sets every token to a concrete value from the Praxis color scheme. This is the reference theme implementation. Any new theme can be written by copying this file and changing values.

**`chipper.scss`** — The compiled entry point. Imports in order: tokens (with fallbacks), base, components, praxis theme. Produces a single CSS file that works out of the box.

### Why one compiled file (not partials-as-exports)

Consumers import one CSS file: `import 'chipper/styles.css'`. They don't need to understand the internal SASS structure. Theme swapping happens by importing a different compiled file (`chipper/themes/praxis.css` vs `chipper/themes/terminal.css`), not by mixing and matching partials.

For consumers who use SASS themselves and want deeper control, the partials are available via the package's `src/` directory — but this is a power-user escape hatch, not the primary API.

---

## 2. Token Contract

Every CSS custom property that Chipper references, organized by category. Theme authors must provide values for all of these. `_tokens.scss` declares them with neutral fallbacks; themes override them.

### Surface Tokens

```scss
--chipper-bg-primary       // Page/container background
--chipper-bg-secondary     // Content areas, cards
--chipper-bg-tertiary      // Hover states, metadata
--chipper-bg-elevated      // Floating elements (popups, tooltips)
--chipper-text-primary     // Body text
--chipper-text-secondary   // Supporting text, labels
--chipper-text-muted       // Placeholders, disabled states
--chipper-border           // Visible borders
--chipper-border-subtle    // Ghost borders, dividers
```

### Accent Tokens

```scss
--chipper-accent           // Primary interactive color (text, icons)
--chipper-accent-bright    // Button fills, CTAs
--chipper-accent-dim       // Hover/pressed states
--chipper-accent-glow      // Selection highlights, focus backgrounds
```

### Semantic Tokens

```scss
--chipper-success          // Positive/valid states
--chipper-warning          // Attention needed
--chipper-error            // Invalid/destructive states
--chipper-info             // Informational
```

### Chip Color Tokens

Each chip color is a **pair**: text color + background color. This matches the Praxis color scheme's classification palette where each hue role has both.

```scss
// Per hue role — text + bg pair
--chipper-color-{role}-text
--chipper-color-{role}-bg
```

The built-in hue roles for praxis-theme: `gold`, `plum`, `copper`, `sage`, `slate`, `stone`, `teal`, `rose`, `umber`. Other themes define their own roles — the token names are open-ended.

**How chip → color mapping works:**

1. Domain definition declares `color: 'copper'` (a hue role name)
2. Chip component sets inline style: `--chip-trigger-color-text: var(--chipper-color-copper-text); --chip-trigger-color-bg: var(--chipper-color-copper-bg)`
3. `_components.scss` references `var(--chip-trigger-color-text)` and `var(--chip-trigger-color-bg)` for borders, backgrounds, etc.

This is the same indirection pattern the current CSS uses (one level of `var(--chip-trigger-color)`), extended to carry both text and background.

### Structural Tokens

```scss
--chipper-radius           // Border radius
--chipper-radius-lg        // Popup border radius
--chipper-font             // Font family (default: inherit)
--chipper-font-mono        // Monospace font (for debug/inspector)
--chipper-focus-ring       // Focus ring style (box-shadow value)
--chipper-popup-shadow     // Popup drop shadow
--chipper-transition       // Default transition duration
```

### Token Naming Convention

All tokens prefixed `--chipper-` (not `--chip-`). Consistent with BEM class prefix. The current `--chip-*` names are a holdover from the prototype — this is a clean break.

---

## 3. The `chip-color` Mixin

The core DRY mechanism. Themes declare hue roles using a SASS map, and a mixin generates the CSS custom properties.

```scss
// In _mixins.scss
@use 'sass:color';

@mixin chip-colors($palette) {
  @each $role, $colors in $palette {
    $text: nth($colors, 1);
    $bg: nth($colors, 2);
    --chipper-color-#{$role}-text: #{$text};
    --chipper-color-#{$role}-bg: #{$bg};
    --chipper-color-#{$role}-hover: #{color.mix($text, $bg, 12%)};
  }
}
```

```scss
// In themes/_praxis.scss
@use '../mixins' as *;

$praxis-palette: (
  gold:   (#8a5a00, #ffecd0),
  plum:   (#5c3d7a, #e8daef),
  copper: (#b87333, #fde8d4),
  sage:   (#2e5a30, #d4edda),
  slate:  (#2a5082, #d6e5f5),
  stone:  (#6b5e4f, #e8e4dc),
  teal:   (#2a7d75, #d6f0ee),
  rose:   (#994d5a, #f5dfe0),
  umber:  (#7d6b3a, #f5ecd6),
);

:root {
  // Surface
  --chipper-bg-primary: #fbf9f5;
  --chipper-bg-secondary: #f5f3ef;
  --chipper-bg-tertiary: #ebe8e2;
  --chipper-bg-elevated: #ffffff;
  --chipper-text-primary: #1b1c1a;
  --chipper-text-secondary: #4a4a48;
  --chipper-text-muted: #7a7976;
  --chipper-border: #d0c5af;
  --chipper-border-subtle: rgba(208, 197, 175, 0.4);

  // Accent (gold)
  --chipper-accent: #735c00;
  --chipper-accent-bright: #d4af37;
  --chipper-accent-dim: #5a4700;
  --chipper-accent-glow: #f7e1a6;

  // Semantic
  --chipper-success: #2e7d32;
  --chipper-warning: #f57c00;
  --chipper-error: #8c0d27;
  --chipper-info: #1565c0;

  // Classification
  @include chip-colors($praxis-palette);

  // Structural
  --chipper-radius: 4px;
  --chipper-radius-lg: 6px;
  --chipper-font: inherit;
  --chipper-font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace;
  --chipper-focus-ring: 0 0 0 2px rgba(115, 92, 0, 0.3);
  --chipper-popup-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --chipper-transition: 0.15s;
}
```

Note the focus ring uses the accent color (gold) — each theme defines its own focus ring to match its accent system.

---

## 4. Component Styles: What Changes

The refactor splits current `chipper.css` into `_base.scss` + `_components.scss`. Here's what goes where and what's new.

### Chip trigger (enhanced from current)

Current state: subtle border, minimal hover. Target: the chip should feel like a tappable surface with clear color identity.

```scss
// _components.scss
.chipper-chip-trigger {
  border: 1px solid var(--chipper-border-subtle);
  border-radius: var(--chipper-radius);
  background: var(--chipper-bg-secondary);
  color: var(--chipper-text-primary);
  font-family: var(--chipper-font);
  font-size: inherit;
  cursor: pointer;
  transition: border-color var(--chipper-transition),
              background-color var(--chipper-transition),
              box-shadow var(--chipper-transition);

  // When chip has a value (not placeholder), show its color
  &:not(.chipper-chip-trigger--placeholder) {
    border-color: var(--chip-trigger-color-text, var(--chipper-border));
    background: var(--chip-trigger-color-bg, var(--chipper-bg-secondary));
    color: var(--chip-trigger-color-text, var(--chipper-text-primary));
  }

  // Hover uses pre-computed token — no runtime color-mix()
  &:hover {
    border-color: var(--chip-trigger-color-text, var(--chipper-border));
    background: var(--chip-trigger-color-hover, var(--chipper-bg-tertiary));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  &--placeholder {
    border-style: dashed;
    color: var(--chipper-text-muted);
  }

  &--expanded {
    border-color: var(--chip-trigger-color-text, var(--chipper-accent));
    box-shadow: 0 0 0 1px var(--chip-trigger-color-text, var(--chipper-accent));
  }
}
```

This is the biggest visual change: chips with values get their classification color as background tint + text color, matching the Praxis color scheme's "pastel background with dark text" pattern. Placeholder chips get a dashed border to clearly signal "needs input."

### Popup (enhanced)

```scss
.chipper-popup {
  background: var(--chipper-bg-elevated);
  border: 1px solid var(--chipper-border);
  border-radius: var(--chipper-radius-lg);
  box-shadow: var(--chipper-popup-shadow);
}

.chipper-enum-popup__option {
  border-radius: var(--chipper-radius);
  color: var(--chipper-text-primary);

  &:hover {
    background: var(--chipper-bg-tertiary);
  }

  &--selected {
    background: var(--chipper-accent-glow);
    color: var(--chipper-accent);
    font-weight: 500;
  }
}
```

Selected option uses the accent glow — gold highlight in praxis-theme. Clearer than the current "slightly darker gray" treatment.

### Clause text

```scss
.chipper-clause__text {
  color: var(--chipper-text-primary);
}

.chipper-clause__placeholder {
  color: var(--chipper-text-muted);
  font-style: italic;
}

.chipper-clause__toggle {
  color: var(--chipper-text-muted);

  &:hover {
    color: var(--chipper-accent);
  }
}
```

---

## 5. Chip Component Change

The `Chip.tsx` inline style needs to bridge from hue role to the color pair. Small change:

```tsx
// Current
const triggerStyle = {
  '--chip-trigger-color': `var(--chip-color-${domain.color})`,
} as React.CSSProperties;

// New
const triggerStyle = {
  '--chip-trigger-color-text': `var(--chipper-color-${domain.color}-text)`,
  '--chip-trigger-color-bg': `var(--chipper-color-${domain.color}-bg)`,
  '--chip-trigger-color-hover': `var(--chipper-color-${domain.color}-hover)`,
} as React.CSSProperties;
```

One variable becomes two. Everything else stays the same — the indirection pattern is unchanged.

---

## 6. Build Pipeline Changes

### Add SASS

```bash
npm install -D sass
```

Vite handles SCSS natively when `sass` is installed — no config changes needed for the dev server. Rename `chipper.css` → `chipper.scss` and Vite picks it up.

### Library build: emit CSS

Current `vite.config.ts` only builds JS entry points. We need the CSS in `dist/`. Two options:

Vite library mode concatenates all CSS into one file — can't produce separate base + theme outputs. Using the **`sass` CLI** for CSS compilation, Vite for JS only.

Build script:

```json
"build": "tsc -p tsconfig.build.json && vite build && npm run build:css",
"build:css": "sass --style=compressed --no-source-map src/styles/chipper.scss:dist/styles.css src/styles/base.scss:dist/base.css src/styles/themes/praxis.scss:dist/themes/praxis.css"
```

Vite config unchanged — still only builds JS entry points. CSS is a fully separate compilation step with explicit per-file control.

### Demo alias update

```ts
// demo/vite.config.ts
alias: {
  'chipper/styles.css': resolve(__dirname, '../src/styles/chipper.scss'),
  'chipper': resolve(__dirname, '../src/index.ts'),
},
```

Just `.css` → `.scss` in the alias. Demo `import 'chipper/styles.css'` continues to work.

---

## 7. Package Exports

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./headless": { "types": "./dist/headless.d.ts", "import": "./dist/headless.js" },
    "./styles.css": "./dist/styles.css",
    "./styles/base.css": "./dist/base.css",
    "./themes/praxis.css": "./dist/themes/praxis.css"
  }
}
```

Three CSS exports from day one:
- **`styles.css`** — batteries-included: base + components + praxis theme. The default import.
- **`styles/base.css`** — base + components, no theme. For consumers providing their own.
- **`themes/praxis.css`** — theme only. Import alongside `base.css` for explicit theme selection.

```tsx
// Simple: just works
import 'chipper/styles.css';

// Explicit: pick your theme
import 'chipper/styles/base.css';
import 'chipper/themes/praxis.css';

// Custom: provide your own theme
import 'chipper/styles/base.css';
import './my-custom-theme.css';
```

New themes get new exports as they're added. `styles.css` always bundles praxis as the default.

---

## 8. Demo Page Updates

`demo/src/demo.css` currently hardcodes colors that duplicate praxis-theme values. After the theming engine ships:

- Replace hardcoded surface colors with token references (`var(--chipper-bg-primary)`, etc.)
- Keep demo-specific layout rules (`.demo-page` max-width, `.demo-section` margins)
- Remove `--chip-color-month` from demo.css — it moves to the demo palette's domain definition, which references a hue role that the theme provides
- The demo page itself becomes a showcase of praxis-theme in action

---

## Tradeoffs

### SASS vs CSS-only with custom properties
Could stay pure CSS and just reorganize into multiple `.css` files with `@import`. Rejected because: no variables with computation, no mixins (the `chip-color` pattern would require manual repetition for every hue role), no partials with proper scoping. SASS is the industry-standard preprocessor, adds a single devDependency, and Vite handles it natively. Would revisit if targeting zero-build-tool consumers — but Chipper already requires a bundler (React library).

### Token prefix: `--chipper-` vs `--chip-`
Current code uses `--chip-`. Changing to `--chipper-` for consistency with BEM class prefix and to reduce collision risk (`--chip-` is generic enough to collide with other libraries). This is a breaking change for anyone overriding the current tokens — acceptable because there are no external consumers yet.

### Compiled theme files vs SASS-only themes
Themes could be shipped only as `.scss` partials, requiring consumers to have SASS. Rejected — we compile themes to CSS so consumers who use plain CSS, PostCSS, or any other toolchain can use them. SASS source is available for power users.

### One CSS file vs base + theme split
**Decision: ship the split from day one.** Multiple themes are planned before v1.0 — praxis (warm parchment), a minimal business theme (working name "taxes" — the IRS aesthetic), and a fun theme (terminal/duplo/brick TBD). The demo page will use a Chipper keyword chip to toggle between themes live, which is the best possible showcase. Given this roadmap, building the split now avoids a breaking export change later, and the internal SASS structure already supports it. Cost is minimal — it's just which entry points we compile.

### Chip trigger styling: border-only vs pastel fill
Current chips show color only as a border accent. The Praxis color scheme defines pastel backgrounds for each classification. Going with pastel fill for valued chips (matching the color scheme's "pastel backgrounds with dark text" principle). Placeholder chips get dashed border only — clear visual distinction between "configured" and "needs input."

## Open Questions

1. **CSS-as-entry in Vite library mode.** — RESOLVED. Tested: Vite does emit CSS from SCSS entries, but concatenates all CSS into a single output file. We can't get separate `base.css` + `themes/praxis.css` from one Vite build. **Decision: use the `sass` CLI for CSS compilation, keep Vite for JS only.** Build script becomes: `tsc && vite build && sass src/styles/chipper.scss:dist/styles.css src/styles/base.scss:dist/base.css src/styles/themes/praxis.scss:dist/themes/praxis.css`. Clean, explicit, fully controlled per-file output.

2. **`color-mix()` and legacy browser support.** — RESOLVED. Target audience includes legacy bureaucratic web apps that may not support `color-mix()` (baseline 2023). **Decision: pre-compute all derived colors as theme tokens using SASS `mix()` at compile time.** Each theme emits explicit hover/active variant tokens (e.g., `--chipper-chip-hover-bg`) rather than computing them at runtime. Components reference these pre-computed tokens. Zero runtime CSS features required — just custom properties, which work back to Edge 15 (2017). More tokens to document, but: (a) works everywhere, (b) more themeable since consumers control every derived color, (c) theme files are where SASS computation happens, compiled CSS is dead simple. Consumers who override tokens also provide hover variants — explicit over magical.

3. **Demo palette domain `color` value.** — RESOLVED. Month domain will use `color: 'copper'` (temporal concepts, Fascination archetype). Demo removes its custom `--chip-color-month` token.

## Out of Scope

- **Dark mode.** The token system supports it naturally (just a second set of values), but building a dark praxis-theme is a separate effort. The color scheme doc explicitly defers it.
- **Runtime theme switching via JS.** Themes are CSS files. Switching themes means swapping which CSS file is loaded. No JS theme-provider component needed.
- **Theme validation tooling.** A CLI that checks whether a theme provides all required tokens would be nice eventually. Not needed for the first theme.
- **Typography scale.** The token contract includes `--chipper-font` and `--chipper-font-mono` but not a full type scale (sizes, weights, line heights). Chipper inherits most typography from the consumer's page. If this proves insufficient, it's a follow-up.
- **Architecture doc §7 update.** Should be updated to reflect multi-theme support, but that's a documentation task after implementation, not part of this design.
