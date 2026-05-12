# Assessment: Chipper Theming Engine
Date: 2026-05-12
Branch: feature/styling-pass

## Current State

**One flat CSS file** at `src/styles/chipper.css` (195 lines). It combines structural layout (flexbox, positioning, display modes) and visual theming (colors, borders, radii, shadows) in a single file. BEM naming with `chipper-` prefix throughout.

**Design tokens** defined as CSS custom properties on `:root`:
- 9 chip color tokens (`--chip-color-interval`, etc.) — semantic, keyed by domain color name
- 6 structural tokens (`--chip-bg`, `--chip-border`, `--chip-text`, `--chip-popup-bg`, `--chip-radius`, `--chip-font`)
- 1 composite token (`--chip-focus-ring`)

**No SASS anywhere.** Zero `.scss` files. Build pipeline is pure Vite + TypeScript — no CSS preprocessor configured.

**CSS not in dist/.** `package.json` exports `./styles.css` → `dist/styles.css`, but the Vite build config doesn't produce it. The demo works because Vite's dev server resolves the import at dev time, and demo has its own pre-built dist. This is a build gap that needs fixing regardless of theming work.

**Demo page** (`demo/src/demo.css`, 125 lines) has its own standalone styles. Hardcodes colors that overlap with the Praxis palette (`#faf9f6`, `#1b1c1a`, `#f5f3ef`). Defines one custom chip color (`--chip-color-month: #8b7dc8`).

**Architecture doc §7** specifies the theming contract: CSS custom properties are the theming surface. Domain `color` field is a key that maps to `--chip-color-{key}`. Consumers override properties on their container. The doc envisions `chipper/styles.css` as a single shipped file — it doesn't describe a multi-theme system.

## What's Working

- BEM naming convention is clean and consistent
- The CSS custom property pattern for chip colors works — the demo proves the override flow (`--chip-color-month` defined in demo.css, consumed by library CSS via `var(--chip-trigger-color)`)
- Component inline style bridge works: components set `--chip-trigger-color` via `style` attribute, CSS references it
- Layout and positioning logic is solid (flex, baseline alignment, popup anchoring)
- The 195-line file is small enough to refactor without archaeology

## Gaps

### 1. No separation of structure from theme
Everything lives in one file. A consumer who wants to restyle Chipper must either override every custom property (tedious) or fork the whole CSS file (brittle). There's no clean boundary between "layout that makes Chipper work" and "visual choices that make it look like X."

### 2. No SASS infrastructure
The codebase has no `.scss` files, no SASS compiler in the build. Adding SASS gives us: variables with computation, mixins for DRY patterns, partials for organization, and `@use`/`@forward` for clean module boundaries. All prerequisites for a real theming engine.

### 3. No theme abstraction
The architecture doc treats the shipped CSS as "the" theme. There's no concept of swappable themes. No mechanism for a consumer to import `chipper/themes/praxis` vs `chipper/themes/terminal`. No token contract that defines "what a theme must provide."

### 4. Incomplete token set
Current tokens cover chip colors and basic structural values. Missing from the Praxis color scheme (inbox/color-scheme.md):
- Surface palette (bg-primary through bg-elevated, text tiers, border tiers)
- Accent palette (accent, accent-bright, accent-dim, accent-glow)
- Semantic palette (success, warning, error, info)
- Classification palette (the 9 hue roles with text + background pairs)
- Typography tokens (font families, sizes, weights)
- Spacing tokens
- Transition/animation tokens

### 5. CSS build gap
`dist/styles.css` is never generated. This needs to be fixed as part of adding SASS compilation.

### 6. Demo page duplicates library-level visual choices
`demo.css` hardcodes surface colors (`#faf9f6`, `#f5f3ef`, `#e5e0d5`) that should come from the theme. Once themes exist, the demo should import praxis-theme and derive its look from that.

## External Input

### inbox/color-scheme.md (Praxis Color Scheme — Desired State)
Comprehensive palette designed for Praxis. Directly usable as `praxis-theme`:
- **Surface palette** (4 backgrounds, 3 text tiers, 2 border tiers) — warm parchment aesthetic
- **Accent palette** (4 gold variants) — emphasis, selection, action
- **Semantic palette** (4 status colors) — success/warning/error/info
- **Classification palette** (9 hue roles) — each with text color + pastel background. Maps directly to chip colors. Role names: gold, plum, copper, sage, slate, stone, teal, rose, umber
- Includes SCSS map examples showing `$palette`, `$type-colors`, `$chip-colors` structure

The color scheme's classification roles map 1:1 to Chipper's chip color system. The domain `color` key (`interval`, `day`, etc.) is a Praxis-level alias; the theme-level role (`copper`, `sage`, etc.) is the actual color. This means the theme needs to bridge from hue role → chip color token.

### Architecture doc §7
Confirms CSS custom properties as the theming surface. Per-domain color via inline `--chip-trigger-color`. No CSS-in-JS. BEM class names are the styling API.

### inbox/Screenshot (vertical slice)
Current state: functional layout, minimal styling. Chips have subtle borders, clean typography, warm background. The bones are good — needs the full Praxis palette applied, richer chip trigger styling, and popup polish.

## Recommended Next Steps

1. **Add SASS to the build pipeline.** Install `sass` as devDependency. Configure Vite to compile `.scss` → `.css`. Ensure `dist/styles.css` is produced by the library build.

2. **Design the SASS architecture.** Proposed structure:
   ```
   src/styles/
   ├── chipper.scss              # Entry point — imports base + default theme
   ├── _base.scss                # Structural CSS only (layout, display, position)
   ├── _tokens.scss              # Token contract: the full list of custom properties a theme must define
   ├── _components.scss          # BEM component styles that reference tokens
   └── themes/
       ├── _praxis.scss          # Praxis theme: sets all token values
       └── (future: _terminal.scss, _taxes.scss)
   ```
   The entry point `chipper.scss` composes `_base` + `_tokens` + `_components` + a default theme (praxis for now). Consumers who want a different theme import `chipper/styles/base` + their theme instead.

3. **Define the token contract.** Every CSS custom property that a theme sets, documented as a SASS map or list. This is the API surface — if a theme provides all these tokens, Chipper looks correct. Missing tokens fall back to sensible defaults.

4. **Build praxis-theme.** Translate `inbox/color-scheme.md` into `_praxis.scss`. Map the 9 hue roles to chip color tokens. Set surface/accent/semantic tokens. This becomes the reference theme and the default.

5. **Refactor existing CSS.** Split `chipper.css` into the new SASS partials. Structural rules (flex, position, display) go to `_base.scss`. Visual rules (colors, borders, shadows, transitions) go to `_components.scss` referencing tokens. Current hardcoded values become token references.

6. **Update demo page.** Replace hardcoded demo.css colors with theme token references where appropriate. Demo-specific layout stays in demo.css; visual theming comes from the imported theme.

7. **Update package.json exports.** Consider whether to export individual themes:
   ```json
   "./styles.css": "./dist/chipper.css",
   "./themes/praxis.css": "./dist/themes/praxis.css"
   ```

8. **Update architecture doc §7.** Reflect the multi-theme system — the current doc describes a single-theme model.
