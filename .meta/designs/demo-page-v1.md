---
Status: accepted
Date: 2026-05-30
Accepted: 2026-05-30
Assessment: assessments/demo-page-use-cases.md
Supersedes: demo-page.md
---

# Demo Page v1.0 — Desired State

The demo page is a maze navigated entirely through chipper sentences.
A navigator meta-sentence at the top controls what appears below.
Clicking chips is the only way to explore — the page reconfigures
like rotating a tesseract through 2D space. Every configuration is
deep-linkable.

This feature is too large for one draft→ship cycle. This design is
the map; each demo sentence and each infrastructure piece gets its
own cycle. The roadmap sequences them.

---

## 1. The Navigator

```
Show me chipper for [audience] — I want to see [section],
  ↳ and show me [the details].
```

### Audience chip (keyword)

| Value | Theme | Tone |
|-------|-------|------|
| `everyone` | Default praxis | Warm, welcoming |
| `developers` | Default + code annotations | Technically precise |
| `product people` | Default + value prop callouts | Business framing |
| `finance bros` | Green, "$" for "s", numerics compound 2%/min | Affectionate mockery |
| `bronies` | MLP pastels via createHue, horse emoji bullets | Gentle, inclusive |
| `cottagecore` | Warm earth tones, serif, gregorian chant in music | Cozy, wholesome |
| `cyberpunk` | Neon-on-black, mono font, electronic-only music | Blade Runner energy |
| `academics` | Serif, `[citation needed]` chips, footnotes | Dry, deadpan |

Effects: page theme (createHue showcase), text transforms, annotation
layer, info popup tone, music genre filtering.

### Section chip (keyword)

| Value | Content |
|-------|---------|
| `what it can do` | Gallery: capability showcases |
| `something fun` | Playground: silly demos |
| `real-world apps` | Workshop: practical demos with serialization |

### Details chip (optional clause, keyword overlay)

| Value | Overlay |
|-------|---------|
| `how it works` | Per-demo stat chips, architecture callouts |
| `what it costs` | Token cost per draft→ship cycle, serialized sizes, render counts |
| `the source code` | Inline builder() definitions below each demo |

### Footer

```
You've explored [4 of 14] demos. Viewing in [midnight] theme.
  ↳ Or, create your own: base color [#3d5a80], name it [ocean]. Preview: [■].
[Surprise me] · v1.0 · chipper
```

### Deep-links

Navigator in query params, sentence states in hash:
`/demo?audience=finance+bros&section=fun#eyJleGN1c2UiOnsi...`

## 2. Demo Inventory

### Gallery — "What It Can Do"

| Demo | Key chips | Showcases |
|------|-----------|-----------|
| **Time-ago** | Derived display chip | Nontechnical hook, color aging |
| **Excuse generator** | KOE (absurd keywords + free text) | Viral shareability |
| **Weather** (existing) | External + derived + static display | Live data proof |
| **Cocktail menu** | Keyword → derived display (recipe match) | Practical + charming |
| **Stock ticker** | External display + createHue (gain/loss) | Live feed + dynamic theming |

### Playground — "Something Fun"

| Demo | Key chips | Showcases |
|------|-----------|-----------|
| **D&D encounter** | Alt-coord ranges, multi-select, derived | "TPK Friday" |
| **Pet profiler** | Contingent multi-select grid per animal | Whimsy |
| **Astrology** | Contingent clauses, derived snarky quotes | Screenshot bait |
| **Reddit shade** | Remote display (Cloudflare cache) + derived | Self-documenting shade function |

### Workshop — "Real-World Apps"

| Demo | Key chips | Showcases |
|------|-----------|-----------|
| **Praxis task** (evolved) | Reference (org chart), multi-select, cascade | Praxis ad |
| **Music + vibes** | Spotify embed toggle, page reskin (contingent) | Hidden unlock |
| **CI → YAML** | Multi-select matrix, custom serializer | "I would genuinely use this" |
| **Contract clause** | Contingent "not to exceed", import/export | Legalese from English |
| **Tweet scheduler** | Tone selector, derived preview | "Projected ratio: medium" |

## 3. Implementation Layers

Each layer is shippable on its own. Layers are additive.

### Roots — Shared Infrastructure

Built first. Other layers depend on these.

- **Token cost tracker**: utility that records actual token cost of
  each draft→ship cycle. Surfaces as "what it costs" overlay data.
  Also provides supporting data for Phil's philset essay.
- **Audience context**: React context providing current audience value
  to the entire page. Drives text transforms, conditional rendering,
  and theme switching. Inspired by eidolon's `${nerd}` pattern but
  simpler — just a context + audience-aware wrapper components:
  - `<AudienceText>` — inline span that applies text transforms
    (e.g., "s" → "$" for finance bros). Wraps all non-chip prose.
  - `<AudienceOnly audience="cyberpunk">` — renders children only
    for matching audience. For whole-section conditional rendering.
  - `useAudience()` hook — for components that need to read the
    audience programmatically (e.g., music genre filtering).
- **Section router**: reads section chip value, renders correct demo
  set. Not react-router — just conditional rendering driven by
  sentence state.
- **Deep-link codec**: serialize/deserialize all sentence states
  to/from URL. ~10 lines using chipper's serialization API.
- **Demo wrapper component**: renders a demo with its sentence,
  optional stat chips (for "how it works" overlay), and audience-
  aware prose annotations.

### Trunk — Navigator + Core Page

- Navigator sentence (audience + section + details optional clause)
- Layout: header, time-ago chip, navigator, primary section, teasers, footer
- Section routing working
- Deep-links encoding/decoding
- Time-ago display chip (always visible)
- Existing demos migrated: weather (as-is), praxis (expanded with
  org chart + notifications + when/and cascade)

### Branches — Core Demos (one draft→ship each)

- Excuse generator
- Cocktail menu
- Stock ticker
- D&D encounter builder
- Pet personality profiler
- CI pipeline → YAML
- Contract clause builder

### Canopy — Full Fill

- Astrology compatibility
- Reddit shade machine (+ Cloudflare Worker)
- Music + vibes (+ Spotify embed)
- Tweet scheduler
- Details overlay (stat chips, cost data, source code)
- Exploration tracker
- `[Surprise me]` teleporter

### Leaves — Audience Personalities

- Finance bros (text transforms, compounding numerics, green theme)
- Bronies (MLP theme, horse emoji)
- Cottagecore (earth tones, serif, genre additions)
- Cyberpunk (neon-on-black, mono, genre filtering)
- Academics (citation chips, footnotes)

### Flowers — Polish

- Page reskins (MySpace, GeoCities, Windows 95, hacker movie, Tumblr)
- createHue live builder in footer
- Finance bros compounding animation
- Developer mode: hoverable code annotations
- Sourdough calculator (if needed)
- Deep-link sharing UI (copy button, QR?)

## 4. Eidolon Patterns to Reuse

From `~/Development/html/apps/eidolon/src/engine/`:

| Pattern | Eidolon source | Demo page adaptation |
|---------|---------------|---------------------|
| Conditional blocks | `widgets/Nerd.tsx` — `${nerd n="2"}...${/nerd}` | `<AudienceOnly audience="cyberpunk">` |
| State → URL | `state/useEidolonState.ts` — Zustand + hash | Deep-link codec (simpler: just serialize/deserialize) |
| Text transforms | `parser/parse.ts` — inline `${cycle}` directives | `<AudienceText>` wrapping prose spans |
| CSS theming | CSS custom properties + class swap | Already have this via chipper's applyTheme() |

We don't need eidolon's parser — chipper sentences replace the markup
language. The conditional rendering and text transform patterns are
the reusable pieces.

## Tradeoffs

**Multi-cycle build vs. single session**
Each demo sentence is its own draft→ship. More overhead per feature,
but each cycle produces tested, reviewed code with a real token cost
data point. The data itself is a deliverable (philset essay support).
Chosen: multi-cycle. The demo page is too large and too creative for
a single session. SII loops on each demo ensure visual quality.

**AudienceText wrapper vs. CSS-only text transforms**
CSS `content` and `text-transform` can't do "s"→"$". We need JS for
arbitrary character substitution. A wrapper component that processes
children's text nodes is the simplest approach. CSS handles everything
else (theme, font, layout).
Chosen: hybrid. AudienceText for character-level transforms, CSS for
everything else.

**Token cost tracker: per-session vs. per-commit**
Per-session (draft→ship cycle) is the natural unit — it maps to one
feature and one token bill. Per-commit is too granular and hard to
attribute to a feature.
Chosen: per-session. Manual log from Claude Code web GUI before/after
each session.

**Demo page in chipper repo vs. philbas.com**
The maze page is a marketing site with Cloudflare Workers, audience
personalities, Spotify embeds, and page reskins — none of that belongs
in `npm install chipper`. Building against the published package
dogfoods the real developer workflow. Every DX pain point surfaces
immediately. chipper/demo/ stays as a minimal dev playground.
Chosen: philbas.com/chipper. npm publish moves before demo page work.

## Open Questions

1. **Token cost tracking mechanism**: Manual log after each session
   (copy from Claude Code usage stats), or automated extraction?
   Manual is simpler and guaranteed accurate. Automated would need
   to parse Claude Code's billing output.
   - Manual, I suppose. I can check the web GUI before and after each session, if that's the best way to do it

2. **Spotify embed**: need to test unauthenticated genre playlist
   embeds cross-browser. Fallback is a display chip with track info.
   - Will test as part of that feature

3. **Audience × demo interactions**: Beyond music genre filtering,
   what audience-specific demo mods are worth building? Cyberpunk
   contract builder with neon styling? Academics get a citation
   builder instead of contract? These are leaf/flower decisions —
   defer until we see the page taking shape.
   - Agreed

## Out of Scope

- Standalone tools (YAML generator, legalese generator) → philbas.com post-release
- Real brokerage API → simulated random walk
- Mobile-optimized layout → desktop-first
- SSR → client-only SPA
- i18n → English only
