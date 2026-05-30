# Assessment: Demo Page Use Cases

Date: 2026-05-30
Branch: feature/demo-page-v1

## Scope

What should the chipper demo page showcase? Exhaustive survey of use
cases, organized by where they belong in a maze-like demo architecture.

## Current State

The existing demo page (demo/src/App.tsx) has:
- Praxis task cadence sentence (the workhorse — 6 chips, 5 domain types,
  contingent clauses, punctuation engine)
- Theme toggle (sentence that controls the page)
- Date expression (KOE with calendar picker)
- Reference domain (music genre tree with drill-in and search)
- Remote source (display chip fetching from philbas.com)
- External source (live weather from Open-Meteo with derived conversions)
- State inspector (JSON dump)
- Explainer section

Layout: flat vertical scroll, section cards, one font panel (was six,
trimmed during theming v2). Functional but not structured for discovery.

## The Maze Vision

Phil's brief: the demo is a tesseract — users explore page states
exclusively by changing chip values. The page reconfigures as they
click. Features should be easy to stumble on. Bold explorers are
rewarded. The page should be self-aware (knows what it's showing you)
and audience-aware (adapts to who you are).

This means: the demo page itself is a chipper sentence at the top that
controls what you see below. Not a scroll of demos — a choose-your-own-
adventure that uses the library to navigate the library.

## Use Case Buckets

Organized by maze position: how deep into the demo they sit, and what
kind of user they're for.

### Bucket 1: The Foyer — First Contact

The very first thing anyone sees. Must instantly communicate "chips are
clickable words that reconfigure the page." Nontechnical users should
get it in 3 seconds.

**Navigator sentence (the meta-sentence)**
The page itself is controlled by a chipper sentence at the top:
> Show me chipper for `[everyone]` — I'm interested in `[what it can do]`.

- `[everyone]` — keyword: "everyone", "developers", "product people"
- `[what it can do]` — keyword: "what it can do", "how it works",
  "who's using it", "something fun"

Changing these chips reshapes the entire page below. "everyone" shows
the broadest, most accessible demos. "developers" adds code snippets
and architecture notes. "product people" emphasizes configurability
and embedding. "something fun" jumps straight to the silly stuff.

The second chip controls which section is expanded — so every chip
change is a page transition. The maze is navigated entirely through
chipper.

**Time-ago display chip (Phil's killer app from user testing)**
> This article was published `[3 weeks ago]`.

- `[3 weeks ago]` — display chip, derived from a date, with fallbacks:
  "yesterday", "3 days ago", "last week", "3 weeks ago", "last month",
  "6 months ago", "last year", etc.
- Info popup: "Time elapsed since May 9, 2026"
- Color shifts subtly as the article ages (green → amber → muted)
- The sentence a nontechnical user immediately understood and wanted.
  Lead with this.

### Bucket 2: The Gallery — "I Didn't Know You Could Do That"

Demos that showcase chipper's range. Each one highlights a different
capability. Easy to stumble on — the navigator sentence naturally leads
here via "what it can do."

**Excuse generator (viral/funny)**
> I can't come to `[the meeting]` because my `[iguana]` `[ate]` my
> `[thesis on quantum entanglement]` and I need to `[negotiate its return]`
> before `[the full moon]`.

- Every slot is a KOE with absurd keyword presets + free text
- Technically simple but immediately communicates the concept
- The demo that makes everyone laugh and click everything
- Maximum shareability — people will screenshot results

**Cocktail builder (practical + delightful)**
> Make me a `[refreshing]` cocktail with `[gin]` and `[citrus]`,
> `[shaken]`, served `[on the rocks]`. Suggested: `[Gin Fizz]`.

- Mood, base spirit, flavors (multi-select), method, serving
- `[Gin Fizz]` — derived display chip, changes as you adjust
- Info popup shows the recipe
- The sentence reads like ordering from a bartender

**Sourdough calculator (derived display chips)**
> I want to bake a `[750g]` loaf at `[78%]` hydration with `[20%]`
> whole wheat. Flour: `[421g]`. Water: `[329g]`. Starter: `[150g]`.
> Salt: `[15g]`.

- All result chips are derived display chips recalculating live
- Four chips updating simultaneously as you adjust one value
- Baker's percentage math — painful in a spreadsheet, elegant as chips
- Info popup on any result shows the formula

**Stock ticker (Phil's idea — external display chips)**
> `[AAPL]` `[$187.42 ▲]`  `[TSLA]` `[$241.03 ▼]`  `[VTI]` `[$267.89 ▲]`
> Portfolio value: `[$47,230]`

- Each ticker is an external display chip with live subscription
- Color-coded by gain/loss (green/red hues per chip)
- Info popup: ticker label, shares held, cost basis, day change
- Portfolio value: computed display chip summing positions
- Minimal, dense, embeddable — "put this on any page"

### Bucket 3: The Workshop — "How Do I Build This?"

For developers who clicked "developers" in the navigator. Shows code
alongside demos. Emphasizes the builder API, domain system, and
clean architecture.

**Praxis task sentence (the existing hero — evolved)**
The full cadence + task creation sentence, but now with annotations:
- Hoverable code snippets showing the builder() calls
- Display chip showing "This sentence is `[47]` lines of TypeScript"
  (derived, counting the actual definition)
- Toggle between "try it" and "see the code"

**CI pipeline rule (developer catnip)**
> On `[push to main]`, run `[tests, lint, build]` on `[Node 20, Node 22]`,
> then `[deploy to staging]` if `[all checks pass]`. Last run:
> `[#4521 passed, 3m ago]`.

- Multi-select for jobs, multi-select for matrix
- "GitHub Actions YAML, but it reads like English"
- Live display chip for last run status
- Shows contingent deployment clause appearing/disappearing

**Contract clause builder (structured data from plain English)**
> The `[Tenant]` shall pay `[$2,400]` on the `[1st]` of each `[month]`,
> with a `[5-day]` grace period. Late fee: `[$50]` `[per day]`, not to
> exceed `[$200]`.

- The "not to exceed" clause is contingent on fee type
- Disappears for flat fee, appears for per-day/percentage
- Shows that chipper handles domain-specific grammar naturally
- Serialization showcase: "export this clause as JSON"

**Import/export panel (serialization API showcase)**
- JSON panel showing current sentence state
- Copy/paste to restore state
- Demonstrates the serialization API from the library

### Bucket 4: The Playground — Reward for Explorers

Deeper demos for users who click through everything. These are the
"off the beaten path" discoveries that reward curiosity.

**D&D encounter builder (niche + technically rich)**
> Set up a `[medium]` encounter for `[4]` level-`[5]` players in a
> `[forest]`. Creatures: `[2-3]` `[undead]`. XP budget: `[1,000]`.
> Suggested: `[2 Wights + 4 Skeletons]`.

- Alternative coordinate for creature count ranges
- Derived XP budget and creature suggestions
- "TPK Friday" as a difficulty option
- Deep contingency: creature type grid changes based on environment

**Pet personality profiler (silly + contingency showcase)**
> My `[cat]` named `[Chairman Meow]` is `[chaotic, affectionate,
> food-motivated]`. Spirit animal: `[Raccoon (87%)]`.

- Personality trait multi-select changes based on animal type
  (cats: "knocks things off tables"; dogs: "eats homework")
- Derived compatibility match with snarky description
- Pure whimsy, maximum engagement

**Smart home rule (IFTTT but readable)**
> When `[motion detected]` in `[Living Room > Main Area]` `[after sunset]`,
> turn `[lights]` to `[warm white at 60%]` and `[play]` `[lo-fi playlist]`
> on `[kitchen speaker]`.

- Reference domain for room hierarchy
- Alternative coordinate for light settings (preset/custom tabs)
- Contingent media clause appears when action includes speakers
- "Home Assistant YAML as a sentence"

**Astrology compatibility (social/shareable)**
> I'm a `[Scorpio]` sun / `[Aquarius]` moon / `[Leo]` rising.
> Compatibility with `[Pisces]`: `[72% — "intense but worth it"]`.

- Derived display chip with snarky compatibility quote
- Info popup shows breakdown per planet
- Crush's full chart is a contingent clause ("tell me more")
- Maximum shareability — screenshot bait

### Bucket 5: The Mirror — Self-Awareness Layer

Meta-demos that reflect what chipper is doing. These appear contextually
throughout the maze, not as a separate section.

**"What you're looking at" display chip**
Every demo section has a small display chip sentence:
> This demo uses `[3]` chips across `[2]` domain types with `[1]`
> contingent clause.

All derived from the actual sentence definition. Self-documenting.

**Feature coverage tracker**
A display chip at the bottom of the page:
> You've explored `[4 of 12]` demo features. `[67%]` of chipper's
> capabilities are demonstrated on this page.

Derived from which sections the user has interacted with.

**Theme as self-awareness**
The theme selector already controls the page. Extend it:
> View this page in `[midnight]` theme. `[3]` themes ship with chipper.
> `[Create your own]` with createHue().

The `[Create your own]` chip, when clicked, reveals a createHue() demo
where the user can build a custom hue and see it applied live.

## Feature Coverage Matrix

Which chipper features does each demo showcase?

| Demo | KW | KOE | Multi | AltCoord | Ref | Display | Contingent | Punc | Theme | Serial |
|------|----|----|-------|----------|-----|---------|------------|------|-------|--------|
| Navigator | x | | | | | | x | | | |
| Time-ago | | | | | | x | | | | |
| Excuse gen | | x | | | | | | | | |
| Cocktail | x | | x | | | x | | | | |
| Sourdough | | x | | | | x | | | | |
| Stock ticker | | | | | | x | | | x | |
| Praxis task | x | x | x | x | | x | x | x | | |
| CI pipeline | x | | x | | | x | x | | | |
| Contract | x | x | | | | | x | x | | x |
| D&D | x | x | x | x | | x | x | | | |
| Pet profile | x | x | x | | | x | x | | | |
| Smart home | x | x | | x | x | | x | | | |
| Astrology | x | | | | | x | x | | | |
| Theme/hue | x | | | | | x | | | x | |

Full coverage across 8-10 demos. Reference domain appears in smart
home and the existing genre picker (keep or replace). Alternative
coordinate in D&D, smart home, and Praxis. Serialization in the
import/export panel attached to the contract builder.

## What's Working (from existing demo)

- Weather sentence: live external subscription, derived conversions —
  proves the display chip architecture end-to-end
- Praxis cadence: most complex sentence, exercises contingency engine
  deeply, context-aware punctuation
- Theme toggle: meta-demo that controls the page

## Gaps

- No maze structure — current demo is flat scroll
- No audience adaptation — same content for everyone
- No silly/fun demos — current page is purely technical
- No import/export panel (serialization showcase)
- No createHue() demo (theme authoring)
- Single font panel (was six, could be restored selectively)
- No self-documenting display chips
- Explainer text is static — could be chip-driven

## External Input

- Phil's nontechnical user testing: task configuration was immediately
  impressive. "Time ago" display chip for news articles was the
  unsolicited feature request.
- Phil's stock ticker concept: external display chips with per-chip
  color hues, info popups for provenance, computed portfolio total.
- The demo page is the first impression of the library — it needs to
  work for three audiences: "what is this?" (everyone), "how do I use
  it?" (developers), "should we adopt it?" (product/engineering leads).

## Recommended Next Steps

1. Design the navigator meta-sentence — this is the architectural
   backbone. What chips control what sections? How does the maze flow?
2. Pick 8-10 demos from the buckets above. Balance: 2-3 accessible
   (foyer), 3-4 capability showcases (gallery), 2-3 deep cuts
   (playground), plus the self-awareness layer throughout.
3. Draft the state map before building — which chip values lead to
   which page states? Map the tesseract.
4. Build the navigator + 2-3 demos as a vertical slice to validate
   the maze architecture.
5. Fill in remaining demos iteratively.
