# riff/demo-prep

Pre-release riff sweep: display chip mode, screen reader support, demo import/export, builder DX wishlist.

Started: 2026-05-28

---

## Note 1: Readonly chip mode (superseded)

Superseded by display chip design (feature/display-chip-mode). Merged to main.

## Note 2: Screen reader support

ARIA semantic layer on top of existing keyboard navigation. Six changes:

1. **aria-invalid** on Chip trigger when `valid === false` — announces error state
2. **aria-controls** linking Chip trigger to popup via `id="chipper-popup-{chipId}"` — semantic association
3. **aria-live="polite"** on ReferencePopup items container — announces loading/error/empty state changes
4. **aria-valuemin/max/now** on NumericInput — announces numeric bounds and current value
5. **.chipper-sr-only** utility class in _base.scss — visually hidden, screen-reader accessible
6. **:focus-visible** on alt-coordinate tabs — visual focus ring (deferred from keyboard-navigation)

## Note 3: Builder DX wishlist

Three items remain from `.meta/inbox/devex-wishlist.md`. Clause ergonomics
scratched — feels good as-is.

### A. `.chip()` positional arg footgun

The builder already has defensive code — detects object in second arg and
shifts it to options:

```typescript
chip(id: string, domainName?: string | ChipOptions, options?: ChipOptions) {
  if (typeof domainName === 'object' && domainName !== null) {
    options = domainName;
    domainName = undefined;
  }
  // ...
}
```

This works at runtime but the type signature is misleading. The standalone
`chip()` export doesn't have this detection — it requires the explicit
three-arg form.

**Proposal**: Make the standalone `chip()` match the builder method — accept
`string | ChipOptions` in the second position and shift when it's an object.
This is the only change needed; the builder already handles it. No breaking
change — just widens what's accepted.

### B. Predicate helpers

Current patterns in demo/App.tsx:
- `(ctx) => !isNaN(Number(ctx.cadenceMeasure))` — is this a number?
- `(ctx) => ['daily', 'weekday', 'weekend'].includes(ctx.cadenceMeasure as string)` — is this one of these values?
- `(ctx) => ctx.cadenceUnit === 'quarter'` — equality (already clean)

**Proposal**: Two helpers exported from chipper:

```typescript
/** True when the context value for `key` is a numeric string. */
function isNumeric(key: string): (ctx: SentenceContext) => boolean;

/** True when the context value for `key` is one of the given values. */
function isOneOf(key: string, ...values: string[]): (ctx: SentenceContext) => boolean;
```

Usage:
```typescript
.chip('cadenceUnit', 'timeUnit', { present: isNumeric('cadenceMeasure') })
.punc({ present: isOneOf('cadenceMeasure', 'daily', 'weekday', 'weekend') })
```

These return predicate functions — they compose with `present`,
`contingentOn`, and `.punc({ present })` with no API changes.

### C. Config/options naming standardization

Current state is split:
- **Domain factories** use `config` param + `*Config` types
  (TextDomainConfig, NumberDomainConfig, etc.)
- **Builder methods** use `options` param + `*Options` types
  (ChipOptions, TextOptions, LineOptions)
- **Exception**: `punc()` uses `PuncConfig` — should be `PuncOptions`
  to match other builder methods

The split is actually semantic: domain factories configure the domain
(heavy, structural), builder methods take options for a single call (light,
modifier). That's a real distinction worth keeping.

**Proposal**: Rename `PuncConfig → PuncOptions` and the `punc(config?)`
param to `punc(options?)`. One rename, no behavior change. Aligns punc
with the rest of the builder API.
- Agreed
