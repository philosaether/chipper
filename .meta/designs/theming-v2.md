---
Status: accepted
Date: 2026-05-29
Accepted: 2026-05-29
Implemented: 2026-05-29 (feature/theming-v2)
Assessment: ../assessments/archive/2026-05-29-theming-engine-v2.md
Supersedes: theming-engine.md (extends, does not invalidate — v1 SASS architecture stays)
Divergences: none
Deferred: sample custom hue on demo page (rolled into demo page v1.0)
---

# Theming Engine v2 — Desired State

Runtime theme switching as a first-class library feature. Introduces the
**hue** as a top-level abstraction for chip color roles, formalizes the
theme shape as a TypeScript type, and ships `applyTheme()` as library
code. Three themes at launch: praxis, midnight, terminal.

The v1 SASS architecture is unchanged — this design adds a JS layer on
top. Static CSS imports continue to work for consumers who don't need
runtime switching.

---

## 1. The Hue

A **hue** is the minimum set of color values needed to fully style a chip
of any domain. It's the TypeScript formalization of what the SASS
`chip-colors()` mixin already generates.

```typescript
interface Hue {
  /** Hue role name — matches the domain's `color` key. */
  readonly name: string;
  /** Dark text color for use on the pastel background. */
  readonly text: string;
  /** Pastel background color. */
  readonly background: string;
  /** Hover background — slightly darker/richer than background. */
  readonly hover: string;
  /**
   * Glow color for expanded/focused state.
   * Defaults to a semi-transparent black (light themes) or a pastel
   * tint (dark themes). Themes that want colored glow set this.
   */
  readonly glow?: string;
}
```

### `createHue` helper

```typescript
function createHue(
  name: string,
  text: string,
  background: string,
  options?: { glow?: string },
): Hue;
```

Auto-computes `hover` by mixing 12% of `text` into `background` — the
same formula the SASS `chip-colors()` mixin uses. Accepts optional `glow`.

```typescript
// Minimal — two colors
createHue('copper', '#8f5a28', '#fde8d4')
// → { name: 'copper', text: '#8f5a28', background: '#fde8d4',
//    hover: '#efd5be', glow: undefined }

// With glow for dark themes
createHue('copper', '#d4a87a', '#2e2418', { glow: 'rgba(212, 168, 122, 0.2)' })
```

The color mixing runs in JS at theme-definition time (not at runtime
during `applyTheme`). Uses a simple sRGB channel mix — no dependency on
a color library. The output is a plain `Hue` object; consumers who want
full control can skip the helper and write the object literal directly.

### Why `glow`?

The v1 expanded-chip state uses `box-shadow: 0 4px 12px rgba(0,0,0,0.12)`
— a neutral drop shadow. This reads well on light backgrounds but
disappears on dark ones. Dark themes need a *colored* glow to make the
elevated surface visible:

- **Praxis**: neutral shadow (default) — black at 12% opacity
- **Midnight**: pastel glow in the chip's hue — e.g., copper chip gets a
  warm amber glow
- **Terminal**: green glow — same green as everything else

Making glow part of the hue (rather than a global theme token) means each
chip's expanded state glows in its own color. This is more expressive
than a single `--chipper-popup-shadow` and eliminates the need for
per-theme shadow hacks.

**CSS token generated:** `--chipper-color-{name}-glow`. The chip wrapper
sets `--chip-trigger-color-glow` alongside the existing three. Components
reference it for expanded/focused shadow.

**Default when omitted:** `rgba(0, 0, 0, 0.12)` — the current shadow.
Theme authors who don't set `glow` get the v1 behavior.

### Hue in SASS

The existing `chip-colors()` mixin extends to accept an optional third
element per role:

```scss
$praxis-palette: (
  "copper": (#8f5a28, #fde8d4),          // text, bg — hover auto-computed
  "sage":   (#2e5a30, #d4edda, #1a3a1a), // text, bg, glow (explicit)
);
```

When the third value is absent, the mixin omits the `-glow` token and
CSS falls back to the default shadow.

---

## 2. The Theme

A **theme** is a complete visual configuration: surface tokens + accent
tokens + semantic tokens + structural tokens + a set of hues.

```typescript
interface ChipperTheme {
  readonly name: string;

  /** Surface colors. */
  readonly surface: {
    readonly bgPrimary: string;
    readonly bgSecondary: string;
    readonly bgTertiary: string;
    readonly bgElevated: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
    readonly textMuted: string;
    readonly border: string;
    readonly borderSubtle: string;
  };

  /** Accent colors — the primary interactive color family. */
  readonly accent: {
    readonly base: string;
    readonly bright: string;
    readonly dim: string;
    readonly glow: string;
  };

  /** Semantic colors. */
  readonly semantic: {
    readonly success: string;
    readonly warning: string;
    readonly error: string;
    readonly info: string;
  };

  /** Structural tokens. */
  readonly structure: {
    readonly radius: string;
    readonly radiusLarge: string;
    readonly font: string;
    readonly fontMono: string;
    readonly focusRing: string;
    readonly popupShadow: string;
    readonly transition: string;
  };

  /** Chip color hues. Keyed by hue role name. */
  readonly hues: Record<string, Hue>;
}
```

### Why a typed object, not `Record<string, string>`?

- **Autocomplete.** Theme authors get IDE guidance on what to provide.
- **Validation.** We can warn at dev time if a required field is missing.
- **Conversion.** A typed object can be mechanically converted to CSS
  custom properties (for `applyTheme`) or to a SASS map (for build-time
  compilation). The typed object is the source of truth; CSS and SASS are
  projections.

### Theme ↔ CSS mapping

Each field maps to exactly one CSS custom property. The mapping is
mechanical:

```
surface.bgPrimary  → --chipper-bg-primary
surface.textMuted  → --chipper-text-muted
accent.base        → --chipper-accent
structure.font     → --chipper-font
hues.copper.text   → --chipper-color-copper-text
hues.copper.glow   → --chipper-color-copper-glow
```

A `themeToProperties(theme: ChipperTheme): Record<string, string>`
utility produces this map. `applyTheme` uses it internally.

---

## 3. Hue mapping — the terminal problem

Praxis and midnight share the same 10 hue role names with different
colors. Terminal has one hue. What happens when a domain declares
`color: 'copper'` and the active theme only has `'terminal-green'`?

### Approach: theme-level hue aliases

A theme declares a **fallback hue** — the hue that any unrecognized role
name resolves to.

```typescript
interface ChipperTheme {
  // ... (fields above)

  /**
   * Fallback hue name. When a domain references a hue role not in this
   * theme's hues map, this hue is used instead. Defaults to the first
   * hue in the hues map — a misconfigured palette gets "wrong color"
   * rather than "no color."
   */
  readonly fallbackHue?: string;
}
```

Terminal's theme definition:

```typescript
const terminalTheme: ChipperTheme = {
  name: 'terminal',
  // ...surface, accent, semantic, structure...
  hues: {
    green: {
      name: 'green',
      text: '#33ff33',
      background: '#0a1a0a',
      hover: '#0f240f',
      glow: 'rgba(51, 255, 51, 0.25)',
    },
  },
  fallbackHue: 'green',
};
```

When `applyTheme` encounters a domain with `color: 'copper'`, it checks
the theme's hues for `'copper'`. Not found → falls back to `'green'`.
The CSS custom properties for `--chipper-color-copper-*` are set to
green's values.

**Why not require all themes to define all 10 roles?**

Because the terminal aesthetic *is* monocolor. Forcing 10 different greens
that are all the same green is worse DX than saying "everything falls
back to green." And custom consumer themes might have their own hue
vocabulary that doesn't match praxis's 10 at all.

**Why not map at the domain level?**

Because the palette is theme-independent. `color: 'copper'` means "this
domain is copper-colored" — it's semantic intent. The theme decides what
copper looks like (warm brown in praxis, desaturated amber in midnight,
green in terminal). The palette shouldn't know which themes exist.

### How fallback works in `applyTheme`

```typescript
function resolveHue(theme: ChipperTheme, roleName: string): Hue {
  const hueNames = Object.keys(theme.hues);
  const fallback = theme.fallbackHue ?? hueNames[0];
  return theme.hues[roleName] ?? theme.hues[fallback];
```

When applying a theme, `applyTheme` needs to know which hue roles are
*in use* so it can set CSS properties for each. Two options:

**Option A: Enumerate from palette definitions.** The consumer passes
their palette (or the set of hue role names used in their palette) to
`applyTheme`. This is explicit but requires the consumer to thread
palette info through to the theme-switching call.

**Option B: Set tokens for all theme hues + clear unknown roles.**
`applyTheme` sets CSS properties for every hue in the theme, and clears
any leftover properties from the previous theme's hues. For missing
roles, the fallback hue's values are applied under the missing role's
token names.

Option B means `applyTheme` sets `--chipper-color-copper-text: #33ff33`
(green) when terminal is active. The chip doesn't know the difference.
This is the simpler path — no palette awareness needed in the theme API.

**The catch with Option B:** `applyTheme` doesn't know which roles exist
in the consumer's palette. If a domain uses `color: 'velocity'` (a custom
role) and the theme doesn't define it, no fallback tokens are set because
`applyTheme` didn't know to generate them.

**Resolution:** Two layers of defense:

1. **`fallbackHue` defaults to the first hue in the theme.** Even if the
   theme author doesn't set it, every unrecognized role resolves to
   *something* — "wrong color" beats "no color."

2. **Optional `hueRoles` array on `applyTheme`.** When provided, the
   function ensures every listed role has tokens set (from theme hues
   or fallback). When omitted, only the theme's own hues get tokens —
   fine when theme and palette agree on role names.

---

## 4. `applyTheme()` — the runtime API

```typescript
function applyTheme(
  theme: ChipperTheme,
  options?: {
    /** DOM element to apply tokens to. Defaults to document.documentElement. */
    container?: HTMLElement;
    /** Hue role names used by the consumer's palette. Enables fallback
        for roles not explicitly defined in the theme. */
    hueRoles?: string[];
    /** Previously applied theme — its tokens are cleared before applying
        the new one. If not provided, all known chipper tokens are cleared. */
    previousTheme?: ChipperTheme;
  },
): void;
```

### Behavior

1. **Clear previous.** Remove inline styles for all tokens belonging to
   `previousTheme` (or all known chipper tokens if not provided).
2. **Apply surface/accent/semantic/structural tokens** from
   `themeToProperties()`.
3. **Apply hue tokens.** For each hue role in the theme's `hues` map,
   set `-text`, `-bg`, `-hover`, and (if present) `-glow` tokens.
4. **Apply fallbacks.** If `hueRoles` is provided, for each role not in
   the theme's `hues`, set that role's tokens to `fallbackHue`'s values.
5. **Set on container.** All operations target `container.style`.

### The praxis special case

Praxis is the SCSS-compiled default theme. When switching *to* praxis,
the correct behavior is to **clear all overrides** — the SCSS cascade
provides praxis values. `applyTheme(praxisTheme)` does this naturally:
praxis's typed values match what SCSS generates, so setting them is
redundant but harmless. But there's a simpler path:

```typescript
function clearTheme(container?: HTMLElement): void;
```

`clearTheme()` removes all chipper inline styles, restoring the SCSS
cascade. `applyTheme(praxisTheme)` and `clearTheme()` produce the same
visual result, but `clearTheme` is cheaper and makes the intent clear.

### Container scoping

`container` defaults to `document.documentElement` (`:root`). Passing a
specific element enables scoped theming — one Chipper instance in praxis,
another in midnight. The CSS custom property cascade handles this
naturally: properties set on a descendant element override `:root` for
that subtree.

We don't need a React provider for this. The consumer wraps their
`<Chipper>` in a `<div ref={...}>` and passes the ref to `applyTheme`.
Framework-agnostic, zero React API surface.

---

## 5. Shipping themes

Three themes ship with the library:

### praxis (default)

Warm parchment surfaces, gold accents, 10 hue roles matching the Praxis
color scheme. Already exists as SCSS (`themes/_praxis.scss`). New: also
ships as a JS object.

### midnight (new)

Cool dark surfaces, blue accents, 10 hue roles (desaturated cool
variants of praxis's hues). Currently exists as a JS object in the demo.
New: also ships as SCSS.

### terminal (new)

Black surfaces, green everything, monospace font, 1 hue role with
`fallbackHue: 'green'`. Currently exists as a JS object in the demo.
New: also ships as SCSS.

### Dual-format export

Each theme ships as:

1. **Compiled CSS** — for static `import 'chipper/themes/midnight.css'`
2. **JS object** — for runtime `import { midnightTheme } from 'chipper/themes'`

The JS object is the source of truth. The SCSS theme file is generated
or hand-maintained to match. (Both are checked in — no build-time
code generation.)

### Package exports

```json
{
  "exports": {
    "./themes/praxis.css": "./dist/themes/praxis.css",
    "./themes/midnight.css": "./dist/themes/midnight.css",
    "./themes/terminal.css": "./dist/themes/terminal.css",
    "./themes": {
      "types": "./dist/themes/index.d.ts",
      "import": "./dist/themes/index.js"
    }
  }
}
```

Consumer usage:

```typescript
// Static (build time) — just CSS, no JS
import 'chipper/styles/base.css';
import 'chipper/themes/midnight.css';

// Runtime (theme switching)
import { applyTheme, midnightTheme, terminalTheme } from 'chipper/themes';
applyTheme(midnightTheme);
```

---

## 6. Changes to existing code

### Chip.tsx

Add `--chip-trigger-color-glow` to the inline style bridge:

```tsx
const chipStyle = {
  '--chip-trigger-color-text': `var(--chipper-color-${domain.color}-text)`,
  '--chip-trigger-color-bg': `var(--chipper-color-${domain.color}-bg)`,
  '--chip-trigger-color-hover': `var(--chipper-color-${domain.color}-hover)`,
  '--chip-trigger-color-glow': `var(--chipper-color-${domain.color}-glow, rgba(0,0,0,0.12))`,
} as React.CSSProperties;
```

### _components.scss

Expanded chip and popup shadow use the glow token:

```scss
.chipper-chip-trigger--expanded {
  box-shadow: 0 4px 12px var(--chip-trigger-color-glow, rgba(0, 0, 0, 0.12)),
              0 1px 3px rgba(0, 0, 0, 0.08);
}
```

The info popup and chip popup share the same glow for visual unity.

### _mixins.scss

`chip-colors` mixin gains optional glow handling:

```scss
@mixin chip-colors($palette) {
  @each $role, $colors in $palette {
    $text: list.nth($colors, 1);
    $bg: list.nth($colors, 2);
    --chipper-color-#{$role}-text: #{$text};
    --chipper-color-#{$role}-bg: #{$bg};
    --chipper-color-#{$role}-hover: #{round-color(color.mix($text, $bg, 12%))};
    @if list.length($colors) >= 3 {
      --chipper-color-#{$role}-glow: #{list.nth($colors, 3)};
    }
  }
}
```

### Demo refactor

`demo/src/App.tsx` drops its local `themeTokens` / `applyTheme` and
imports from `chipper/themes` instead. ~100 lines of demo code replaced
by library imports.

---

## 7. File layout

```
src/
├── themes/
│   ├── index.ts           # Re-exports: ChipperTheme, Hue, createHue,
│   │                      #   applyTheme, clearTheme, praxisTheme,
│   │                      #   midnightTheme, terminalTheme, themeToProperties
│   ├── types.ts           # ChipperTheme, Hue interfaces
│   ├── apply-theme.ts     # applyTheme(), clearTheme(), themeToProperties()
│   ├── praxis.ts          # praxisTheme object
│   ├── midnight.ts        # midnightTheme object
│   └── terminal.ts        # terminalTheme object
├── styles/
│   └── themes/
│       ├── _praxis.scss   # (existing) praxis SCSS
│       ├── _midnight.scss # (new) midnight SCSS
│       └── _terminal.scss # (new) terminal SCSS
```

---

## Tradeoffs

### Typed theme object vs CSS-only themes

**Chosen:** Typed TypeScript objects as source of truth, CSS as projection.

**Alternative:** Keep themes as CSS-only (SCSS files), no JS type.
Rejected because runtime switching requires JS anyway — the demo already
proved this. Typed objects give autocomplete, validation, and a single
source of truth. CSS files are still compiled from SCSS for static
consumers.

**Revisit if:** We find that maintaining both TS objects and SCSS files
for the same theme is burdensome. Could automate TS → SCSS generation.

### Fallback hue vs mandatory role set

**Chosen:** `fallbackHue` on the theme, with optional `hueRoles` in
`applyTheme` for explicit coverage.

**Alternative:** Require every theme to define every hue role used by any
palette. Rejected because it forces monocolor themes (terminal) to
declare 10 identical entries and couples theme definition to palette
definition.

**Alternative:** Hue aliases in the theme (`{ copper: 'green' }`).
More explicit than fallback but more verbose. Could be added later
as a refinement — aliases and fallback aren't mutually exclusive.

### Glow as hue field vs global theme token

**Chosen:** `glow` as an optional field on Hue.

**Alternative:** Single `--chipper-popup-shadow` token on the theme.
Rejected because different chips should glow in their own color on
dark themes. A global shadow can't do per-chip coloring.

**Alternative:** `glow` as a required field. Rejected because light
themes don't need it — the neutral default is fine for praxis. Making
it optional means theme authors only think about it when they need to.

### React provider vs imperative function

**Chosen:** Imperative `applyTheme()` with optional container element.

**Alternative:** `<ChipperThemeProvider theme={...}>` React context.
Rejected because: (a) adds React API surface for a CSS-only operation,
(b) doesn't help with the actual mechanism (still sets CSS custom
properties), (c) scoped theming works with container refs without a
provider. The theming API should be framework-agnostic.

**Revisit if:** Consumers strongly expect a React-idiomatic API, or
if scoped theming becomes common enough to warrant syntactic sugar.

### SCSS as source of truth vs TS as source of truth

**Chosen:** TS objects are source of truth, SCSS matches.

**Alternative:** SCSS is source of truth, TS objects derived. Rejected
because the TS type is the API contract — it's what consumers interact
with in code. SCSS is a build artifact. Having the type define the shape
and the SCSS follow is the cleaner dependency direction.

---

## Resolved Questions

1. **`applyTheme` location.** `applyTheme()` and `clearTheme()` live in
   `chipper/themes` only. `ChipperTheme` and `Hue` *types* are
   re-exported from the main `chipper` entry point so consumers can
   type-check palette/theme compatibility at build time without importing
   the runtime code.

2. **Ship `createHue` helper.** `createHue(name, text, bg)` auto-computes
   hover (12% text mixed into bg, matching the SASS mixin) and accepts
   optional glow. Theme authors can still specify all values manually,
   but the helper makes the common case trivial — define a hue with two
   colors.

3. **All three themes ship as SCSS at launch.** Midnight and terminal
   SCSS files serve double duty as documentation — clear examples of how
   to build a custom theme without the `applyTheme` function.

4. **Font boundary is correct.** `--chipper-font` controls Chipper
   components only. Terminal's monospace override creates a Chipper-scoped
   visual island; the consumer applies matching page-level font changes
   in their own `onChange` callback. Separate concerns.

## Open Questions

1. **TS ↔ SCSS maintenance burden.** Each theme exists as both a TS
   object and an SCSS file. They must stay in sync. Is a manual "update
   both" convention sufficient, or do we need a build-time check that
   the TS object and SCSS output produce identical CSS custom properties?

## Out of Scope

- **Dark mode as a concept.** Midnight and terminal happen to be dark, but
  there's no prefers-color-scheme integration. The consumer chooses the
  theme. Media-query-based auto-switching is a consumer-side concern.
- **Theme validation CLI.** "Does my theme cover all required fields?"
  TypeScript's type system handles this at compile time.
- **Theme editor UI.** Sliders/pickers for building themes interactively.
- **Additional themes beyond the initial three.** "Taxes" (institutional)
  and fun themes are post-release.
- **Scoped theming React provider.** Container refs are sufficient.
