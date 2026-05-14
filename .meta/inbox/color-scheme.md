---
Status: accepted
Date: 2026-04-19
Accepted: 2026-04-19
Assessment: ../assessments/ui-component-consistency.md
---

# Praxis Color Scheme — Desired State

A single, named color palette that serves as the source of truth for every visual element in Praxis. Consolidates the current `_variables.scss` surface/accent tokens, the `$type-colors` badge map, and the `$chip-colors` input map into one coherent system rooted in the Alchemist's Folio design language.

This document is the *intent*. `_variables.scss` is the *implementation*. When they diverge, update one or the other — don't let them drift silently.

---

## Design Language

**The Alchemist's Folio (Light Mode).** Warm parchment surfaces, gold accents, serif typography, generous spacing. Inspired by the Golden Oracle stitch mockups — art nouveau flourishes, botanical/alchemical motifs, a sense of quiet authority. The palette should feel like opening a well-loved journal, not launching a SaaS dashboard.

Key principles:
- **Warm, never cool.** No blue-grays. Grays are tinted warm (toward brown/amber).
- **Gold is the soul.** The accent system is built around gold — it carries emphasis, selection, rank, and action.
- **Color has meaning.** Every hue in the semantic palette earns its place by communicating something specific. Decorative color is handled by the gold accent system, not by adding new hues.
- **Pastels for classification, solids for action.** Pastel backgrounds with dark text for labels/badges/chips. Solid or bright colors only for interactive elements (buttons, links, focus rings).

---

## 1. Surface Palette

The background/foreground system. Unchanged from current implementation — it's working well.

| Token | Hex | Role |
|-------|-----|------|
| `$bg-primary` | `#fbf9f5` | Page background. Warm cream. |
| `$bg-secondary` | `#f5f3ef` | Content rows, cards. One step down. |
| `$bg-tertiary` | `#ebe8e2` | Hover states, interactive areas, metadata pills. |
| `$bg-elevated` | `#ffffff` | Floating elements — modals, popups, tooltips. |
| `$text-primary` | `#1b1c1a` | Body text. Warm black, never pure `#000`. |
| `$text-secondary` | `#4a4a48` | Supporting text, labels, metadata. |
| `$text-muted` | `#7a7976` | Tertiary text, placeholders, disabled. |
| `$border` | `#d0c5af` | Visible borders (use sparingly). |
| `$border-subtle` | `rgba(#d0c5af, 0.4)` | Ghost borders, dividers. |

---

## 2. Accent Palette (Gold)

The primary interactive color. Carries emphasis, selection, and action.

| Token | Hex | Role |
|-------|-----|------|
| `$accent` | `#735c00` | Deep gold. Text, icons, active indicators. WCAG AA on cream. |
| `$accent-bright` | `#d4af37` | Bright gold. Primary button fills, CTA backgrounds. |
| `$accent-dim` | `#5a4700` | Dark gold. Hover/pressed states on accent elements. |
| `$accent-glow` | `#f7e1a6` | Soft gold. Selection highlights, active row backgrounds. |

---

## 3. Semantic Palette

Status and feedback colors. Four roles, each used consistently across all views.

| Token | Hex | Role | Used for |
|-------|-----|------|----------|
| `$success` | `#2e7d32` | Positive completion | Done status, checkmarks, share indicators |
| `$warning` | `#f57c00` | Attention needed | Active status, approaching due dates |
| `$error` | `#8c0d27` | Destructive/critical | Delete actions, overdue, error states |
| `$info` | `#1565c0` | Informational | Help text, links (used sparingly) |

---

## 4. Classification Palette

One unified `$palette` map replaces the current separate `$type-colors` and `$chip-colors`. Each entry is a named *hue role* with a text color and a pastel background.

### Thematic Foundation

The hue roles are grounded in the philosophical color system from Phil's metaphysical framework — a developmental progression from raw potential to refined expression:

> Black (Gift) → Red (Urge) → Amber (Fascination) → Gold (Integrity) → Green (Affinity) → Blue (Reflection) → Violet (Expression)

And the mystical materials provide physical metaphors: Gold ("I am what I am"), Celestial Bronze ("If you have done it, so can I"), Sapphire ("My words reflect reality"), Cold Iron ("I do what I must").

Where these resonate with a Praxis concept, the mapping is noted. Where common sense, usability, or accessibility would suffer, the philosophical association yields gracefully. The colors are *informed by* the system, not enslaved to it.

### Hue Roles

| Role | Text | Background | Praxis concept | Philosophical resonance |
|------|------|------------|---------------|------------------------|
| **gold** | `#8a5a00` | `#ffecd0` | Value badge, due chip | **Gold \| Integrity.** "I am what I am." Values are self-contained and self-justifying — the walls that hold inner order separate from outer chaos. Material: *Gold.* |
| **plum** | `#5c3d7a` | `#e8daef` | Goal badge | **Violet \| Expression.** "The self is refined by repeated cycles of exposure and reflection." Goals are aspiration crystallized — the specific thing you're reaching toward. |
| **copper** | `#b87333` | `#fde8d4` | Practice badge, interval chip, time chip | **Amber \| Fascination.** "Action begets repetition. Repetition begets rhythm." Practices ARE fascination made systematic. Material: *Celestial Bronze* — "If you have done it, so can I." The warm copper-orange is bronze made pastel. |
| **slate** | `#2a5082` | `#d6e5f5` | Initiative badge, priority chip | **Blue \| Reflection.** "Interiority as a mode of knowing." Initiatives are structured, deliberate efforts — plans that reflect understanding of what needs to happen. Material: *Sapphire* — "My words reflect reality." |
| **sage** | `#2e5a30` | `#d4edda` | Group badge, day chip | **Green \| Affinity.** "One singer implies a chorus. The cell becomes part of a body, the wolf becomes part of a pack." Groups are the relational unit — mutual modeling, harmony compounding with itself. |
| **stone** | `#6b5e4f` | `#e8e4dc` | Inbox badge, tag chip | Neutral. The inbox holds unsorted potential — items awaiting triage. Material: *Cold Iron* — "I do what I must." The weight of what's waiting. |
| **teal** | `#2a7d75` | `#d6f0ee` | Event chip | System triggers, automation. Distinct from human-facing concerns — the machinery behind the curtain. |
| **rose** | `#994d5a` | `#f5dfe0` | Task chip | **Red \| Urge.** "A burst of forward motion. Grabs attention, motivates action." Creating a new task is the moment of commitment — not yet refined, but real. Softened to rose because `$error` already owns true red. |
| **umber** | `#7d6b3a` | `#f5ecd6` | Collate chip | Aggregation, gathering. Earthy and collecting, like a bundle of sheaves. |
| **indigo** | `#3d4a8c` | `#dfe3f5` | Reference chip | **Blue \| Reflection** (deeper). Navigation into structured data — priority trees, entity references. Darker and cooler than slate, distinguishing external data from internal initiative. WCAG AA: 5.68:1 on pastel, 7.19:1 on white. |

### What changed from current

**Three-way rotation of badge colors, motivated by philosophical alignment:**

| Priority type | Was | Now | Why |
|--------------|-----|-----|-----|
| Value | sage (green) | **gold** (warm gold) | Gold \| Integrity. Values *are* identity. |
| Practice | amber (gold) | **copper** (orange-bronze) | Amber \| Fascination → Celestial Bronze. Warmer, more active than the contemplative gold. |
| Group | (none — inherited initiative blue) | **sage** (green) | Green \| Affinity. Groups are the relational unit. This is the strongest thematic fit in the entire mapping. |
| Goal | plum (purple) | plum (purple) | No change. Violet \| Expression already fits. |
| Initiative | slate (blue) | slate (blue) | No change. Blue \| Reflection already fits. |
| Inbox | stone (gray) | stone (gray) | No change. |

**Chip color changes:**

| Chip | Was | Now | Why |
|------|-----|-----|-----|
| interval | plum (purple, shared with goal) | **copper** (orange, shared with practice) | Cadence and rhythm are the essence of practice/fascination, not aspiration. |
| day | sage (green, shared with value) | sage (green, now shared with group) | Days are organic scheduling — green still fits, just a different badge partner. |
| due | amber (gold, shared with practice) | **gold** (warm gold, now shared with value) | Deadlines are commitments — expressions of integrity. |
| time | copper (standalone) | copper (now shared with practice) | Temporal concerns live together: interval, time, practice are all Amber \| Fascination. |
| All others | unchanged | unchanged | priority=slate, tag=stone, event=teal, task=rose, collate=umber. |

**Net effect:** 5 badge colors + 9 chip colors → 9 hue roles. Group gets its own color (sage). The philosophical color system provides a *mnemonic* for why each mapping exists — not arbitrary, not forced.

### Usage in SCSS

```scss
// In _variables.scss — single map, alphabetical
$palette: (
  copper: (#b87333, #fde8d4),
  gold:   (#8a5a00, #ffecd0),
  plum:   (#5c3d7a, #e8daef),
  rose:   (#994d5a, #f5dfe0),
  sage:   (#2e5a30, #d4edda),
  slate:  (#2a5082, #d6e5f5),
  stone:  (#6b5e4f, #e8e4dc),
  teal:   (#2a7d75, #d6f0ee),
  umber:  (#7d6b3a, #f5ecd6),
  indigo: (#3d4a8c, #dfe3f5),
);

// Badge aliases — priority type → hue role
$type-colors: (
  value:      map-get($palette, gold),
  goal:       map-get($palette, plum),
  practice:   map-get($palette, copper),
  initiative: map-get($palette, slate),
  group:      map-get($palette, sage),
  inbox:      map-get($palette, stone),
);

// Chip aliases — data field → hue role
$chip-colors: (
  interval: map-get($palette, copper),   // cadence — Fascination
  day:      map-get($palette, sage),      // schedule — organic rhythm
  time:     map-get($palette, copper),    // temporal — Fascination
  priority: map-get($palette, slate),     // reference — Reflection
  tag:      map-get($palette, stone),     // classification — neutral
  due:      map-get($palette, gold),      // deadline — Integrity
  collate:  map-get($palette, umber),     // gathering
  event:    map-get($palette, teal),      // automation
  task:     map-get($palette, rose),      // creation — Urge
);
```

### Note on gold badge vs. gold accent

Value badges use `gold` (#8a5a00 / #ffecd0). The UI accent system uses a related but distinct gold (#735c00 / #f7e1a6). These are intentionally close — values ARE the soul of the app, and the accent gold IS the app's identity. They're distinguishable because the badge background (#ffecd0) is yellower/warmer than the selection glow (#f7e1a6), and badges have uppercase text + small font + border-radius that the accent system doesn't use. If this proves confusing in practice, we can push the badge gold slightly warmer. But the thematic resonance of "values are golden" is worth preserving.

---

## 5. Status Rendering

Currently three different approaches (text-only, background pill, opacity). Standardize to one:

| Status | Text color | Background | Treatment |
|--------|-----------|------------|-----------|
| `queued` | `$accent` | `$accent-glow` | Pill (default state — most tasks are here) |
| `active` | `$warning` | `rgba($warning, 0.12)` | Pill |
| `done` | `$success` | `rgba($success, 0.12)` | Pill + strikethrough on name |
| `dropped` | `$text-muted` | `rgba($text-muted, 0.12)` | Pill + reduced opacity |
| `dormant` | `$text-muted` | `rgba($text-muted, 0.12)` | Pill + reduced opacity (same as dropped) |

Use the pill treatment everywhere — list rows, tree nodes, detail view. No more text-only status indicators.

---

## 6. Special-Purpose Tokens

Elements that don't fit neatly into the classification palette but need to be named and documented.

| Token | Hex | Role |
|-------|-----|------|
| `$share-green` | `$success` | Share indicators. Currently hardcoded `#3d8c5c`; should use `$success` since sharing is a positive state. |
| `$rank-gold` | `$accent` | Rank badges. Already uses `$accent`. No change needed. |
| `$score-bg` | `$bg-tertiary` | Score pill background. Neutral, not classified. |

---

## 7. Palette in Plain English

For the landing page, docs, and anyone who asks "what does Praxis look like?":

> **The Alchemist's Folio.** Warm cream parchment with deep gold accents. Nine classification hues — gold, plum, copper, slate, sage, stone, teal, rose, and umber — appear as soft pastel labels throughout the interface. Gold for what you value. Copper for what you practice. Plum for what you're reaching toward. Sage for who you work with. The overall feeling is a well-loved journal: deliberate, warm, quietly authoritative.

---

## Open Questions

1. **Copper density.** Practice badge, interval chip, and time chip all share copper. That's potentially a lot of orange in the action card editor (where interval and time chips often appear together). Options: (a) accept it — they're all temporal/rhythmic, the shared color reinforces that; (b) give time its own hue (but which?); (c) differentiate time chips with a lighter copper variant. Leaning (a).
- Agreed; if it turns out to be confusing when implemented, we can revisit.

2. **Goal stands alone.** Plum is the only hue role used by exactly one element (goal badge). No chip shares it. This is fine — goals are the only completable priority type, they deserve to be visually distinct. But noting it in case we want to assign plum to a future chip type.
- Yeah, nothing comes to mind. Let's keep an eye out for cases where plum feels relevant.
- Time chip is an obvious option; there's not really much philosophical resonance, but the purple will look nice next to all that orange. But let's do it all in copper first.

3. **Dark mode.** The stitch mockups include gorgeous dark variants (deep navy + gold). Not in scope for this pass, but the palette names (sage, plum, slate, etc.) are hue-names, not lightness-names, so they'll survive an inversion. The pastel backgrounds would become deep-toned backgrounds; the text colors would lighten.
- Noted, and great. That's a post-beta feature, though.
- Something else to note: what about whole other *themes*? Praxis is landing somewhere between botanical journal and spellbook right now. What about users who want sci-fi instead of fantasy? A console theme in neon and black, or starship vibes in gold, silver, and blue? These could be fun to develop, but they could also be part of our business model. Why not sell skins for your app?

4. **Philosophical color coverage.** The mapping covers Gold, Amber, Green, Blue, Violet, and Red (as rose). Black | Gift is the background (parchment as potential). The full progression is present in the app, even if users never know it's there.
- That's the kind of deep design choice that makes art feel cohesive. No need to surface the reasoning behind the theme, it's there for anyone who chooses to go looking to find.

## Out of Scope

- Dark mode implementation
- Icon system (separate design — addressed in UI standardization pass)
- Art nouveau flourishes and decorative elements (separate pass)
- Chip vs. badge affordance differentiation (shape/interaction, not color — handled in UI standardization)
- Detail edit form restyling (part of UI standardization, not color)
