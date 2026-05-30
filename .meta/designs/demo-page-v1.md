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

A single chipper sentence controls the entire page. It's the first
thing you see and the only UI chrome.

```
Show me chipper for [audience] — I want to see [section].
```

### Audience chip (keyword)

| Value | Effect | Tone |
|-------|--------|------|
| `everyone` | Default. Broadest, most accessible demos. | Warm, welcoming |
| `developers` | Adds code snippets, architecture callouts, builder API annotations | Professional, technically precise |
| `product people` | Emphasizes embeddability, configurability, "put this on any page" | Business value, ROI framing |
| `finance bros` | Every "s" becomes "$". All numeric display chips compound at 2%/min. Gratuitous green. | Affectionate mockery |
| `bronies` | MLP theme (createHue showcase!). Horse emoji replaces all bullet points. Pastel explosion. | Gentle, inclusive mockery |
| `pirates` | Arrr. Pirate English throughout. Accent color: skull gold. | Talk Like a Pirate Day energy |
| `academics` | Every sentence gets a citation chip: `[citation needed]`. Footnotes everywhere. Serif font. | Dry, deadpan |

The audience chip affects:
- Page-level theme (MLP pastels, pirate gold, academic serif)
- Text transforms on all display chips and explainer copy
- Which annotation layer is visible (code for devs, value props for product)
- Tone of info popup content

NB: The joke audiences are personality tests for the user. Picking
"finance bros" tells us something about the visitor — and we can use
that to make the rest of the page funnier for them specifically.

### Section chip (keyword)

| Value | What appears below |
|-------|--------------------|
| `what it can do` | The Gallery — capability showcases |
| `something fun` | The Playground — silly demos |
| `real-world apps` | The Workshop — practical use cases with serialization |
| `how it works` | The Mirror — self-documenting architecture layer |

Only one section is "expanded" at a time (primary content area), but
a persistent sidebar/footer shows one-line teasers for other sections
so users know more exists.

### Deep-links

URL encodes navigator state + all active sentence states:

```
/demo?audience=finance+bros&section=something+fun&excuse.animal=iguana&excuse.verb=ate
```

Implementation: serialize all sentence states, base64 or query-param
encode, push to URL on every chip change. On load, deserialize and
hydrate. Chipper's serialization API makes this ~10 lines of code.

## 2. The Gallery — "What It Can Do"

Capability showcases. Default section for `everyone`.

### 2a. Time-ago chip

The foyer greeter. First thing anyone sees, above the navigator or
integrated into it:

```
This page was last updated [3 hours ago].
```

- Derived display chip, computed from a real timestamp
- Fallback ladder: "just now" → "3 minutes ago" → "2 hours ago" →
  "yesterday" → "3 days ago" → "last week" → "3 weeks ago" →
  "last month" → "6 months ago" → "last year" → "2 years ago"
- Color fades from green (fresh) → amber (aging) → muted (stale)
- Info popup: "Last updated May 30, 2026 at 9:15 AM PST"
- This is the chip a nontechnical user immediately understood and
  wanted. It goes first.

### 2b. Excuse generator

```
I can't come to [the meeting] because my [iguana] [ate] my
[thesis on quantum entanglement] and I need to [negotiate its return]
before [the full moon].
```

Every chip is a KOE: curated absurd keywords + free text.

Keywords for `[animal]`: "iguana", "emotional support peacock",
"time-traveling dog", "sentient roomba", "the neighbor's goat"

Keywords for `[verb]`: "ate", "is holding hostage", "accidentally
teleported", "formed a union with", "proposed marriage to"

The sentence updates in real-time as you click. Maximum
shareability — the deep-link is the punchline.

### 2c. Weather dashboard (existing, evolved)

Keep the live weather sentence. It's the display chip proof-of-concept.
Expand to show all three display source types in one place:
- External: live temperature subscription
- Derived: unit conversion
- Static: city label display chip

### 2d. Cocktail menu

```
I'm in the mood for something [refreshing] with [gin]. Shaken or
stirred? [shaken]. Served [on the rocks].
Your drink: [Gin Fizz].
Recipe: [2oz gin, 1oz lemon, 0.75oz simple, soda top].
```

- Keywords select from a real cocktail database (hardcoded ~20 drinks)
- `[Gin Fizz]` — derived display chip, best match from the menu
- `[Recipe]` — derived display chip, ingredients list
- Info popup on the drink name shows garnish, glassware, origin story
- Killer app framing: "embed this on your bar's website"

### 2e. Stock ticker

```
[AAPL] [$187.42 ▲]   [TSLA] [$241.03 ▼]   [VTI] [$267.89 ▲]
Portfolio: [$47,230.00]
```

- External display chips with simulated live feed (random walk on
  real-ish starting prices — we're not hooking up a brokerage API
  for the demo, but the architecture supports it)
- Each ticker gets its own hue: green for up, red for down (dynamic
  hue assignment via createHue — this IS the createHue showcase)
- Info popup: ticker name, shares held, cost basis, day change %
- Portfolio: computed display chip summing all positions
- Finance bros mode: numbers compound at 2%/min on top of the
  random walk. "Your portfolio is up 847% since you opened this tab."

## 3. The Playground — "Something Fun"

Silly demos that reward explorers.

### 3a. D&D encounter builder

```
Set up a [medium] encounter for [4] level-[5] players in a [forest].
  Creatures: [2-3] [undead].
  XP budget: [1,000]. Suggested: [2 Wights + 4 Skeletons].
```

- `[medium]` — keyword: "trivial", "easy", "medium", "hard", "deadly",
  "TPK Friday"
- `[2-3]` — alternative coordinate: range presets / custom min-max
- `[undead]` — multi-select creature type grid (options change based
  on environment — forest gets beasts, crypt gets undead)
- XP budget and suggestions: derived display chips with real D&D 5e math
- Info popup on suggestion shows stat blocks

### 3b. Pet personality profiler

```
My [cat] named [Chairman Meow] is [chaotic, affectionate, food-motivated].
  Spirit animal: [Raccoon (87% match)].
```

- Animal type changes the personality trait multi-select grid:
  - Cat: "knocks things off tables", "3 AM zoomies", "if I fits I sits"
  - Dog: "eats homework", "existential tail chasing", "selective hearing"
  - Hamster: "escape artist", "wheel enthusiast", "hoards everything"
- `[Raccoon (87%)]` — derived display chip with snarky match description
- Info popup: compatibility breakdown ("Chaos: 95%. Snack motivation: 92%.
  Opposable thumbs: 0%, but trying.")

### 3c. Astrology compatibility

```
I'm a [Scorpio] sun / [Aquarius] moon / [Leo] rising.
  My crush is a [Pisces].
  Compatibility: [72% — "intense but worth it"].
```

- Contingent clause: "My crush is a..." appears after you set your chart
- Additional contingent clause: "Tell me more →" reveals crush's
  moon/rising for a detailed breakdown
- Derived display chip with zodiac-aware snarky quote
- Info popup: per-planet compatibility with emoji severity ratings
- Maximum screenshot bait

### 3d. Reddit shade machine

```
Right now on Reddit: [1. Scientists discover...] [2. AITA for...]
  [3. TIL that...] [4. My cat just...] [5. Unpopular opinion:...]
Hot take: [Oh, so NOW scientists are discovering things?]
```

- Remote display chips fetching Reddit front page titles (via CORS
  proxy or RSS feed)
- `[Hot take]` — derived display chip running a keyword-matching shade
  function against the titles
  - "Scientists discover" → "Oh, so NOW scientists are discovering things?"
  - "AITA" → "Yes. The answer is always yes."
  - "TIL" → "Welcome to what the rest of us learned in 2019."
  - "My cat" → "Your cat is plotting your demise. This is not news."
  - Fallback: "I have strong opinions about this but I'll keep them to myself."
- Info popup shows the shade mapping function as code (self-documenting!)

## 4. The Workshop — "Real-World Apps"

Practical demos with serialization. Developer-facing but accessible to all.

### 4a. Praxis task sentence (evolved hero)

The existing cadence + task sentence, expanded:

```
Every [2] [weeks] on [Monday],
  ↳ at [9 AM],
create a task named [weekly review] in [Praxis]
  ↳ due [end of week]
  ↳ and notify [Engineering > Phil] via [Slack, email]
  ↳ when [status] changes to [blocked], also notify [Engineering > Lead].
```

New chips beyond current:
- `[Engineering > Phil]` — reference domain (org chart tree)
- `[Slack, email]` — multi-select notification channels
- `[status]` — keyword (task field names)
- `[blocked]` — keyword (status values, contingent on selected field)
- The when/and clause cascade: optional clauses chain via contingency
- This is the Praxis ad — show how expressive task automation can be

In developer mode: hoverable code annotations showing the builder calls
that produce each clause. Display chip: "This sentence is `[52]` lines
of TypeScript."

### 4b. Music + vibes

Evolve the existing genre picker:

```
Play something in the [Electronic > House] genre.
  ↳ [▶ playing] (Spotify embed)
  ↳ and while you're at it, make the whole thing look like [MySpace].
```

- `[▶ playing]` — keyword toggle: "▶ playing" / "⏸ paused"
- When playing: embed a Spotify genre playlist iframe (contingent clause)
- `[MySpace]` — keyword: "MySpace", "GeoCities", "Tumblr circa 2013",
  "Windows 95", "a hacker movie"
  - Each applies a CSS class that grotesquely reskins the page
  - MySpace: tiled background, Comic Sans, auto-play badge, visitor counter
  - GeoCities: under construction GIF, marquee text, rainbow HR
  - This entire clause is contingent on music playing — you only unlock
    the page reskin if you first choose to play music
  - Deep cut: the fact that you have to "unlock" the vibes layer by
    playing music is the kind of hidden interaction that rewards exploration

### 4c. CI pipeline → GitHub Actions YAML

```
On [push to main], run [tests, lint, build] on [Node 20, Node 22],
  then [deploy to staging] if [all checks pass].
  Timeout: [15 minutes].
```

Below the sentence: a live YAML preview panel showing the equivalent
GitHub Actions config, updating in real time as you change chips.

- Custom serializer that outputs `.github/workflows/ci.yml` format
- "Copy YAML" button
- This is the serialization API showcase and the "I would genuinely
  use this" demo
- Deferred: making this a standalone tool on philbas.com (post-release)

### 4d. Contract clause builder

```
The [Tenant] shall pay [$2,400] on the [1st] of each [month],
  with a [5-day] grace period, after which a late fee of [$50]
  [per day] applies,
  ↳ not to exceed [$200].
```

- "Not to exceed" clause: contingent on "per day" or "percentage"
  being selected (vanishes for flat fee)
- Below the sentence: a formatted clause preview showing the
  legal-ish output
- Import/export panel: JSON view of sentence state, copy/paste to
  share or restore
- Deferred: standalone legalese generator on philbas.com (post-release)

### 4e. Tweet scheduler

```
Tweet about [how hard I'm working] every [Saturday] at [8 PM].
  Tone: [humble brag]. Auto-hashtag: [on].
  Preview: ["Just mass-deployed 47 microservices before breakfast.
            No big deal. #BuildInPublic #Engineering"]
```

- `[how hard I'm working]` — KOE: keyword topics + free text
- `[humble brag]` — keyword: "humble brag", "earnest", "shitpost",
  "corporate speak", "unhinged"
- `[Preview]` — derived display chip generating a fake tweet based
  on topic + tone. Hardcoded templates with mad-libs-style substitution.
- Info popup: character count, estimated engagement ("Projected likes:
  12. Projected ratio: medium.")

## 5. The Mirror — Self-Awareness Layer

Woven throughout the page, not a separate section. Appears when
the user selects "how it works."

### 5a. Per-demo stat chips

Every demo section gets a small annotation line:

```
This demo: [5] chips, [3] domain types, [2] contingent clauses, [1] display chip.
```

All derived from the actual SentenceDefinition — self-documenting.
Visible in all modes, but in developer mode they're clickable with
info popups showing the sentence's internal structure.

### 5b. Exploration tracker

Persistent at the bottom of the page:

```
You've explored [4 of 12] demos. [3] features of chipper remain unseen.
```

Derived from tracking which sections the user has interacted with
(at least one chip click in a section = explored). Light gamification.

### 5c. Theme + createHue showcase

```
Viewing in [midnight] theme ([3] ship with chipper).
  ↳ Or, create your own: base color [#3d5a80], name it [ocean].
    Preview: [chip in ocean hue].
```

- The createHue contingent clause reveals a live hue builder
- Numeric expression for hex color input
- Text expression for hue name
- Display chip showing a sample chip rendered in the custom hue
- In developer mode: shows the createHue() code that produces it

## 6. Page Architecture

### Layout

```
┌─────────────────────────────────────────┐
│  Chipper                        [GitHub] │
│  Plain-English editing interfaces.       │
│                                         │
│  This page was last updated [3 hrs ago] │
├─────────────────────────────────────────┤
│  Show me chipper for [everyone]         │
│  — I want to see [what it can do].      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  PRIMARY SECTION                │    │
│  │  (controlled by section chip)   │    │
│  │                                 │    │
│  │  Demo A                         │    │
│  │  Demo B                         │    │
│  │  Demo C                         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ── Other sections (teaser links) ──    │
│  "something fun" · "real-world apps"    │
│  · "how it works"                       │
│                                         │
├─────────────────────────────────────────┤
│  You've explored [4/12] demos.          │
│  Viewing in [midnight] theme.           │
│  v1.0 · chipper                         │
└─────────────────────────────────────────┘
```

### Section ↔ Demo mapping

| Section | Demos |
|---------|-------|
| what it can do | Weather, Cocktail, Stock ticker, Sourdough calc |
| something fun | Excuse generator, D&D, Pet profiler, Astrology, Reddit shade |
| real-world apps | Praxis task, Music+vibes, CI pipeline, Contract, Tweet scheduler |
| how it works | Mirror layer (stats, tracker, theme/hue), + any current section's demos with annotations |

"How it works" is an overlay — it doesn't hide the current section,
it enhances it with stat chips, code annotations, and architecture
callouts. Switching to "how it works" keeps whatever section was
showing and adds the Mirror layer on top.

### State encoding for deep-links

```typescript
interface DemoPageState {
  audience: string;
  section: string;
  sentences: Record<string, SerializedSentence>;
}

// URL: /demo#eyJhdWRpZW5jZSI6...  (base64 of JSON)
// Or: /demo?a=finance+bros&s=fun&excuse=base64...
```

On every chip change in any sentence:
1. Serialize all sentence states
2. Encode to URL hash or query params
3. pushState (no page reload)

On page load:
1. Parse URL
2. Deserialize sentence states
3. Hydrate via initialValues

## Tradeoffs

**Base64 hash vs. query params for deep-links**
Query params are readable (`?audience=pirates`) but get long fast
with many sentences. Base64 hash is opaque but compact. Hybrid:
navigator state in query params (readable, shareable), sentence
states in hash (compact, secondary).
Chosen: hybrid. Revisit if URLs get unwieldy.

**One section visible vs. vertical scroll of all**
Maze architecture (one section at a time) creates discovery and
surprise. Vertical scroll is more conventional and googleable.
Chosen: maze. The whole point is that the page reconfigures. A
vertical scroll defeats the tesseract metaphor. Teaser links at
the bottom prevent users from feeling lost.

**Simulated vs. real data for stock ticker / Reddit**
Real APIs add CORS complexity, rate limits, and failure modes.
Simulated data is reliable and still demonstrates the architecture.
Chosen: simulated for stocks (random walk), real for Reddit (RSS
feed, with graceful fallback). Weather stays real (Open-Meteo,
already working). The point is showing the capability, not building
a production dashboard.

**Joke audiences as createHue showcase vs. separate demo**
The joke audiences (finance bros, bronies, pirates) naturally
exercise createHue — each one applies a custom theme. This makes
the theme authoring API a discovery, not a tutorial section.
Chosen: dual purpose. The joke IS the showcase.

**Spotify embed vs. simulated playback**
A real Spotify embed requires auth and may not work for all users.
A fake "now playing" display chip is more reliable.
Chosen: try real embed via Spotify's unauthenticated genre playlist
embeds (no login required, iframe-based). Fall back to a display
chip showing "▶ Playing: Electronic > House" if embed fails.

## Open Questions

1. **How many demos is too many?** The assessment lists 14+. The
   current design has ~12 spread across 4 sections. Is that a maze
   or a labyrinth? Should we cut to 8-9 for v1 and add more later?

2. **Sourdough calculator: keep or cut?** It's a great derived-display
   showcase but doesn't have a personality hook. The cocktail builder
   hits the same feature (derived display) with more charm. Keep both,
   or let cocktail carry that weight?

3. **Page reskin depth (MySpace/GeoCities mode):** How far do we go?
   A CSS class swap with 20 lines of comedy CSS? Or a fully committed
   grotesque transformation? The funnier it is, the more work it is.

4. **Reddit CORS strategy:** Reddit's RSS works but is rate-limited.
   Options: CORS proxy (Cloudflare Worker), cache on build, or
   hardcode "sample front page" with a refresh button that tries
   the real feed. Leaning toward hardcoded sample with live refresh
   as a bonus.

5. **Audience chip: more groups to gently mock?** Current list:
   finance bros, bronies, pirates, academics. Others to consider:
   "hustle culture", "cottagecore", "cyberpunk", "LinkedIn influencers",
   "that guy who replies-all". Each one needs a theme + text transform,
   so they're not free.

## Out of Scope

- **Standalone tools** (GitHub Actions generator, legalese generator as
  top-level philbas.com pages) — deferred post-release. The demo page
  shows the concept; the standalone pages are separate projects.
- **Real brokerage API integration** — simulated random walk only.
- **Mobile-optimized layout** — desktop-first for v1. Popups work on
  mobile but the maze navigation is designed for pointer interaction.
- **Server-side rendering** — demo page is client-only SPA.
- **i18n** — English only. The sentence-as-UI paradigm is inherently
  language-specific; l10n is a bigger design question.
