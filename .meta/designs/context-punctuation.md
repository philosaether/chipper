---
Status: accepted
Date: 2026-05-24
Accepted: 2026-05-24
Implemented: 2026-05-24 (feature/context-punctuation)
Divergences: resolveDefaultPunctuation handles undefined definition.lines; cadence clause uses punc({present}) for keyword-only visibility
Deferred: none
---

# Context-Aware Punctuation — Desired State

Text segments can resolve their content dynamically based on sentence state,
enabling punctuation that adapts when clauses appear or disappear. A
`.punc()` builder method provides ergonomic sugar for the common
trailing-delimiter pattern.

---

## Data Model Change

`TextSegment.value` becomes a union:

```typescript
export interface TextSegment {
  type: 'text';
  value: string | ((state: SentenceState) => string);
  present?: (context: SentenceContext) => boolean;
}
```

When `value` is a function, it receives the full `SentenceState` (not
`SentenceContext`). This is an internal detail — consumers never write
these functions directly. The `punc()` builder sugar produces them
behind the scenes.

The consumer-facing `display` config on `punc()` receives
`SentenceContext`, matching every other consumer-facing predicate
(keyword labels, prefix/suffix, `present`, `configure`). Clause
presence logic (comma vs period) is handled by the default resolver
internally; consumers who use `display` override the character but
don't need to reason about clause activation.

The `present` predicate remains on `SentenceContext` — its job is
chip-level visibility ("show this text when chip X has value Y"), which
is a different concern from content resolution.

## Render Changes (Clause.tsx)

Active clause rendering resolves function-valued text segments:

```typescript
if (segment.type === 'text') {
  if (segment.present && !segment.present(resolvedContext)) {
    return null;
  }
  const text = typeof segment.value === 'function'
    ? segment.value(state)
    : segment.value;
  if (!text) return null;  // empty string = render nothing
  return (
    <span key={index} className="chipper-clause__text">
      {text}
    </span>
  );
}
```

Dormant clause rendering uses a fallback (empty string or static
placeholder) since dormant clauses don't need live punctuation — they're
already visually muted.

The `state` needed is already available in the component via
`useSentence()`. No new hooks or context plumbing required.

**Memoization**: Text segment functions should be cheap (clause presence
lookups), so no additional memoization beyond the existing render cycle.
The component already re-renders when state changes.

## Builder: `.punc()`

Two calling conventions:

```typescript
// Bare — default trailing-clause behavior
punc(): ClauseBuilder

// Config object — custom display and/or visibility
punc(config: {
  display?: (context: SentenceContext) => string;
  present?: (context: SentenceContext) => boolean;
}): ClauseBuilder
```

### Bare: `punc()`

Default behavior:

1. If the owning clause is not present or not active → render nothing
2. If any subsequent clause in the sentence is present and active → `,`
3. Otherwise (this clause is last active in the sentence) → `.`

"Subsequent" means all clauses that appear after this one in definition
order, across the entire sentence (not just the current line). The
typical use of `punc()` is to terminate a line — and the last active
line's last active clause should get a period. Cross-line lookahead
makes this work without consumers needing to think about which line
they're on.

### Config: `punc({ display, present })`

- **`display`** — `(context: SentenceContext) => string`. Returns the
  character(s) to render. Empty string → render nothing. Overrides the
  default comma/period logic entirely — the consumer controls the output
  but cannot inspect clause activation (that's internal). Receives the
  same `SentenceContext` as keyword labels, prefix/suffix, etc.
- **`present`** — `(context: SentenceContext) => boolean`. When false,
  the segment is not rendered at all. Defaults to "owning clause is
  present and active" (resolved internally, not via this predicate).

Both fields are optional. `punc({})` behaves identically to `punc()`.

Example — always comma, never period:

```typescript
.punc({
  display: () => ',',
})
```

### Implementation

`punc()` pushes a TextSegment with function-valued `value` and `present`.

**Post-build binding problem**: The default resolver needs the full
`SentenceDefinition` (to know line grouping and clause order), but the
definition isn't complete until `.build()` is called. Two options:

1. **Sentinel + post-build pass**: `.punc()` pushes a marker segment.
   `sentence().build()` walks all segments and replaces markers with
   bound resolver functions that close over the completed definition.

2. **Runtime lookup**: The resolver receives `SentenceState`, which
   doesn't include the definition. We could change the signature to also
   pass the definition — but that changes the contract.

**Chosen: option 1** — sentinel marker replaced at build time. The
segment stores a `__punctuation: { clauseId, config }` marker during
building; `sentence().build()` replaces it with a properly-bound
function. This keeps the runtime contract clean (`value` is always
`string | ((state) => string)` after build) and the post-build pass
is O(segments).

### Utility function

```typescript
function resolveDefaultPunctuation(
  clauseId: string,
  subsequentIds: string[],  // precomputed at build time
  state: SentenceState,
): string {
  const clauseState = state.clauses[clauseId];
  if (!clauseState?.present || !clauseState?.active) return '';

  const anySubsequentActive = subsequentIds.some(id => {
    const cs = state.clauses[id];
    return cs && cs.present && cs.active;
  });

  return anySubsequentActive ? ',' : '.';
}
```

The `subsequentIds` array is precomputed once during `sentence().build()`
and captured in the resolver closure — no per-render allocations. If
`definition.lines` is undefined (no explicit `.line()` calls), the build
pass falls back to `definition.clauses.map(c => c.id)`.

## Demo Application

Current hardcoded punctuation in the demo sentence:

| Clause | Current | Should be |
|--------|---------|-----------|
| dayOfWeek | `.text(',')` | `.punc()` — comma when followed, period when last on line |
| dayOfMonth | (none) | `.punc()` — same logic |
| monthOfQuarter | (none after `month`) | `.punc()` — same |
| monthOfYear | (none) | `.punc()` — same |
| anchorDate | `.text(',')` | `.punc()` — comma when timeOfDay follows, period when last |
| timeOfDay | `.text(',')` | `.punc()` — comma when dueMeasure follows, period when last |
| verb | `.text('.')` | `.punc()` — period when dueMeasure absent, comma when present |
| dueMeasure | (none) | `.punc()` — always period (always last) |

After this change, all eight clauses use `.punc()` with the default
resolver. No custom functions needed for the demo — the default
"comma when followed, period when last" handles every case.

## Tradeoffs

**Function receives SentenceState vs SentenceContext**

The internal resolver uses `SentenceState` (needs clause presence). The
consumer-facing `display` config uses `SentenceContext` (consistent with
every other consumer predicate). This split means consumers can customize
the character based on chip values but cannot inspect clause activation
directly. The default resolver handles the activation logic internally.

Trade: a consumer who wants "?" when sentence-final can't express that
through `display` alone, since they can't check clause presence. For v1
this is acceptable — use a static `.text('?')` for exotic cases. A
future `position` flag on the `display` callback would solve this
cleanly (deferred to post-release punctuation pass).

**Default resolver vs always-explicit**

A default resolver that does "comma/period based on subsequent clause
activity" covers ~90% of punctuation use cases. The alternative — always
requiring an explicit function — is more transparent but verbose. Since
`.punc()` is sugar for the common case and `.punc({ display })` is the
escape hatch, both camps are served.

Revisit if: the default behavior surprises users (e.g., a mid-sentence
clause that wants no punctuation when last — use `punc({ display })`
for those cases).

**Config object vs function argument**

The wishlist asks for `punc({ display, present })` — a config object
with named fields. The alternative is a bare function argument:
`punc((state) => string)`. The config object wins because: (1) it
mirrors the pattern used by other builder methods (`.chip()` options,
`.contingentOn()` object form), (2) it keeps `display` and `present` as
separate concerns rather than collapsing them into one function, and (3)
it's extensible if we ever need more fields. The bare `punc()` form
handles the common case without either.

**`punc()` vs `punctuation()`**

Terse name. `punc` is typed hundreds of times across sentence configs;
`punctuation` adds 8 characters with zero clarity gain. Consistent with
the project's direction toward shorter builder names (`punc` joins
`text`, `chip`, `line`).

**Sentinel + post-build pass vs runtime definition lookup**

The sentinel approach adds a build-time step but keeps the runtime type
clean. The alternative (passing definition to resolvers at render time)
would mean `value: (state, definition) => string`, which complicates the
general-purpose dynamic text feature for the sake of one convenience
method. Sentinels are internal — consumers never see them.

**`present` on punc() vs `present` on TextSegment**

Both receive `SentenceContext` now. The `present` field on `punc()`
config is consumer-facing and follows the same convention. The default
clause-activation check (render nothing when clause is inactive) is
handled internally by the resolver, not via the `present` predicate.

## Resolved Questions

1. **Dormant display**: Empty — no punctuation in dormant mode. The
   correct character varies by position (comma vs period) and that level
   of configuration isn't worth the complexity. All-comma or all-period
   would look wrong. No override mechanism needed.

2. **Leading text adjustment**: Existing clause CSS gap handles spacing.
   No changes needed.

## Out of Scope

- General "computed text" segments (text derived from chip values). This
  design enables it as a side effect (function-valued `value`), but the
  motivating feature is punctuation only.
- Per-line punctuation scoping. Default resolver looks across the whole
  sentence; `punc({ display })` handles exotic per-line needs.
- Semicolons, colons, or other non-comma/period delimiters in the default
  resolver. Custom functions handle exotic cases.
