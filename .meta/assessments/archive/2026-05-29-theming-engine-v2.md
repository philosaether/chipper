# Assessment: Theming Engine v2 — Runtime Theme Switching

Date: 2026-05-29
Branch: main

## Current State

The v1 theming engine shipped 2026-05-12 (feature/styling-pass). It
established a SASS architecture with a clean base/components/theme split:

**Files:**
- `src/styles/_tokens.scss` — token contract (39 lines, neutral fallbacks)
- `src/styles/_base.scss` — structural layout only (323 lines)
- `src/styles/_components.scss` — visual rules referencing tokens (477 lines)
- `src/styles/_mixins.scss` — `chip-colors()` mixin generating -text/-bg/-hover triples
- `src/styles/themes/_praxis.scss` — praxis theme values (49 lines)
- `src/styles/chipper.scss` — batteries-included entry point (tokens + base + components + praxis)
- `src/styles/chipper-base.scss` — themeless entry point (tokens + base + components)
- `src/styles/themes/praxis-theme.scss` — standalone praxis theme entry point

**Build:** `sass` CLI compiles three outputs: `dist/styles.css` (bundled),
`dist/base.css` (themeless), `dist/themes/praxis.css` (standalone theme).

**Package exports:** Three CSS paths in `package.json` — `./styles.css`,
`./styles/base.css`, `./themes/praxis.css`.

**JS surface:** Zero. No theme-related TypeScript code in the library.
`Chip.tsx` bridges domain color keys to theme tokens via inline CSS
variables (`--chip-trigger-color-{text,bg,hover}`), but this is a
color-mapping concern, not a theming API.

**Token coverage:** 10 chip color roles (gold, plum, copper, sage, slate,
stone, teal, rose, umber, indigo), ~20 surface/accent/semantic/structural
tokens. All pre-computed at SASS compile time — no runtime CSS functions.

## What's Working

1. **Token contract is complete.** Every visual property in `_components.scss`
   references a token. Theme authors only need to provide token values.

2. **Base/theme split works.** `chipper-base.scss` + a standalone theme file
   is a tested consumption pattern (package exports exist for it).

3. **Demo proves runtime switching.** `demo/src/App.tsx` defines three
   themes (praxis, midnight, terminal) as JS objects mapping token names
   to values, with an `applyTheme()` function that sets/clears
   `document.documentElement.style` properties. A Chipper keyword chip
   controls theme selection. It works — theme changes apply instantly.

4. **Pre-computed hover colors.** The `chip-colors()` SASS mixin generates
   `-hover` variants at compile time, avoiding runtime `color-mix()`.
   Legacy browser friendly.

## Gaps

### 1. Theme switching is demo-only code, not library API

The `applyTheme()` function and `themeTokens` map in `demo/src/App.tsx`
are ~100 lines of demo code doing what the library should provide. The
pattern works but consumers would need to reinvent it:

- Enumerate all overridable tokens
- Clear previous theme's inline styles
- Apply new theme's values
- Handle "default theme" (no overrides, SCSS cascade provides values)

### 2. No theme type definition

Themes are `Record<string, string>` in the demo — untyped bags of CSS
property strings. No way to know which tokens a theme should provide,
no validation, no autocomplete. Theme authors copy-paste from praxis
and hope they got every token.

### 3. Only one compiled theme ships

Praxis is the only SCSS theme. Midnight and terminal exist only as JS
objects in the demo. If the library is going to ship themes, they should
be available as both compiled CSS (for static import) and as JS objects
(for runtime switching).

### 4. Chip color roles are open-ended but undocumented

A theme must provide `-text`, `-bg`, and `-hover` tokens for every color
role used by any domain in the consumer's palette. If a domain declares
`color: 'copper'` but the theme doesn't define `--chipper-color-copper-*`,
the chip falls back to neutral gray. There's no mechanism to enumerate
required color roles or warn about missing ones.

- Ok, thinking out loud here. Inferring from this gap: right now, necessary color roles are determined by the user's palette.
   - `color: 'copper'` in a domain config block implies the presence of a 'copper' color role in the theme
   - It's the user's responsibility to provide a theme which covers all the color roles in their palette
   - And it's the user's responsibility to define a palette which depends only on roles in their theme
   - That all sounds good to me. And you're right, we'll need to define that relationship very clearly.
- Here's a wrinkle: not all themes will have the same set of color roles, or even the same *relationship to color* that praxis-theme has
   - For example, terminal is monocolor, and it looks great.
- To an extent, that makes sense. And if a user defines their theme clearly at build time, and builds from it cleanly, no issues occur
   - But runtime theme switching gets complicated.
   - And we need to clearly scope the mechanism you identified in this gap.

- Proposal: formalize the 'color role' concept as a new top-level chipper abstraction: the `hue`.
   - A hue is a set of colors representable as a typescript object
      - i.e., ```typescript
         {
            name: 'copper'
            text-color: #AAAAAA
            background-color: #BBBBBB
            ...: etc
         }
      ```
      - The hue contains the minimum sufficient set of color definitions to fully style a chip of any domain
   - Defining a chipper theme, then, means defining a set of hues.
      - Declaring a theme's API means listing supported hues.
      - Building a palette from a theme means only using hues from the supported theme
   - This feels like the right way to handle the data representation, and intuitively, I feel like it simplifies the runtime theme switching problem as well
      - midnight and praxis will likely have the same set of hue names, with different colors to align with the light vs dark color scheme
      - But terminal only has one hue. How do we square this circle? Open to suggestions.
   - Thoughts?

- If I can add another wrinkle: we recently added semantic drop-shadows to indicate a chip is focused
   - That works for a light-mode theme, but not for a dark-mode theme
   - So maybe midnight and terminal use colored box shadows to simulate an outer glow
   - For terminal, that glow would simply be the same green everything else is
   - For midnight, it would probably work best if it were a pastel color in the chip hue
      - Sounds like an optional hue parameter which defaults to black, to me. HBU?


### 5. No scoped theming

`applyTheme()` sets tokens on `:root`, which means the entire page
switches. There's no way to theme one Chipper instance differently from
another on the same page. May not matter pre-v1, but the design should
at least not preclude it.

### 6. Font token coupling

Terminal theme sets `--chipper-font` to monospace *and* `--demo-font` to
match the page. This works because the demo controls the page. A library
theme API shouldn't know about consumer page fonts — `--chipper-font:
inherit` (the default) is correct, but themes that want to override font
need the consumer to cooperate. Not a bug, but a DX rough edge to
document.

## External Input

**Roadmap item** (pre-release draft): "The demo's theme toggle works by
applying CSS custom property overrides via JS. This should be a first-class
library feature, not demo-only code."

**Design questions from roadmap:**
1. Should themes be JS objects or SCSS-compiled CSS files? (Answer from
   demo evidence: both — JS for runtime, CSS for static.)
2. Chip classification colors as part of theme contract.
3. Font token `inherit` default.
4. Theme restoration fragility.

**Original design doc deferred items:** second/third themes (terminal,
taxes), demo page theme toggle chip. The demo has since built the toggle
chip and two additional themes (midnight, terminal) — these deferred items
are partially addressed but not formalized.
- I'm pretty happy with praxis, midnight, and terminal as our initial set at release

**v1 design doc out-of-scope note:** "Runtime theme switching via JS.
Themes are CSS files. Switching themes means swapping which CSS file is
loaded. No JS theme-provider component needed." This was explicitly
deferred from v1. The demo has since proven that CSS-file-swapping is
insufficient — the `applyTheme()` pattern using inline style overrides
is the approach that works for instant switching.
- Maybe this is where we apply a mapping from one theme's hues to another?

## Recommended Next Steps

1. **Define the theme shape** — TypeScript type for a Chipper theme
   (surface tokens, accent tokens, semantic tokens, structural tokens,
   chip color map). This is the API contract.

2. **Ship `applyTheme()` as library code** — extract and generalize from
   the demo. Likely: `applyTheme(container, theme)` where container
   defaults to `document.documentElement` (enables scoped theming later).

3. **Ship theme objects alongside CSS** — praxis, midnight, terminal as
   both importable JS objects (`import { praxisTheme } from 'chipper/themes'`)
   and compiled CSS files. SASS source generates the CSS; a script or
   manual step produces the JS objects from the same values.

4. **Decide whether themes include chip colors or reference them** —
   praxis defines 10 hue roles, terminal defines 6 (all green). Should
   the theme contract require all 10? Allow any subset? Reference a
   separate "palette" concept? This is the core design question.

5. **Document the font inheritance story** — `--chipper-font: inherit`
   means Chipper uses the consumer's page font. Themes that override it
   (terminal) create a visual island. This is correct behavior but needs
   explicit documentation so consumers aren't surprised.

6. **Consider whether a React context provider is warranted** — the demo
   uses `onChange` to detect theme selection and call `applyTheme()`
   imperatively. A `<ChipperThemeProvider theme={...}>` would be more
   React-idiomatic and enable scoped theming, but it's more API surface.
   The imperative `applyTheme()` may be sufficient for v1.
