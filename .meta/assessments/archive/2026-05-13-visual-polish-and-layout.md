# Assessment: Visual Polish and Layout
Date: 2026-05-13
Branch: main

## Current State

### Chipper (library)
- **Font**: `--chipper-font: inherit` — takes whatever the consumer sets. Demo page uses browser default sans-serif (~16px)
- **Chip trigger**: `0.25rem 0.5rem` padding, `0.5rem` border-radius, `1px` solid border, `font-size: inherit`
- **Popup pills**: `0.25rem 0.5rem` padding, `0.5rem` border-radius, `font-size: inherit`
- **Popup container**: `0.75rem` padding, `1rem` border-radius, `min-width: 8rem` (enum) / `12rem` (KOE)
- **Enum popup**: flex-column, one pill per row, `0.125rem` gap
- **KOE/multi-select keywords**: flex-wrap, `0.375rem` gap — pills flow horizontally
- **Sentence layout**: flex-column with `0.25rem` gap between clauses. Each clause is flex-wrap. Currently all clauses stack vertically, one clause per line.
- **No multi-line sentence support**: Sentence renders all segments in one clause div. No concept of clause-per-line with indentation for optional clauses.

### Praxis (htmx demo — the visual target)
- **Font**: `"Newsreader", Georgia, serif` — a smaller, elegant serif
- **Chip trigger**: same padding (`0.25rem 0.5rem`), same border-radius (`0.5rem`)
- **Popup pills**: `0.85rem` font-size (smaller than sentence text), flex-wrap layout with `0.25rem` gap — pills flow horizontally, 2-4 per row
- **Popup container**: same padding (`0.75rem`), `min-width: 200px`
- **Month popup**: flex-wrap with max-width constraint → 2 months per row, compact grid feel
- **Date grid**: CSS `grid`, `repeat(7, 1fr)`, fixed `30×28px` buttons — true calendar layout
- **Multi-line sentences**: `.chip-sentence--clauses` uses flex-direction: column. Required clauses at left margin. Optional clauses indented `1.5rem` with `↳` toggle, dimmed at `0.3` opacity when inactive.

## What's Working

The color system, chip trigger states (placeholder/expanded/readonly), and popup mechanics are solid and match Praxis. The theming engine (tokens + praxis theme) already produces the right colors. The domain-colored pills with inverted selection work correctly.

## Gaps

### 1. Typography mismatch (HIGH IMPACT)
Chipper inherits the consumer's font. The demo uses browser-default sans-serif, which looks generic and large compared to Praxis's Newsreader serif. The visual "feel" difference is 60% font.

**Decision needed**: Should the library set a default font, or should the demo page set it? The token `--chipper-font: inherit` is correct for a library — but the demo needs to demonstrate the intended aesthetic.

**What to copy**: The demo page should use Newsreader (or a comparable serif) to show the intended look. The library should continue to inherit.
- Let's actually introduce a few different sentence panels on the demo page
    - Each one displays the same sentence, with the same chips, but with a different font
        - Chipper inherits the font and we can see how it looks on different styles of website
    - Choose a representative sample of common web themes (minimalist, maximalist, bookish, brochurish, government agency, hip startup, etc)
        - If any of them look terrible, that's a strong indicator that we need a theme

**What NOT to copy**: Don't hardcode a font in the library CSS. That defeats the theming system.

### 2. Popup pill density (HIGH IMPACT)
Chipper's enum popup renders pills in a single column (`flex-direction: column`). Praxis renders them in a wrapping flex grid — 2-4 pills per row. This is the biggest layout difference visible in the screenshots.

**Decision needed**: Should enum popups default to flex-wrap (horizontal flow) or flex-column (vertical list)? The month popup with 12 items is unreadable as a single column (the Chipper screenshot confirms this — it's a towering list).

**What to copy**: Flex-wrap layout for all popup types. Remove `flex-direction: column` from `.chipper-enum-popup`. Add a max-width constraint to prevent popups from spanning the entire viewport.
- Agreed

**What NOT to copy**: The Praxis date grid (`repeat(7, 1fr)` with fixed pixel buttons) is a special case for calendar layouts, not a general popup pattern. That's a future expression mode concern, not a base style change.
- Agreed

### 3. Popup pill font size (MEDIUM IMPACT)
Praxis uses `0.85rem` for popup pills — smaller than the sentence text. Chipper uses `font-size: inherit`, so pills are the same size as the sentence. Smaller pills feel more like a menu/picker and less like inline text.

**Decision needed**: Should popup pills have their own font-size token, or should the popup container set a smaller font-size that cascades?

**Recommendation**: Add `--chipper-popup-font-size` token, default `0.875rem`. Set it on `.chipper-popup`. This cascades to all pill types without per-element overrides.
- Agreed.

### 4. Multi-line sentence layout (HIGH IMPACT)
Chipper sentences currently render all clauses stacked vertically with minimal visual distinction. The Praxis demo shows a clear hierarchy:
- Required clauses at the left margin
- Optional clauses indented with `↳` toggle
- Inactive optional clauses dimmed to `0.3` opacity
- Each clause is its own visual line

**What's involved**:
- **Clause component changes**: Add `necessity` and `active` state to Clause rendering. Render `↳` toggle for optional clauses. Apply indentation CSS class.
- **Base SCSS changes**: Add `.chipper-clause--optional` (indented), `.chipper-clause--inactive` (dimmed), `.chipper-clause__toggle` positioning.
- **State dependency**: Rendering inactive optional clauses requires TOGGLE_CLAUSE to be implemented. Currently stubbed.
- **Partial implementation path**: We can add the *visual* layout (indentation, clause-per-line) without TOGGLE_CLAUSE. Optional clauses would show as indented but not toggleable until the engine work lands.

**Decision needed**: Do we add the visual layout now (indentation only, no toggle) or wait for TOGGLE_CLAUSE?

**Recommendation**: Add the visual layout now. The indentation and clause-per-line structure are pure CSS + component rendering changes. The toggle button can be a visual placeholder (↳ rendered but non-functional) or omitted. This gives us the right visual target for the demo without engine coupling.
- Actually, I'm gonna say defer this. We'll add it when we implement TOGGLE_CLAUSE.

### 5. Missing layout primitives
Chipper's `_base.scss` has no concept of:
- **Sentence max-width** — sentences expand to fill their container
- **Clause indentation** — no margin-left for optional clauses
- **Popup max-width** — popups grow with content
- **Line-height for sentence text** — not explicitly set (Praxis uses `1.6` for clause layout)

### 6. WCAG considerations

**AA requirements relevant to this pass** (from architecture doc §O6):

| Criterion | Current State | Gap |
|-----------|--------------|-----|
| **Color contrast 4.5:1** | Praxis palette designed for contrast on parchment backgrounds. Need to verify each hue role meets 4.5:1 for text-on-bg. | Audit needed — gold and copper on light pastels may be borderline |
| **Focus indicators** | Focus ring implemented (`--chipper-focus-ring`). Uses `box-shadow` not `outline`. | Acceptable for AA, but `box-shadow` can be clipped by `overflow: hidden` on parent containers. Verify popup context. |
| **Target size 24×24px** | Chips are larger than 24px. Popup pills at `0.25rem 0.5rem` padding with `0.85rem` font ≈ 28×20px. | Popup pills may be under 24px height at smaller font sizes. Set `min-height: 1.5rem` (24px) on `.chipper-popup-option`. |
| **Keyboard focus order** | Tab reaches chips (buttons). Popup options are buttons. | Tab order within popups follows DOM order, not visual grid. Acceptable for AA but not ideal. Roving tabindex is already in the backlog. |
| **Non-text contrast 3:1** | Chip borders are 1px domain-colored on pastel bg. The contrast between border and background may fail 3:1 for lighter hues (gold border on gold bg). | Audit needed for border contrast per hue role. |

**What to include in this pass**: Min target size on popup options, popup font-size token, contrast audit (can be done visually during SII loop).

**What to defer**: Roving tabindex, aria-live announcements, screen reader labels (these are their own features in the backlog).

## External Input

- **Praxis screenshots** in `.meta/inbox/` — 7 screenshots showing the htmx demo's visual target
- **Architecture doc §O6** — AA at launch, AAA via high-contrast theme later
- **Theming engine design** — tokens + praxis theme already support all needed customization
- **in-progress.md** — keyboard navigation and screen reader support listed as tech debt

## Recommended Next Steps

The design pass should produce decisions on these items, roughly ordered by visual impact:

### Must-decide (shapes the whole pass)

1. **Popup layout**: flex-wrap for all popup types (replacing enum's flex-column). Max-width on popup container — what value? Praxis uses `200px` min, ~`280px` implicit max from content.
- We can try a few sizes -- wouldn't we want this measured in rem so it scales with the user's font size anyway?
- Praxis values make a good starting point and we'll iterate visually

2. **Multi-line sentence structure**: Clause-per-line with optional clause indentation. Do we render the `↳` toggle now (non-functional) or omit until TOGGLE_CLAUSE? What indentation amount? (Praxis uses `1.5rem`.)
- Defer

3. **Demo typography**: Which font for the demo page? Newsreader matches Praxis. The library continues to inherit. Set line-height for sentence text (`1.6` matches Praxis clause layout).
- Answered inline

### Should-decide (polish)

4. **Popup font-size token**: `--chipper-popup-font-size`, default `0.875rem`.
- Yes

5. **Popup pill min-height**: `1.5rem` (24px) for WCAG AA target size.
- Yes

6. **Sentence max-width**: Should the library set one, or leave it to the consumer? Praxis sentences fill their card container (~600px). The demo page has no constraint.
- Leave to consumer
    - But we should add a constraint on the demo page

### Can-defer (nice but not blocking)

7. **Contrast audit**: Verify each praxis-theme hue role meets 4.5:1 text contrast and 3:1 non-text contrast. Fix any that don't.
- Let's do it

8. **Popup arrow/caret**: Praxis has a CSS triangle pointing from popup to trigger. Chipper doesn't. Cosmetic.
- Also do it

9. **Date grid expression mode**: Praxis uses a `repeat(7, 1fr)` CSS grid for day-of-month. This is a future expression mode, not a base layout concern.
- Defer
