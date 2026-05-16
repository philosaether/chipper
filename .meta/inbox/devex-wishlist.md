# Builder / DX Wishlist

Items to address in a dedicated draft cycle.

---

- **Palette rename**: `extendPalette({domains, clauseTemplates})` → `extendPalette({chips, patterns})`. Consumer-facing naming should match mental model (chips, not domains). Open question: rename public API only, or rename internal types too?
- **KOE keyword shorthand with display**: Allow `keywords: [{ value: 'daily', label: 'day', display: 'day of the week' }]`. `label` defaults to `value`, `display` defaults to `label`. Gives consumers control over popup label vs chip trigger text without a custom display function. Related to Keyword `displayLabel` from builder-notes.md.
- **defaultValue → default**: Rename in domain config. When unspecified, use first keyword by insertion order.
- **Expression inputType must be explicit**: Remove the default of 'text'. Consumer must specify what form of expression they want. Add sugar for common expression types (e.g., `numericExpression()`, `textExpression()`).
- **required() is already default**: Keep the method for explicit use, but `.optional()` is the only one that changes behavior. (NB: this is already how it works — just confirming it should stay this way.)
- **Chip ID as implicit domain name**: `.chip('id')` → `.chip('id', 'id')`. When domain name matches chip ID, omit the second arg.
- **produces() shorthand**: `.produces()` with no args → `.produces({ [clauseId]: clauseId })`. Clause produces its own ID as a context key, mapped to its own chip value.
- **Contingency at clause/chip/text level**: Currently contingency is clause-level only. Want to support contingent chips and contingent text spans within a clause (e.g., hide a text segment based on context). Major work — needs its own design cycle.
- **Clause definition ergonomics**: `.clause('id', clause())` is verbose. `.clause('id', builder())` (rename from builder-notes.md) isn't much better. Need a smoother idiom for the most frequently typed line of chipper config. Open design question — bring to draft cycle.
- **Architecture doc refresh**: chipper-architecture.md §3 and §4 are stale — still show `clause()`, `domains:`, no mention of lines, `displayLabel`, `default`, or expression helpers. Needs a pass to reflect builder-dx changes.
- **`.chip()` positional arg footgun**: `.chip('id', { present: ... })` passes the options object as `domainName`. When chip ID = domain name (common case), the consumer wants `.chip('id', { present })` but must write `.chip('id', undefined, { present })`. Consider: detect object in second arg and treat as options, or make options a named method (`.chip('id').when(predicate)`).
