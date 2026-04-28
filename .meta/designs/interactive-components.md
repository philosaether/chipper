---
Status: accepted
Date: 2026-04-28
Accepted: 2026-04-28
Implemented: 2026-04-28 (feature/demo-page)
Divergences: Clause uses segments array (resolves design's open question about interleaved text/chips); per-domain color via inline CSS variable instead of BEM modifier per color key
Deferred: ClauseToggle, popup arrow-key navigation, JS popup positioning
Assessment: assessments/vertical-slice.md (archived)
---

# Interactive Components — Desired State

Stage 4 of the vertical slice. Five React components that render a Chipper sentence with clickable chips and an enum popup. These components use the Stage 3 hooks internally — they're the default UI that consumers get out of the box.

---

## 1. Volatility Decomposition

| Concern | Volatile or Stable | Where it lives |
|---------|-------------------|----------------|
| Component tree shape (provider → sentence → clause → chip) | Stable | Component files — structural skeleton |
| How a chip trigger renders (button, classes, text) | Stable | `Chip.tsx` — same pattern for all domains |
| How an enum popup renders its keyword list | Stable | `EnumPopup.tsx` — list of buttons |
| Which popup renders for which domain archetype | Volatile | `ChipPopup.tsx` — switches on `domain.type` |
| Popup positioning (above/below, flip) | Stable | `ChipPopup.tsx` — CSS-driven, not JS |
| BEM class names and CSS custom properties | Stable | Already defined in `chipper.css` |
| Keyboard navigation within popups | Stable | `ChipPopup.tsx` — Escape to close, arrow keys in popup |

The components are thin. State logic lives in hooks; display logic lives in CSS. The components are glue.

---

## 2. Component Tree

```
<Chipper sentence={def} onChange={fn}>         ← auto-render entry point
  <SentenceProvider definition={def} onChange={fn}>
    <Sentence>                                  ← renders clause list
      <Clause clauseId="when">                  ← lead text + chips
        <Chip clauseId="when" chipId="month" /> ← trigger button + popup
      </Clause>
      <Clause clauseId="ends">
      </Clause>
    </Sentence>
  </SentenceProvider>
</Chipper>
```

`<Chipper>` is the convenience wrapper. It renders `<SentenceProvider>` and `<Sentence>` so consumers write one component. Consumers who need custom layouts skip `<Chipper>` and compose `<SentenceProvider>`, `<Clause>`, and `<Chip>` directly.

---

## 3. Components

### Chipper (update existing)

The existing skeleton becomes the real auto-render entry point. It wraps `SentenceProvider` → `Sentence`.

```typescript
interface ChipperProps {
  sentence: SentenceDefinition;
  onChange?: (state: SentenceState) => void;
  children?: React.ReactNode;
}
```

If `children` is provided, render them inside the provider (for `<ChipperDebug>` or custom layout). Otherwise, render `<Sentence>` automatically.

**File:** `components/Chipper.tsx` (update existing)

### Sentence

Reads the definition from context and renders each clause. Owns the sentence-level `<div>`.

```tsx
function Sentence() {
  const { definition } = useSentence();

  return (
    <div className="chipper-sentence">
      {definition.clauses.map((clauseDef) => (
        <Clause key={clauseDef.id} clauseId={clauseDef.id} />
      ))}
    </div>
  );
}
```

No props — everything comes from context. This is intentional: the component's job is to read the sentence structure and render it. No configuration knobs.

**File:** `components/Sentence.tsx` (new)

### Clause

Renders lead text and its chips. For the vertical slice, all clauses are required and active — no toggle UI yet.

```tsx
function Clause({ clauseId }: { clauseId: string }) {
  const { definition } = useSentence();
  const clauseDef = definition.clauses.find((c) => c.id === clauseId);

  if (!clauseDef) return null;

  return (
    <div className="chipper-clause">
      {clauseDef.lead && (
        <span className="chipper-clause__lead">{clauseDef.lead}</span>
      )}
      {clauseDef.chips.map((chipDef) => (
        <Chip key={chipDef.id} clauseId={clauseId} chipId={chipDef.id} />
      ))}
    </div>
  );
}
```

**Future:** When `TOGGLE_CLAUSE` lands, this component will add a `<ClauseToggle>` for optional clauses and show/hide based on `clauseState.active`. That's not in scope for the vertical slice.

**File:** `components/Clause.tsx` (new)

Question (possibly out of scope):
- Not all clauses are of the form {lead} [chip]. Some have multiple chips, and multiple plaintext spans.
  - "Every [2] [weeks] on [Monday]" has both "Every" and "on" rendered between chips. 
  - A plain number chip is likely to specify units after the chip: "Skip [5] iterations."
- Does the ClauseDef support this atm?

### Chip

The trigger button + popup anchor. This is where hooks meet DOM.

```tsx
function Chip({ clauseId, chipId }: { clauseId: string; chipId: string }) {
  const { value, displayValue, valid, dirty, domain, chipDefinition, setValue } =
    useChip(clauseId, chipId);
  const { popup, open, close, isOpen } = usePopup();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isInteractive = chipDefinition.mode.type === 'interactive';
  const showPopup = isOpen(chipId);
  const showPlaceholder = !valid;

  const handleClick = () => {
    if (!isInteractive) return;
    if (showPopup) {
      close();
    } else {
      open(clauseId, chipId, triggerRef.current!);
    }
  };

  // BEM modifier classes
  const triggerClasses = [
    'chipper-chip-trigger',
    `chipper-chip-trigger--${domain.color}`,
    showPlaceholder && 'chipper-chip-trigger--placeholder',
    showPopup && 'chipper-chip-trigger--expanded',
    !isInteractive && 'chipper-chip-trigger--readonly',
  ].filter(Boolean).join(' ');

  return (
    <span className="chipper-chip">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
        onClick={handleClick}
        aria-expanded={showPopup}
        aria-haspopup="listbox"
      >
        <span className="chipper-chip-trigger__text">
          {displayValue}
        </span>
      </button>
      {showPopup && (
        <ChipPopup
          clauseId={clauseId}
          chipId={chipId}
          domain={domain}
          value={value}
          onSelect={setValue}
          onClose={close}
        />
      )}
    </span>
  );
}
```

Key points:
- The trigger ref is passed to `usePopup.open()` so the popup can position relative to it.
- The popup renders conditionally — not hidden with CSS, but unmounted when closed.
- `aria-expanded` and `aria-haspopup` for accessibility (AA baseline).
- The `--{domain.color}` modifier class enables per-domain color theming via CSS.

**File:** `components/Chip.tsx` (new)

### ChipPopup

Popup container. Positions itself below the trigger, renders the appropriate archetype popup based on `domain.type`, and handles Escape-to-close + outside-click.

```tsx
interface ChipPopupProps {
  clauseId: string;
  chipId: string;
  domain: Domain;
  value: unknown;
  onSelect: (value: unknown) => void;
  onClose: () => void;
}

function ChipPopup({ domain, value, onSelect, onClose }: ChipPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid closing immediately from the trigger click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Route to archetype-specific popup
  const popupContent = () => {
    switch (domain.type) {
      case 'enum':
        return (
          <EnumPopup
            keywords={domain.keywords}
            value={value}
            onSelect={onSelect}
          />
        );
      default:
        return <div>Unsupported domain type: {domain.type}</div>;
    }
  };

  return (
    <div
      ref={popupRef}
      className="chipper-popup chipper-popup--open"
      role="listbox"
    >
      {popupContent()}
    </div>
  );
}
```

The `switch` on `domain.type` is the extension point. Each new domain archetype adds a case here with its own popup component. For the vertical slice, only `enum` is handled.

**Positioning:** CSS-only for now (`position: absolute; top: 100%` in the existing CSS). The `.chipper-chip` wrapper has `position: relative`, so the popup drops below its trigger. No JS positioning logic — that's a Stage 5 refinement if the CSS approach doesn't handle edge cases.

**Outside click:** Uses `mousedown` (not `click`) so the popup closes before any other click handler fires. The `setTimeout(0)` prevents the trigger's own click from immediately closing the popup it just opened.

**File:** `components/ChipPopup.tsx` (new)

### EnumPopup

Keyword list for pure enum domains. Simple: render a button for each keyword, highlight the current selection.

```tsx
interface EnumPopupProps {
  keywords: Keyword[];
  value: unknown;
  onSelect: (value: unknown) => void;
}

function EnumPopup({ keywords, value, onSelect }: EnumPopupProps) {
  return (
    <div className="chipper-enum-popup">
      {keywords.map((keyword) => (
        <button
          key={keyword.label}
          type="button"
          role="option"
          className={[
            'chipper-enum-popup__option',
            keyword.value === value && 'chipper-enum-popup__option--selected',
          ].filter(Boolean).join(' ')}
          aria-selected={keyword.value === value}
          onClick={() => onSelect(keyword.value)}
        >
          {keyword.label}
        </button>
      ))}
    </div>
  );
}
```

Selection behavior: clicking a keyword calls `onSelect(keyword.value)` which dispatches `SET_CHIP_VALUE`. The `Chip` component doesn't auto-close the popup on selection — that's the `EnumPopup`'s responsibility, since it's a single-select domain:

```tsx
onClick={() => {
  onSelect(keyword.value);
  // For EnumPopup, close after selection
}}
```

Wait — the popup doesn't have `onClose`. Let me reconsider. The `onClose` lives on `ChipPopup`, not `EnumPopup`. Two options:

**Option A:** Pass `onClose` down to `EnumPopup` so it can close after selection.
**Option B:** `ChipPopup` wraps `onSelect` to auto-close after selection for single-select domains.

Option A is simpler and more explicit. Each archetype popup knows its own selection semantics — enum closes after pick, multi-select stays open. Pass `onClose` through:
- Good reasoning

```tsx
// In ChipPopup:
<EnumPopup keywords={domain.keywords} value={value} onSelect={onSelect} onClose={onClose} />

// In EnumPopup:
onClick={() => { onSelect(keyword.value); onClose(); }}
```

**File:** `components/popups/EnumPopup.tsx` (new)

---

## 4. Closing the Outside-Click Gap

The trigger's click handler toggles the popup. The popup's outside-click handler closes it. These could conflict: clicking the trigger while a popup is open fires both handlers.

The `Chip` component handles this explicitly: `handleClick` checks `isOpen(chipId)` — if the popup is already open for *this* chip, it closes it. If it's closed (or open for a different chip), it opens it. The singleton `usePopup.open()` handles the "different chip" case by replacing the state.

The outside-click handler's `setTimeout(0)` ensures it doesn't register the triggering click as an "outside" click.

---

## 5. File Structure

```
components/
├── Chipper.tsx            — Auto-render entry point (update existing)
├── Sentence.tsx           — Renders clause list from definition
├── Clause.tsx             — Lead text + chips for one clause
├── Chip.tsx               — Trigger button + popup mount point
├── ChipPopup.tsx          — Popup container: positioning, Escape, outside-click, archetype routing
├── popups/
│   └── EnumPopup.tsx      — Keyword list for enum domains
└── index.ts               — Re-exports (update existing)
```

### Exports

From `components/index.ts`:
- `Chipper` (existing, updated)
- `Sentence`, `Clause`, `Chip` (new — for custom layouts)
- `ChipPopup`, `EnumPopup` (new — not typically used directly, but available)

From `src/index.ts` — add `Sentence`, `Clause`, `Chip` to the public API.

---

## 6. CSS Additions

The existing `chipper.css` already covers most structural styles. Additions needed:

```css
/* Expanded trigger state */
.chipper-chip-trigger--expanded {
  border-color: var(--chip-border);
  background-color: color-mix(in srgb, var(--chip-bg), var(--chip-border) 15%);
}

/* Per-domain color modifiers (border tint when chip has a value) */
.chipper-chip-trigger--month { border-color: var(--chip-color-interval); }
/* ... one rule per color key used in the demo */

/* Enum popup */
.chipper-enum-popup {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 8rem;
}

.chipper-enum-popup__option {
  display: block;
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: var(--chip-radius);
  background: transparent;
  color: var(--chip-text);
  font-family: var(--chip-font);
  font-size: inherit;
  text-align: left;
  cursor: pointer;
}

.chipper-enum-popup__option:hover {
  background: color-mix(in srgb, var(--chip-bg), var(--chip-border) 20%);
}

.chipper-enum-popup__option--selected {
  background: color-mix(in srgb, var(--chip-bg), var(--chip-border) 30%);
  font-weight: 500;
}
```

The per-domain color approach: rather than generating a class for every possible color key, the chip trigger sets a CSS variable inline via `style` when the chip has a value:

```tsx
style={{ '--chip-trigger-color': `var(--chip-color-${domain.color})` } as React.CSSProperties}
```

Then one CSS rule uses it:

```css
.chipper-chip-trigger:not(.chipper-chip-trigger--placeholder) {
  border-color: var(--chip-trigger-color, var(--chip-border));
}
```

This avoids generating a BEM modifier for every possible color key. New colors work automatically.

---

## 7. Accessibility (AA Baseline)

| Element | Attribute | Value |
|---------|-----------|-------|
| Chip trigger | `aria-expanded` | `true` when popup open |
| Chip trigger | `aria-haspopup` | `"listbox"` |
| Popup container | `role` | `"listbox"` |
| Enum option | `role` | `"option"` |
| Enum option | `aria-selected` | `true` for current value |
| Popup | Escape key | Closes popup |

Keyboard arrow navigation within the popup is deferred — it's real work (focus management, roving tabindex) and not needed for the vertical slice demo. We'll add it before v1.
- Please note this as tech debt in in-progress.md so we don't forget

---

## 8. Vertical Slice Scope

For "Wake me up when [September] ends":
- `<Chipper>` wraps provider + sentence
- `<Sentence>` renders two clauses: "when" and "ends"
- `<Clause>` renders lead text + chips
- `<Chip>` renders the month trigger with placeholder "a month"
- Click trigger → `<ChipPopup>` → `<EnumPopup>` with January, February, September, December
- Click "September" → chip updates to show "September", popup closes
- Sentence becomes valid

All five components fully implemented for this scope. No stubs.

---

## Open Questions

None — constrained by architecture doc and preceding designs.

## Out of Scope

- `ClauseToggle` component — deferred until TOGGLE_CLAUSE
- Popup arrow-key navigation — pre-v1 accessibility work
- JS-based popup positioning / flip behavior — CSS-only for now
- Archetype popups beyond enum (keyword-expr, multi-select, etc.)
- Transition/animation on popup open/close
