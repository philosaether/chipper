# riff/polish-tweaks

Small visual and behavioral tweaks from to-do.md and demo-page-discoveries.md.

## Scope

### From to-do.md
- [x] Display chip hover suppression — span display chips fully suppressed, button display chips (with info popup) retain hover
- [x] Expansion arrow on interactive chips — solid triangle, right→down
- [x] GitHub repo description — "Plain English input for arbitrary complex logic."
- [x] Consistent hover bg on all interactive buttons (popup options, stepper, reference)
- ~~Easier styling override~~ — out of scope (deferred to philbas.com)

### From demo-page-discoveries.md
- [x] Markdown in info popups (including links) — widened to ReactNode, no parser dependency
- [x] `.a()` helper method — "a"/"an" based on next chip's displayValue
- [x] `.period()` helper method — renders ".", acts as punc boundary

## Notes

### `.a()` — indefinite article helper

**What it does:** Renders "a" or "an" based on the first letter of the
next chip's display value. Like `.punc()`, it's a text segment with a
dynamic value function.

**Approach:** Same sentinel pattern as `.punc()`. At `.build()` time,
the sentinel is replaced with a `(state: SentenceState) => string`
that:
1. Finds the next chip segment in the same clause
2. Reads `state.clauses[clauseId].chips[nextChipId].displayValue`
3. Returns `"an"` if first char is a vowel (a/e/i/o/u, case-insensitive),
   `"a"` otherwise
4. Returns empty string if the next chip isn't visible (present predicate
   evaluates false)

**Edge cases:**
- No next chip in clause → build-time error (misuse)
- Next chip's display value is empty/placeholder → render "a" (safe default)
    - Placeholders are user-specified and semantic -- i.e., "schedule an [event]", where "event" is placeholder value for meeting | adventure | council of elders
- "an hour" vs "a unicorn" — true a/an is phonetic, not alphabetic.
  Alphabetic covers 95% of cases. Could accept an override, but YAGNI
  for now. Document the limitation.

**Builder API:** `.a()` with no args. Could accept options like `.punc()`
if we want `present` predicates, but start without.

### `.period()` — sentence-terminal punctuation

**What it does:** Always renders a period. Interacts with `.punc()` by
acting as a sentence boundary — the last active `.punc()` before a
`.period()` should resolve to a period, not a comma.

**Approach:** Two parts:

1. **`.period()` itself** is simple — a text segment that renders `"."`
   when its clause is active, empty otherwise. Could support `present`
   predicate. Essentially `.text(".")` with clause-awareness, or even
   just a specialized `.punc()` that always returns `"."`.

2. **Interaction with `.punc()`** is the interesting part. Currently
   `resolveDefaultPunctuation` checks whether any *subsequent clause*
   is active — comma if yes, period if last. `.period()` needs to act
   as a boundary: punc segments should only look at clauses *between
   themselves and the next `.period()`*, not all subsequent clauses.

   Implementation: at build time, when binding punc sentinels, compute
   `subsequentIds` only up to (not including) the clause containing the
   next `.period()`. The period sentinel itself marks the boundary.

   This means `.period()` needs its own sentinel type (`__period`) so
   the punc binding pass can detect boundaries.

**Builder API:** `.period()` with optional `{ present }` like `.punc()`.
