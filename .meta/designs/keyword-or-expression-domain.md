---
Status: accepted
Date: 2026-05-12
Accepted: 2026-05-12
Assessment: ../assessments/v1-feature-scope.md
---

# keywordOrExpressionDomain — Desired State

The second domain archetype: keywords for common values, a text input for everything else. This is the highest-unlock-value archetype — it covers time, due, task name, description, number, start, and collate name in Praxis, plus any consumer domain where the value space is "a few presets plus freeform."

The implementation follows the factory pattern established by `enumDomain` (domain-factories.md): a config interface, a factory function that calls `createDomain<T>`, and a popup component routed by `ChipPopup`.

---

## 1. Data Model

### Value Type

The domain is `Domain<string>`. All values — whether from a keyword or typed in — are strings. Consumers who need structured values (numbers, dates) parse on their side or use a custom `validate`/`display`. Keeping `T = string` matches `enumDomain` and avoids a union type that complicates the state reducer.

### ExpressionMode

The architecture doc defines `ExpressionMode<T>` with `id`, `label`, `degreesOfFreedom`, `validate`, and `display`. For keyword-or-expression, there's exactly one expression mode: text input.

The factory creates this expression mode internally from the config. Consumers don't assemble `ExpressionMode` objects — they provide input constraints and the factory does the rest.

### Config Interface

```typescript
interface KeywordOrExpressionDomainConfig {
  /** Semantic color key */
  color: string;

  /** Preset values shown as keyword pills in the popup */
  keywords?: Keyword<string>[];

  /** Expression mode configuration */
  expression: {
    /** Placeholder text for the input field */
    placeholder?: string;

    /** Maximum character length (omit for unlimited) */
    maxLength?: number;

    /** Validate typed input (beyond non-empty). Return true if valid. */
    validate?: (value: string) => boolean;

    /** Format the value for chip trigger display (default: identity) */
    display?: (value: string) => string;
  };

  /** Default value. Empty string if omitted (invalid → placeholder). */
  defaultValue?: string;

  /** Text shown in chip trigger when value is invalid */
  placeholder?: string;

  /** Context pass-throughs (same as enumDomain) */
  consumes?: string[];
  produces?: string[];
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}
```

What's different from `EnumDomainConfig`:
- `keywords` is optional (expression-only domains like task name have no presets)
- `expression` is required — this is what makes it keyword-*or*-expression
- `expression.validate` is separate from the domain-level validate (explained below)

### Factory Implementation

```typescript
function keywordOrExpressionDomain(
  config: KeywordOrExpressionDomainConfig
): Domain<string> {
  const validKeywordValues = new Set(
    (config.keywords ?? []).map((k) => k.value)
  );
  const labelByValue = new Map(
    (config.keywords ?? []).map((k) => [k.value, k.label])
  );

  const expressionValidate = config.expression.validate ?? ((v) => v.length > 0);
  const expressionDisplay = config.expression.display ?? ((v) => v);

  // Domain-level validate: value is valid if it matches a keyword OR passes expression validation
  const validate = (value: string): boolean =>
    validKeywordValues.has(value) || expressionValidate(value);

  // Domain-level display: keyword label if matched, else expression display
  const display = (value: string): string =>
    labelByValue.get(value) ?? expressionDisplay(value);

  const expressionMode: ExpressionMode<string> = {
    id: 'text',
    label: config.expression.placeholder ?? 'Type a value',
    degreesOfFreedom: 1,
    validate: expressionValidate,
    display: expressionDisplay,
  };

  return createDomain<string>({
    type: 'keyword-or-expression',
    color: config.color,
    keywords: config.keywords,
    expressionModes: [expressionMode],
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
  });
}
```

### Validation Chain

Two levels of validation, both on the happy path:

1. **Keyword match** — if the value is in the keyword set, it's valid. No further check.
2. **Expression validation** — if not a keyword, run `expression.validate`. Default: non-empty string.

This means a keyword value is *always* valid, even if it would fail expression validation. Keywords are pre-approved presets. Expression validation only gates freeform input.

---

## 2. Popup Component: KeywordOrExpressionPopup

### Layout

```
┌──────────────────────────────┐
│  ┌──────┐ ┌──────────┐      │  ← keyword pills (if any)
│  │ morning │  │ afternoon │      │
│  └──────┘ └──────────┘      │
│  ┌──────┐ ┌────────┐        │
│  │ evening │  │ night  │        │
│  └──────┘ └────────┘        │
│                              │
│  ┌────────────────────────┐  │  ← text input (always present)
│  │ type a custom value... │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

Keywords on top, input below. Keywords are high-value shortcuts — the most common choices should be closest to the click. The input is always available for custom values.

If there are no keywords (expression-only domain), the popup is just the input field.

### Component

```typescript
// src/components/popups/KeywordOrExpressionPopup.tsx

interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  value: string;
  expressionMode: ExpressionMode<string>;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function KeywordOrExpressionPopup({
  keywords,
  value,
  expressionMode,
  onSelect,
  onClose,
}: KeywordOrExpressionPopupProps) {
  const [inputValue, setInputValue] = useState(
    // Pre-fill if current value is not a keyword (i.e., was typed)
    isKeywordValue(value, keywords) ? '' : value
  );

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed && expressionMode.validate(trimmed)) {
      onSelect(trimmed);
      onClose();
    }
  };

  return (
    <div className="chipper-koe-popup">
      {keywords.length > 0 && (
        <div className="chipper-koe-popup__keywords">
          {keywords.map((keyword) => (
            <button
              key={keyword.value}
              type="button"
              role="option"
              className={[
                'chipper-koe-popup__option',
                keyword.value === value && 'chipper-koe-popup__option--selected',
              ].filter(Boolean).join(' ')}
              aria-selected={keyword.value === value}
              onClick={() => {
                onSelect(keyword.value);
                onClose();
              }}
            >
              {keyword.label}
            </button>
          ))}
        </div>
      )}
      <div className="chipper-koe-popup__input-row">
        <input
          type="text"
          className="chipper-koe-popup__input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder={expressionMode.label}
          maxLength={/* from config, if set */}
          autoFocus={keywords.length === 0}
        />
      </div>
    </div>
  );
}
```

### Interaction Model

- **Auto-focus** the input on popup open
- **Enter** submits the typed value (if valid)
- **Click keyword** selects that keyword and closes
- **Escape** closes without changing value (handled by ChipPopup)
- **Outside click** closes without changing (handled by ChipPopup)
- Input pre-fills with current value if it was typed (not a keyword)
- Input clears if current value is a keyword (user already has a selection, typing means they want to change to something custom)

### Close-on-Select Behavior

Keywords close immediately (same as EnumPopup — single click, done). Expression input closes on Enter. This keeps the interaction tight: click or type, never both.

---

## 3. ChipPopup Routing

Add a case to the switch in `ChipPopup.tsx`:

```typescript
case 'keyword-or-expression':
  return (
    <KeywordOrExpressionPopup
      keywords={domain.keywords}
      value={value as string}
      expressionMode={domain.expressionModes[0]}
      onSelect={onSelect as (value: string) => void}
      onClose={onClose}
    />
  );
```

The domain always has exactly one expression mode at index 0 (enforced by the factory).

---

## 4. Styles

New BEM block: `chipper-koe-popup` (keyword-or-expression).

### _base.scss additions

```scss
.chipper-koe-popup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 12rem;
}

.chipper-koe-popup__input-row {
  display: flex;
}

.chipper-koe-popup__input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: inherit;
}

.chipper-koe-popup__keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chipper-koe-popup__option {
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
}
```

### _components.scss additions

```scss
.chipper-koe-popup__input {
  border: 1px solid var(--chipper-border);
  border-radius: 0.5rem;
  background: var(--chipper-bg-elevated);
  color: var(--chipper-text-primary);
  font-family: var(--chipper-font);
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--chipper-accent);
    box-shadow: var(--chipper-focus-ring);
  }

  &::placeholder {
    color: var(--chipper-text-muted);
  }
}

.chipper-koe-popup__option {
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: var(--chip-trigger-color-bg, var(--chipper-bg-secondary));
  color: var(--chip-trigger-color-text, var(--chipper-text-primary));
  font-family: var(--chipper-font);
  font-size: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--chip-trigger-color-text, var(--chipper-accent));
  }

  &--selected {
    background: var(--chip-trigger-color-text, var(--chipper-accent));
    color: var(--chip-trigger-color-bg, var(--chipper-bg-elevated));
    border-color: var(--chip-trigger-color-text, var(--chipper-accent));
    font-weight: 500;
  }
}
```

Keyword pills follow the same pattern as EnumPopup options: domain-colored, inverted on selection. The input field uses accent for focus, matching the chip's expanded state glow.

---

## 5. Demo Update

Update the demo sentence to exercise keyword-or-expression alongside enum. Replace the single-chip "Wake me up when [month] ends" with a two-chip sentence:

```typescript
const demoPalette = extendPalette({
  domains: {
    month: enumDomain({
      color: 'copper',
      keywords: months.map((m) => ({ label: m, value: m.toLowerCase() })),
      placeholder: 'a month',
    }),
    alarm: keywordOrExpressionDomain({
      color: 'slate',
      keywords: [
        { label: 'my alarm', value: 'my alarm' },
        { label: 'the fire alarm', value: 'the fire alarm' },
        { label: 'the national anthem', value: 'the national anthem' },
      ],
      expression: {
        placeholder: 'something specific',
        maxLength: 100,
      },
      placeholder: 'something',
    }),
  },
});

const demoSentence = sentence(demoPalette)
  .clause('when', clause()
    .required()
    .text('Wake me up when')
    .chip('month', 'month')
    .text('ends. Play')
    .chip('alarm', 'alarm')
    .text('.'))
  .build();
```

This gives the demo page two chips with different archetypes: an enum (month) and a keyword-or-expression (what to play). The visitor sees both interaction patterns in one sentence.

---

## 6. File Structure

```
src/domains/
  create-domain.ts           — (existing) shared base
  enum.ts                    — (existing) enumDomain
  keyword-or-expression.ts   — (new) keywordOrExpressionDomain + config
  index.ts                   — (update) re-export new factory

src/components/popups/
  EnumPopup.tsx              — (existing)
  KeywordOrExpressionPopup.tsx — (new) input + keyword pills

src/components/
  ChipPopup.tsx              — (update) add routing case

src/styles/
  _base.scss                 — (update) structural rules for koe-popup
  _components.scss           — (update) visual rules for koe-popup
```

### Exports

`keywordOrExpressionDomain` and `KeywordOrExpressionDomainConfig` added to `src/domains/index.ts` and `src/index.ts`.

---

## 7. Tests

Following the pattern from `tests/domains/enum.test.ts`:

```
tests/domains/keyword-or-expression.test.ts
  ✓ creates domain with type 'keyword-or-expression'
  ✓ validates keyword values
  ✓ validates expression values (non-empty)
  ✓ rejects empty string
  ✓ displays keyword label for keyword values
  ✓ displays raw value for expression values
  ✓ custom expression validate
  ✓ custom expression display
  ✓ default value is empty string when omitted
  ✓ keywords optional (expression-only domain)
  ✓ has exactly one expression mode
  ✓ expression mode validate/display match config

tests/components/keyword-or-expression-popup.test.tsx
  ✓ renders input field
  ✓ renders keyword pills when keywords present
  ✓ no keyword section when keywords empty
  ✓ selects keyword on click
  ✓ submits expression on Enter
  ✓ rejects invalid expression on Enter
  ✓ pre-fills input with current value if not a keyword
  ✓ clears input if current value is a keyword
  ✓ auto-focuses input on mount
```

---

## Tradeoffs

### Input position: keywords first, input below
Keywords on top, input field below. Keywords are high-value shortcuts — in Praxis use cases like "on the [first / last / 15th] of each month," the keyword is more likely than freeform input. Put the most common choice closest to the click. Expression-only domains (no keywords) just show the input field.

### expressionDomain as sugar, not a separate archetype
Optional keywords in koe is sufficient internally. But new users will reach for expression-only chips first (task title, description, etc.), and `keywordOrExpressionDomain` is a mouthful for that use case. Ship `expressionDomain` as a convenience alias: same factory, empty keywords, streamlined config surface. Implementation is trivial but the tutorial experience matters.

### Value type: `string` vs `string | T`
Could allow the expression mode to produce a different type than keywords (e.g., keywords produce named presets, expression produces a number). Rejected for v1 — it complicates the state reducer (ChipState would need a union type) and validation (which validator to call?). String handles all current use cases. Consumers who need structured values can parse in a custom `display`/`validate`. Would revisit for numeric expression mode if string-parsing proves too awkward.

### Separate `expression.validate` vs domain-level `validate` only
Could have one validate function that handles both keyword and expression values. Chose two levels because: (a) keyword values are pre-approved by definition, (b) expression validation often has constraints (maxLength, pattern) that don't apply to keywords, (c) consumers providing `expression.validate` shouldn't need to re-check keyword membership. The factory composes them — consumers configure the expression constraint, factory handles the OR logic.

### BEM block naming: `chipper-koe-popup` vs `chipper-keyword-expression-popup`
`koe` is terse but cryptic. `keyword-expression` is long but readable. Going with `chipper-koe-popup` — it's an internal CSS class, not a public API. Developers reading the SCSS will see the file name `KeywordOrExpressionPopup.tsx` immediately above. Would switch to the verbose name if open-source contributors find it confusing.

## Open Questions

1. **maxLength enforcement.** — RESOLVED. Hard limit via HTML `maxlength` attribute. Simpler, truncation is fine for single-line inputs. Textarea variants (description chip, out of scope) would want soft limit with character count.

## Out of Scope

- **Textarea variant.** Description chip needs multiline input. That's a separate popup component (or a `multiline: true` flag) — not this design.
- **Numeric stepper variant.** Number chip needs +/- buttons. That's the numeric expression mode from the v1 assessment — a different expression mode, not this archetype.
- **Input validation feedback.** Visual error state on the input (red border, error text) when expression.validate fails. Good idea, but adds complexity — defer to a polish pass.
- **Debounced validation.** For expression.validate functions that are expensive (regex, async). Not needed for v1's simple validators.
- **Keyboard navigation between keywords.** Arrow keys to move between keyword pills. Covered by the keyboard navigation feature (separate work item).
