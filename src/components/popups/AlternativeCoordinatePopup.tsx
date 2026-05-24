/**
 * AlternativeCoordinatePopup — tabbed popup with slot-based selection.
 *
 * Each tab renders one mode's slots. Single-slot modes close on keyword
 * select (like enum). Multi-slot modes stay open until all slots are
 * filled, then auto-close. Expression submission always closes.
 */

import { useState } from 'react';
import type { AlternativeCoordinateMode } from '../../domains/alternative-coordinate';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export interface AlternativeCoordinatePopupProps {
  modes: AlternativeCoordinateMode[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/**
 * Determine which mode matches the current value (for initial tab).
 * Tries decompose on each mode; falls back to first mode.
 */
function findMatchingModeIndex(modes: AlternativeCoordinateMode[], value: string): number {
  if (value === '') return 0;

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i]!;
    // Check single-slot keyword match
    if (mode.slots.length === 1) {
      if (mode.slots[0]!.keywords.some((k) => k.value === value)) return i;
    }
    // Check multi-slot decompose (single-slot decompose is always identity — skip)
    if (mode.slots.length > 1 && mode.decompose) {
      const parts = mode.decompose(value);
      if (parts.every((p) => p !== undefined)) return i;
    }
    // Check expression validate
    if (mode.expression?.validate) {
      if (mode.expression.validate(value)) return i;
    }
  }
  return 0;
}

/**
 * Initialize slot selections from decompose if the current value matches.
 */
function initSlotSelections(
  mode: AlternativeCoordinateMode,
  value: string,
): (string | undefined)[] {
  if (mode.decompose && value !== '') {
    const parts = mode.decompose(value);
    if (parts.every((p) => p !== undefined)) return parts;
  }
  return new Array(mode.slots.length).fill(undefined) as (string | undefined)[];
}

export function AlternativeCoordinatePopup({
  modes,
  value,
  onSelect,
  onClose,
}: AlternativeCoordinatePopupProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(
    () => findMatchingModeIndex(modes, value),
  );
  const activeMode = modes[activeTabIndex]!;

  // Per-slot selections for multi-slot modes.
  const [slotSelections, setSlotSelections] = useState<(string | undefined)[]>(
    () => initSlotSelections(activeMode, value),
  );

  // Expression input state
  const [inputValue, setInputValue] = useState('');

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    const mode = modes[index]!;
    setSlotSelections(initSlotSelections(mode, value));
    setInputValue('');
  };

  const handleSlotSelect = (slotIndex: number, keywordValue: string) => {
    const newSelections = [...slotSelections];
    newSelections[slotIndex] = keywordValue;
    setSlotSelections(newSelections);

    // If all slots are filled, compose and submit
    if (newSelections.every((s): s is string => s !== undefined)) {
      const composed = activeMode.compose(...newSelections);
      onSelect(composed);
      onClose();
    }
  };

  const handleExpressionSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const expressionValidate = activeMode.expression?.validate ?? ((v: string) => v.length > 0);
    if (expressionValidate(trimmed)) {
      onSelect(trimmed);
      onClose();
    }
  };

  // Flatten all slot keywords for arrow-key navigation
  const flatKeywords: { slotIndex: number; keyword: typeof activeMode.slots[0]['keywords'][0] }[] = [];
  for (let s = 0; s < activeMode.slots.length; s++) {
    for (const kw of activeMode.slots[s]!.keywords) {
      flatKeywords.push({ slotIndex: s, keyword: kw });
    }
  }

  const keyboard = useKeyboardNavigation({
    itemCount: flatKeywords.length,
    onSelect: (index) => {
      const item = flatKeywords[index]!;
      handleSlotSelect(item.slotIndex, item.keyword.value);
    },
    onClose,
    closeOnSelect: false, // multi-slot modes stay open until all filled
    idPrefix: 'chipper-alt-option',
  });

  // Tab switching via Left/Right on the tablist
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleTabChange(activeTabIndex > 0 ? activeTabIndex - 1 : modes.length - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleTabChange(activeTabIndex < modes.length - 1 ? activeTabIndex + 1 : 0);
    }
  };

  // Track flat index offset per slot for getOptionProps
  let flatIndexOffset = 0;

  return (
    <div
      className="chipper-alt-coord-popup"
      onKeyDown={!activeMode.expression ? keyboard.handleKeyDown : undefined}
      tabIndex={!activeMode.expression ? 0 : undefined}
      aria-activedescendant={!activeMode.expression ? keyboard.activeDescendantId : undefined}
    >
      {modes.length > 1 && (
        <div className="chipper-alt-coord-popup__tabs" role="tablist" onKeyDown={handleTabKeyDown}>
          {modes.map((mode, index) => (
            <button
              key={mode.id}
              type="button"
              role="tab"
              className={[
                'chipper-alt-coord-popup__tab',
                index === activeTabIndex && 'chipper-alt-coord-popup__tab--active',
              ].filter(Boolean).join(' ')}
              aria-selected={index === activeTabIndex}
              onClick={() => handleTabChange(index)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
      <div className="chipper-alt-coord-popup__content">
        {activeMode.slots.map((slot, slotIndex) => {
          const slotStartIndex = flatIndexOffset;
          flatIndexOffset += slot.keywords.length;
          return (
            <div key={slotIndex} className="chipper-alt-coord-popup__slot">
              <div className="chipper-alt-coord-popup__slot-keywords">
                {slot.prefix && (
                  <span className="chipper-alt-coord-popup__slot-prefix">
                    {slot.prefix}
                  </span>
                )}
                {slot.keywords.map((keyword, kwIndex) => {
                  const isSelected = slotSelections[slotIndex] === keyword.value;
                  const optionProps = keyboard.getOptionProps(slotStartIndex + kwIndex);
                  return (
                    <button
                      key={keyword.value}
                      type="button"
                      {...optionProps}
                      aria-selected={isSelected}
                      className={[
                        optionProps.className,
                        isSelected && 'chipper-popup-option--selected',
                      ].filter(Boolean).join(' ')}
                    >
                      {resolveKeywordLabel(keyword)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeMode.expression && (
          <div className="chipper-alt-coord-popup__expression">
            <input
              type="text"
              className="chipper-koe-popup__input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (keyboard.activeIndex >= 0) {
                    keyboard.handleKeyDown(e);
                  } else {
                    handleExpressionSubmit();
                  }
                } else {
                  keyboard.handleKeyDown(e);
                }
              }}
              placeholder={activeMode.expression.placeholder}
              maxLength={activeMode.expression.maxLength}
              aria-activedescendant={keyboard.activeDescendantId}
              role="combobox"
              aria-expanded={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
