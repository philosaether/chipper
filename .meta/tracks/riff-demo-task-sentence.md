# riff/demo-task-sentence

Riff track for adding the Praxis "create task on cadence" sentence to the
Chipper demo page, plus gaps surfaced along the way.

Started: 2026-05-21

---

## Note 1: dateExpression input type

Added `inputType: 'date'` to ExpressionMode and ExpressionConfig, plus a
`dateExpression()` helper. Native `<input type="date">` in the popup —
submits on change (like numeric stepper), value is YYYY-MM-DD.

Shipped as a general-purpose expression type. Not needed for the cadence
sentence itself (day-of-month is already handled by alt-coordinate, "due"
chip is relative duration via numericExpression), but valid for standalone
date-picking chips. Demo sentence: "Schedule a meeting for [a date]."

## Note 2: day-of-month vs full calendar date

Two distinct problems emerged from the dateExpression work:

1. **Day-of-month** (the cadence sentence's "on [the 15th]") — only the DD
   part matters. Already solved by alternativeCoordinateDomain with keyword
   slots (1st, 5th, 10th, 15th, 20th, 25th, last). No date picker needed.
   - SII: in the praxis htmx demo, we implemented this with two sets of keyword chips separated by a horizontal rule.
      - It looks good, but only because we also used custom CSS to arrange that second set of keywords into a nice grid.
      - We could use the same technique, but we'd need a way to tell the chip "render numbers 1-28 as chips in a nice grid."
         - Maybe this isn't a dateExpression? Maybe it's a keywordTray or something?
      - Or, if the flex layout gives us a nice grid for free, we still need to distinguish between the top row of keywords (first, 15th, last) and the lower grid

2. **Full calendar date** (a future "due on [March 15, 2026]" chip) — the
   dateExpression we just built. YYYY-MM-DD native picker, keywords for
   shortcuts like "tomorrow" or "next Monday".

These are different domains with different value types, not config variants
of the same expression mode. No further action needed — the existing
archetype split handles both cases.

### Response to SII annotations

Good catch — the current alt-coordinate Date tab has only 3 shortcut keywords
(first, 15th, last), which is a placeholder, not the real UX. The Praxis
htmx version had 28 numbered pills in a grid, and that's what we need.

The existing popup flex-wrap already gives us decent wrapping for keyword
pills. The multi-select grid (`.chipper-multi-select-popup__grid`) does
something similar — wraps pills with `flex: 0 0 auto` and lets the container
handle rows. With 28 short labels (1–28), the pills are narrow enough that
flex-wrap should produce a readable grid without custom CSS.

The real question is the **two-tier layout**: shortcut keywords on top
(first, 15th, last) separated from the full 1–28 grid below. This maps
to the alt-coordinate **slots** model at first glance:

```
slots: [
  { prefix: 'the', keywords: [first, 15th, last] },  // shortcut row
  { keywords: [1, 2, 3, ..., 28] },                    // full grid
]
```

But that's a two-slot decomposition — both slots need to be filled. Wrong
for day-of-month where you pick from *either* row. This is actually a
single-slot domain with two *groups* of keywords, not two slots.

**Options:**

A. **Keyword groups on a single slot.** Add an optional `groups` concept to
   slot keywords — a separator or visual break between keyword sets within
   the same slot. Light touch, no new archetype.

B. **HR separator in keywords array.** Sentinel value (e.g.,
   `{ separator: true }`) that renders as `<hr>` instead of a pill. Hacky
   but zero-concept.

C. **Use KOE instead of alt-coordinate.** dayOfMonth as a KOE with 28
   keywords + shortcuts. But KOE doesn't have keyword grouping either.

D. **Leave as-is for this riff.** The 3-shortcut version works for the demo.
   Full 1–28 grid is a known enhancement, not blocking.

Leaning D for now — the demo doesn't need pixel parity with Praxis. The
grouping problem is real but it's a design question (keyword groups across
all popup types, not just alt-coordinate). Worth a note for the DX wishlist.

- Ok -- I'm reading this as a philset feature request for a /defer skill. In this case, we would want to /defer day-of-month chip to its own design session, since it involves significant extensions to the behavior of keywords in general.
   - I already speculated about adding a "roadmap.md" file of some kind to canonical philset meta; the /defer skill would add to it and /hello would likely read it.
   - Let's try it out in this project: can you make a roadmap.md, populate it with known defects and tech-debt, and put the day-of-month expression type in it?

## Note 3: contingentOn presence shorthand

Overloaded `contingentOn` so a bare function is treated as the `present`
predicate. No new method — if the second arg is a function instead of an
object, wrap it as `{ present: fn }`.

```typescript
// Before
.contingentOn('cadence', {
  present: (ctx) => ctx.cadenceUnit === 'week',
})

// After
.contingentOn('cadence', (ctx) => ctx.cadenceUnit === 'week')
```

Object form still works for cases that need `configure`. Updated all three
contingentOn calls in App.tsx to use the shorthand.

## Note 4: line-level vs clause-level optionality

The Praxis UI shows optional items as indented lines with toggle controls
(↳ dormant, × active). Each toggleable item occupies its own line. But
Chipper's architecture assigns optionality to *clauses*, and lines are
purely visual groupings (one or more clauses per line).

Current state:
- `ClauseDefinition.necessity`: `'required' | 'optional'`
- `LineDefinition`: `{ clauseIds: string[], indent?: boolean }`
- `Clause.tsx` renders the ↳/× toggle per clause
- `Sentence.tsx` renders lines as visual wrappers around clauses

The tension: in the Praxis screenshot, every optional item is a line with
exactly one clause. The toggle, the indentation, and the dormant placeholder
all operate at the line level visually. But Chipper's line model allows
multiple clauses per line — and optionality lives on clauses, not lines.

**What actually needs to happen when a line has one optional clause?**

Looking at the Praxis screenshot more carefully:
```
create task named [Code Block] ,          ← required, not indented
  × due [in 5 days] ,                     ← optional+active, indented
  × tagged with [code, deep_work] ,       ← optional+active, indented
  ↳ described as a new task under...      ← optional+dormant, indented
  ↳ and notify me .                       ← optional+dormant, indented
```

Each of these is one clause on one line. The indent is a *consequence* of
optionality — optional clauses are visually subordinated. The toggle is
on the clause, but the indent is on the line.

**Proposal: optionality implies indent, not the other way around.**

Right now `indent` is a manual boolean on `LineDefinition`. Instead:
- A line is indented if *any* clause on it is optional or contingent-dormant
- The builder can still accept explicit `indent` as an override
- The ↳/× toggle stays on the clause (where optionality lives)
- Lines remain purely visual — they don't gain optionality semantics

This means the builder doesn't need a new concept. You write:

```typescript
.line()
.clause('due', builder()
  .optional()
  .text('due')
  .chip('dueDate')
  .text(',')
)
```

And the line auto-indents because `due` is optional. The current explicit
`.line({ indent: true })` becomes sugar for forcing indent on lines with
all-required clauses (rare but possible).

**What about multi-clause lines with mixed optionality?**

Edge case: a line with one required clause and one optional clause. The
required clause anchors the line; the optional clause adds/removes chips
from it. In this case:
- Line is NOT indented (required clause anchors it)
- Only the optional clause gets a toggle
- This is how the cadence line already works — "Every [2] [weeks] on
  [Monday]," has three clauses, some contingent

So the rule refines to: a line is indented if *all* clauses on it are
optional or contingent.

**Implementation scope:** This is a rendering change in `Sentence.tsx` —
derive indent from clause state instead of (only) from `LineDefinition`.
No engine changes needed. Small enough for this riff.

- Looking good! Let's riff on the inactive clause display.
   - My first thought is: full computed display text in muted italics, but no chip borders.
   - So the demo sentence line 2 would read 'at a specific time of day' in muted italics at page load
   - When the user toggles it to active, it now reads "at [a specific time of day]" at full opacity Roman with chip edits.
   - The user configures it to read "dusk", then deactivates the clause
   - It now reads "at dusk" in muted italics

### Bug fix: numericExpression validates empty string

`Number('') === 0`, which passes `!isNaN && isFinite`. So a KOE with
placeholder + numericExpression initializes as valid with displayValue `''`
instead of showing the placeholder. Fixed: `numericExpression` default
validate now rejects empty string explicitly.

Also fixed: timeOfDay keywords had number values (`6`) in a string domain.
Changed to string values (`'6'`).

## Note 5: dormant clause display

Phil's proposal: dormant optional clauses should render their full segment
text with chip display values inlined — muted italics, no chip borders.
Toggling to active restores normal chip rendering. Toggling back to dormant
shows the configured values, not the placeholder.

Current behavior: dormant clauses show ↳ + placeholder text only. No
segment rendering, no chip values.

**Implementation:**

In `Clause.tsx`, the dormant branch currently returns early with just the
toggle + placeholder span. Instead:

1. Render all segments, but substitute chips with their `displayValue`
   (or `placeholder` if invalid) as plain text spans
2. Wrap the whole clause in `chipper-clause--dormant` (already exists)
3. CSS: dormant clause gets `font-style: italic`, `opacity` or
   `color: var(--chipper-text-muted)`, no chip borders/backgrounds
4. The ↳ toggle stays as-is

The chip state already persists when a clause is deactivated (TOGGLE_CLAUSE
flips `active`, doesn't clear values). So "at dusk" survives deactivation
— we just need to read the display values during dormant render.

**Edge case:** first render, no user interaction. Chip values are defaults.
If default is invalid → show placeholder text in the dormant string. If
default is valid (e.g., first keyword) → show that keyword's display.
Both feel correct.

## Note 6: theme toggle sentence

Self-referential demo sentence: the user picks a theme and the page updates
live. Shows Chipper controlling something outside its own sentence state.

Sentence: `"View this page in [praxis] theme."`

Single enum chip with theme keywords. The `onChange` callback reads the
selected theme value and applies CSS custom property overrides to the
document root. Themes defined as token maps in the demo — not new SCSS
files, just JS objects that override `--chipper-*` tokens.

Themes:
- **praxis** (default) — warm parchment, gold accents (current)
- **midnight** — dark background, cool blues
- **terminal** — black/green monospace hacker aesthetic

Implementation: all in App.tsx + demo.css. No library changes.