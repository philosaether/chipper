# To Do

Items for triage. From cross-project `/defer` or manual capture.

---

- **Easier styling override for embedded sentences** — When embedding a
  chipper sentence in a non-default context (e.g., small-caps header
  subtitle), consumers must override `--chipper-text-primary` and use
  `display: flex; justify-content: center` on a wrapper div because:
  (1) `.chipper-sentence` sets `color: var(--chipper-text-primary)`
  directly, so a parent's `color` has no effect; (2) `.chipper-sentence`
  uses `display: flex`, so `text-align: center` on the parent is ignored.
  The workaround on philbas.com's chipper demo page header is:
  ```scss
  &__time-ago {
    display: flex;
    justify-content: center;
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    --chipper-text-primary: var(--color-text-faint);
  }
  ```
  Consider: a `variant` or `size` prop on `<Chipper>`, or making the
  sentence inherit `color` and `text-align` from its parent by default
  instead of setting them explicitly. The custom property override works
  but isn't discoverable.
  Deferred from: philbas.com/riff/demo-showcase (2026-06-02).

  - [x] **keywordOrExpressionDomain text expression grabs random keyword on
  Enter** — When using a `textExpression()` inside a KOE domain, pressing
  Enter in the text input selects a keyword instead of confirming the
  typed text. Docs/demos are light on text expression examples. May be
  a bug or a configuration issue — needs investigation.
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

- [x] **keywordGroup prefix not shown in computed chip value** — When using
  keyword groups with a `prefix`, the prefix appears in the popup but
  is omitted from the chip trigger's displayed value after selection.
  Consumer has to work around this by baking the prefix into each
  keyword's `value` string, which defeats the purpose of grouping.
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

- [x] **numberDomain `default` expects string, not number** — Passing a
  numeric default (e.g., `default: 15`) causes a type error. The
  config expects a string even though the domain is numeric.
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

- [x] **`a()` phonetic exceptions: "an unique" → "a unique"** — The `a()`
  helper uses first-letter detection, but English has common phonetic
  exceptions where vowel letters produce consonant sounds (unique,
  unicorn, union, universal, used) and consonant letters produce vowel
  sounds (hour, honest, heir). Previous decision was to skip edge cases,
  but "an unique" is visible enough in ENYC's inquiry form to justify
  re-evaluating. A small exception list for common words would cover
  90%+ of real-world cases.
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

  ## Begin Riff Scope ##

- [x] **`a()` doesn't render in dormant optional clauses** — When an optional
  clause is inactive, the dormant-state text omits the article inserted
  by `.a()`. The other text segments show as muted italic, but the `a()`
  output is missing entirely.
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

- [x] **textDomain should render textarea above a length threshold** — When
  `maxLength` is high (e.g., 500), the popup still shows a single-line
  text input. Should automatically switch to a textarea widget above
  some threshold (maybe 100 chars, or a separate `multiline` option).
  Deferred from: eventsnyourcity.com/feature/tier-1 (2026-06-06).

- [x] **`display` callback for `TextOptions`** — Text segments (`.text()`)
  only support a static string. Punc segments (`.punc()`) already have
  `display: (context) => string` for dynamic content. Text segments
  should support the same pattern. Current workaround: two text segments
  with mutually exclusive `present` guards (e.g., `.text('to', { present:
  ctx => ctx.intent !== 'chat' }).text('about', { present: ctx =>
  ctx.intent === 'chat' })`). Works but verbose for a simple swap.
  Deferred from: philbas.com/riff/chipper-contact (2026-06-07).

- [x] optional clauses should toggle when the *row* is clicked, not just the indicator glyph

- [x] **Lines containing only latent clauses should collapse to zero
  height** — When a `.line()` separator sits between clauses that are all
  contingent and currently hidden (e.g., hire-only clauses when chat is
  selected), the line still occupies vertical space, creating visible
  gaps in the rendered sentence. The line should collapse when all
  clauses on that line are latent.
  Deferred from: philbas.com/feature/chipper-contact (2026-06-09).

- **Validation trigger API** — Ability to programmatically mark chips as
  errored from outside the sentence (e.g., on form submit). Chips track
  `valid`/`error` state internally but there's no way for a consumer to
  say "highlight all invalid required fields now." Needed for form-submit
  UX patterns where validation feedback appears on action, not on blur.
  The philbas.com contact form had to use manual DOM manipulation
  (`aria-invalid` + CSS) to show error outlines because chipper has no
  external validation trigger.
  Deferred from: philbas.com/feature/chipper-contact (2026-06-10).
- **eslint broken: flat-config migration needed** — `npm run lint` fails
  with the eslint migration-guide message on an untouched tree (verified
  via stash, 2026-08-05). Config predates eslint 9 flat config. Needs a
  proper migration pass, not a quick patch.
  Noted during: eventsnyourcity.com autonomous run (2026-08-05).
