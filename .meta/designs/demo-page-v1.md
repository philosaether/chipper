---
Status: draft
Date: 2026-05-30
Assessment: assessments/demo-page-use-cases.md
Likely-supersedes: demo-page.md
---

# Demo Page v1.0 — Desired State

The demo page is a maze navigated entirely through chipper sentences.
A navigator meta-sentence at the top controls what appears below.
Clicking chips is the only way to explore — the page reconfigures
like rotating a tesseract through 2D space. Every configuration is
deep-linkable: copy the URL, send it to a friend, they see exactly
what you see.

---

## 1. The Navigator

A two-line chipper sentence controls the entire page.

```
Show me chipper for [audience] — I want to see [section],
  ↳ and show me [the details].
```

### Audience chip (keyword)

| Value | Effect | Tone |
|-------|--------|------|
| `everyone` | Default. Broadest, most accessible. | Warm, welcoming |
| `developers` | Code snippets, architecture callouts, builder API annotations | Technically precise |
| `product people` | Embeddability, configurability, "put this on any page" | Business value, ROI |
| `finance bros` | Every "s" → "$". Numerics compound at 2%/min. Gratuitous green. | Affectionate mockery |
| `bronies` | MLP theme via createHue. Horse emoji replaces bullets. Pastel explosion. | Gentle, inclusive |
| `cottagecore` | Warm earth tones, serif font, gregorian chant + harpsichord in music player | Cozy, wholesome |
| `cyberpunk` | Neon on black, mono font, music player filters to electronic only | Blade Runner energy |
| `academics` | Citation chips: `[citation needed]` on everything. Footnotes. Serif. | Dry, deadpan |

The audience chip affects:
- Page-level theme (createHue showcase — each joke audience IS a custom theme)
- Text transforms on display chips and explainer copy
- Annotation layer (code for devs, value props for product people)
- Tone of info popup content
- Music genre filtering (cyberpunk: electronic only; cottagecore: adds
  gregorian chant and harpsichord)

NB: The joke audiences are personality tests for the user. Picking
one tells us something about the visitor — and we use that to make
the rest of the page funnier for them specifically.

### Section chip (keyword)

| Value | What appears below |
|-------|--------------------|
| `what it can do` | The Gallery — capability showcases |
| `something fun` | The Playground — silly demos |
| `real-world apps` | The Workshop — practical use cases with serialization |

Only one section is visible at a time. Teasers for the other sections
appear below to prevent feeling lost.

### Details chip (optional clause, keyword)

The second line is an optional clause — toggle it on to add an overlay
on top of whatever section is showing:

| Value | Overlay effect |
|-------|----------------|
| `how it works` | Per-demo stat chips, code annotations, architecture callouts |
| `what it costs` | Token/byte counts: serialized state size, definition line count, estimated render weight |
| `the source code` | Inline code panel below each demo showing the builder() definition |

This is better than making "how it works" a section — it layers on
top of existing content instead of replacing it. The optional clause
toggle (↳) naturally teaches users that chipper has optional clauses.

### Footer

```
You've explored [4 of 14] demos. Viewing in [midnight] theme.
  ↳ Or, create your own: base color [#3d5a80], name it [ocean]. Preview: [■].
[Surprise me] · v1.0 · chipper
```

- Exploration tracker: derived display chips counting interactions
- Theme/createHue showcase as a contingent clause
- `[Surprise me]` — teleports to a random curated state. ~100
  hand-picked state/URL pairs that showcase interesting combinations.
  Each click picks a random one and pushes the deep-link.

### Deep-links

Hybrid encoding: navigator in query params, sentences in hash.

```
/demo?audience=finance+bros&section=fun#eyJleGN1c2UiOnsi...
```

On every chip change: serialize → encode → pushState.
On page load: parse → deserialize → hydrate via initialValues.

## 2. The Gallery — "What It Can Do"

Default section for `everyone`. Capability showcases.

### 2a. Time-ago chip (foyer greeter)

Always visible above the navigator, regardless of section:

```
This page was last updated [3 hours ago].
```

- Derived display chip, computed from a real timestamp
- Fallback ladder: "just now" → "3 min ago" → "2 hours ago" →
  "yesterday" → "3 days ago" → "last week" → "3 weeks ago" →
  "last month" → "6 months ago" → "last year"
- Color fades: green (fresh) → amber (aging) → muted (stale)
- Info popup: "Last updated May 30, 2026 at 9:15 AM PST"
- The chip a nontechnical user immediately understood and wanted

### 2b. Excuse generator

```
I can't come to [the meeting] because my [iguana] [ate] my
[thesis on quantum entanglement] and I need to [negotiate its return]
before [the full moon].
```

Every chip is a KOE: curated absurd keywords + free text.

`[animal]`: "iguana", "emotional support peacock", "time-traveling dog",
"sentient roomba", "the neighbor's goat"

`[verb]`: "ate", "is holding hostage", "accidentally teleported",
"formed a union with", "proposed marriage to"

Maximum shareability — the deep-link IS the punchline.

### 2c. Weather dashboard (existing, evolved)

Keep the live weather sentence as-is. It's the display chip
proof-of-concept, already working with all three source types
(external subscription, derived conversion, static labels).

### 2d. Cocktail menu

```
I'm in the mood for something [refreshing] with [gin].
  [shaken] or stirred, served [on the rocks].
Your drink: [Gin Fizz].
  Recipe: [2oz gin, 1oz lemon, 0.75oz simple, soda top].
```

- Hardcoded menu of ~20 real cocktails with recipes
- Chips filter the menu; display chip shows best match
- Info popup: garnish, glassware, origin story
- Killer app framing: "embed this on your bar's website"

### 2e. Stock ticker

```
[AAPL] [$187.42 ▲]   [TSLA] [$241.03 ▼]   [VTI] [$267.89 ▲]
Portfolio: [$47,230.00]
```

- Simulated live feed (random walk on real starting prices)
- Per-ticker hue via createHue: green for up, red for down
- Info popup: ticker name, shares held, cost basis, day change %
- Portfolio: computed display chip summing positions
- Finance bros mode: numbers compound at 2%/min on top of the
  random walk. "Your portfolio is up 847% since you opened this tab."

## 3. The Playground — "Something Fun"

Silly demos that reward explorers. Getting lost is the point.

### 3a. D&D encounter builder

```
Set up a [medium] encounter for [4] level-[5] players in a [forest].
  Creatures: [2-3] [undead].
  XP budget: [1,000]. Suggested: [2 Wights + 4 Skeletons].
```

- `[medium]`: includes "TPK Friday"
- `[2-3]`: alternative coordinate (range presets / custom min-max)
- `[undead]`: multi-select, options change based on environment
- XP budget + suggestions: derived display chips with real 5e math
- Info popup on suggestion shows stat blocks

### 3b. Pet personality profiler

```
My [cat] named [Chairman Meow] is [chaotic, affectionate, food-motivated].
  Spirit animal: [Raccoon (87% match)].
```

- Multi-select trait grid changes per animal type:
  Cat: "knocks things off tables", "3 AM zoomies", "if I fits I sits"
  Dog: "eats homework", "existential tail chasing", "selective hearing"
  Hamster: "escape artist", "wheel enthusiast", "hoards everything"
- Info popup: "Chaos: 95%. Snack motivation: 92%.
  Opposable thumbs: 0%, but trying."

### 3c. Astrology compatibility

```
I'm a [Scorpio] sun / [Aquarius] moon / [Leo] rising.
  My crush is a [Pisces].
  Compatibility: [72% — "intense but worth it"].
```

- Crush clause contingent on your chart being set
- "Tell me more" contingent clause reveals crush moon/rising
- Snarky zodiac-aware compatibility quotes
- Maximum screenshot bait

### 3d. Reddit shade machine

```
Right now on Reddit: [1. Scientists discover...] [2. AITA for...]
  [3. TIL that...] [4. My cat just...] [5. Unpopular opinion:...]
Hot take: [Oh, so NOW scientists are discovering things?]
```

- Remote display chips fetching Reddit front page titles
- Data served from Cloudflare cache updated hourly (piggybacks on
  existing philbas.com infra — no new services)
- Shade function: keyword-match against titles, generate hot takes
  - "Scientists discover" → "Oh, so NOW scientists are discovering things?"
  - "AITA" → "Yes. The answer is always yes."
  - "TIL" → "Welcome to what the rest of us learned in 2019."
  - "My cat" → "Your cat is plotting your demise. This is not news."
  - Fallback: "I have strong opinions about this but I'll keep them to myself."
- Info popup shows the shade mapping function as code (self-documenting!)

## 4. The Workshop — "Real-World Apps"

Practical demos with serialization.

### 4a. Praxis task sentence (evolved hero)

```
Every [2] [weeks] on [Monday],
  ↳ at [9 AM],
create a task named [weekly review] in [Praxis]
  ↳ due [end of week]
  ↳ and notify [Engineering > Phil] via [Slack, email]
  ↳ when [status] changes to [blocked], also notify [Engineering > Lead].
```

New chips: reference domain org chart, multi-select notification
channels, contingent when/and clause cascade. This is the Praxis ad.

Developer overlay: hoverable code annotations, display chip counting
lines of TypeScript ("This sentence is `[52]` lines of TypeScript.").

### 4b. Music + vibes

```
Play something in the [Electronic > House] genre.
  ↳ [▶ playing] (Spotify embed)
  ↳ and while you're at it, make the whole thing look like [MySpace].
```

- `[▶ playing]` / `[⏸ paused]`: keyword toggle, contingent Spotify embed
- `[MySpace]`: keyword reskin, contingent on music playing
  - MySpace: tiled background, Comic Sans, auto-play badge, visitor counter
  - GeoCities: under construction GIF, marquee text, rainbow HR
  - Tumblr circa 2013: dark theme, sans-serif, infinite scroll feel
  - Windows 95: grey boxes, beveled borders, Start button
  - a hacker movie: green-on-black, falling characters, "ACCESS GRANTED"
- Hidden unlock: the vibes layer only appears when music is on.
  You have to play music to discover the page reskin. Rewards exploration.

### 4c. CI pipeline → GitHub Actions YAML

```
On [push to main], run [tests, lint, build] on [Node 20, Node 22],
  then [deploy to staging] if [all checks pass].
  Timeout: [15 minutes].
```

Below the sentence: live YAML preview updating in real time.
Custom serializer outputs `.github/workflows/ci.yml` format.
"Copy YAML" button. The serialization API showcase.

Deferred: standalone tool on philbas.com (post-release).

### 4d. Contract clause builder

```
The [Tenant] shall pay [$2,400] on the [1st] of each [month],
  with a [5-day] grace period, after which a late fee of [$50]
  [per day] applies,
  ↳ not to exceed [$200].
```

Contingent "not to exceed" clause vanishes for flat fee.
Below: formatted legal clause preview.
Import/export panel: JSON sentence state, copy/paste to restore.

Deferred: standalone legalese generator on philbas.com (post-release).

### 4e. Tweet scheduler

```
Tweet about [how hard I'm working] every [Saturday] at [8 PM].
  Tone: [humble brag]. Auto-hashtag: [on].
  Preview: ["Just mass-deployed 47 microservices before breakfast.
            No big deal. #BuildInPublic #Engineering"]
```

- `[humble brag]`: keyword tone selector — "humble brag", "earnest",
  "shitpost", "corporate speak", "unhinged"
- `[Preview]`: derived display chip with mad-libs-style tweet generation
- Info popup: character count, "Projected likes: 12. Ratio: medium."

## 5. Implementation Layers

The tree metaphor: trunk is strong and functional, branches add shape,
leaves and flowers are creative polish. We can stop at any layer and
have a shippable page.

### Layer 1: Trunk — Page Skeleton + Navigator

**Goal**: The maze works. Sections switch. Deep-links encode/decode.

- [ ] Navigator sentence: audience + section chips
- [ ] Section routing: render correct demo set based on section value
- [ ] Deep-link encoding: serialize navigator state to URL, hydrate on load
- [ ] Layout: header, navigator, primary section, teaser footer
- [ ] Time-ago chip (always visible, above navigator)
- [ ] Evolve existing demos: weather stays as-is, praxis task sentence
      gets notification chips + when/and cascade

### Layer 2: Branches — Core Demos

**Goal**: Each section has 2-3 demos that showcase distinct capabilities.

- [ ] Excuse generator (Gallery — KOE showcase, viral hook)
- [ ] Cocktail menu (Gallery — derived display chips, practical charm)
- [ ] Stock ticker (Gallery — external display, createHue for gain/loss)
- [ ] D&D encounter builder (Playground — alt-coord, multi-select, derived)
- [ ] Pet personality profiler (Playground — contingent multi-select grid)
- [ ] CI pipeline → YAML (Workshop — custom serializer, live preview)
- [ ] Contract clause (Workshop — contingent clauses, import/export panel)

### Layer 3: Canopy — Full Section Fill

**Goal**: Every section feels complete. No thin spots.

- [ ] Astrology compatibility (Playground)
- [ ] Reddit shade machine (Playground — Cloudflare cache integration)
- [ ] Music + vibes with Spotify embed (Workshop)
- [ ] Tweet scheduler (Workshop)
- [ ] Details overlay clause: "how it works" / "what it costs" / "source code"
- [ ] Per-demo stat chips (Mirror layer)
- [ ] Exploration tracker in footer

### Layer 4: Leaves — Audience Personalities

**Goal**: Joke audiences transform the page. Each one is a createHue demo.

- [ ] Finance bros: "$" substitution, compounding numerics, green theme
- [ ] Bronies: MLP pastel theme, horse emoji bullets
- [ ] Cottagecore: warm earth tones, serif, genre filtering (gregorian chant)
- [ ] Cyberpunk: neon-on-black, mono font, electronic-only music
- [ ] Academics: citation chips, footnotes, serif

### Layer 5: Flowers — Polish + Delight

**Goal**: The moments that make people tweet about us.

- [ ] Page reskins (MySpace, GeoCities, Windows 95, hacker movie, Tumblr)
- [ ] `[Surprise me]` random teleporter (curate ~100 states)
- [ ] createHue live builder in footer
- [ ] Finance bros compounding animation
- [ ] Sourdough calculator (if the page needs another derived-display demo)
- [ ] Deep-link sharing UI (copy button, QR code?)
- [ ] Developer mode: hoverable code annotations on praxis task sentence

## Tradeoffs

**Details as optional clause vs. section**
Making "how it works" an optional clause instead of a fourth section
means it layers onto existing content instead of replacing it. The
toggle itself demonstrates optional clauses. The section chip stays
at three values, which is cleaner.
Chosen: optional clause. Opens design space for other overlays
("what it costs", "source code") sharing the same chip.

**Base64 hash vs. query params for deep-links**
Hybrid: navigator in readable query params, sentence states in
compact hash. Best of both worlds.

**Simulated vs. real data for stocks**
Real stock APIs are doable but add failure modes and rate limits
that distract from the demo's purpose. Simulated random walk on
real starting prices demonstrates the architecture identically.
Chosen: simulated for v1. Real data is a nice-to-have flower.
Revisit if the page evolves into a standalone tool.

**Reddit via Cloudflare cache vs. hardcoded sample**
Cloudflare Worker updating hourly is trivial (fits existing
philbas.com infra) and keeps content fresh. Hardcoded sample
gets stale and loses the "live data" wow factor.
Chosen: Cloudflare cache. Graceful fallback to hardcoded sample
if the worker is down.

**~100 curated states vs. random generation for "Surprise me"**
Random generation produces mostly boring states. Curated states
guarantee every teleport is interesting — "finance bros + D&D
encounter + TPK Friday", "cyberpunk + stock ticker", etc.
Chosen: curated. Build the list during development as we
discover fun combinations.

## Resolved Questions

1. **How many demos?** More. Getting lost is the point. 14 demos
   across 3 sections + overlay. Implementation layers let us ship
   at any point.

2. **Sourdough?** Build cocktail first, decide later. Parked as a
   Layer 5 flower.

3. **Reskin depth?** Build in stages. Layer 2-3 gets the CSS class
   swap working. Layer 5 makes it grotesquely beautiful.

4. **Reddit CORS?** Cloudflare Worker cache, hourly refresh,
   graceful fallback to hardcoded sample.

5. **Audience list?** everyone, developers, product people, finance
   bros, bronies, cottagecore, cyberpunk, academics. Pirates scratched.

## Open Questions

1. **"What it costs" overlay**: What token/cost data is interesting
   to show? Ideas: serialized state size in bytes, SentenceDefinition
   object size, number of React renders per chip change, bundle size
   contribution. How much of this is trivially available vs. needs
   instrumentation?

2. **Spotify embed reliability**: Unauthenticated genre playlist
   embeds — do they work reliably across browsers without login?
   Need to test. Fallback is a display chip with track name.

3. **Audience × demo interactions beyond music**: Cyberpunk filters
   music to electronic. Cottagecore adds genres. What other
   audience-specific demo modifications are worth building?
   e.g., does "academics" add citation chips to the contract builder?

## Out of Scope

- **Standalone tools** (GitHub Actions YAML generator, legalese
  generator) — deferred to post-release philbas.com pages.
- **Real brokerage API** — simulated random walk only.
- **Mobile-optimized layout** — desktop-first for v1.
- **Server-side rendering** — client-only SPA.
- **i18n** — English only.
