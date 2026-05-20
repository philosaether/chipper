/**
 * AlternativeCoordinatePopup — tabbed popup with slot-based selection.
 *
 * Each tab renders one mode's slots. Single-slot modes close on keyword
 * select (like enum). Multi-slot modes stay open until all slots are
 * filled, then auto-close. Expression submission always closes.
 */

import { useState } from 'react';
import type { AlternativeCoordinateMode } from '../../domains/alternative-coordinate';

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

  return (
    <div className="chipper-alt-coord-popup">
      {modes.length > 1 && (
        <div className="chipper-alt-coord-popup__tabs" role="tablist">
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
        {activeMode.slots.map((slot, slotIndex) => (
          <div key={slotIndex} className="chipper-alt-coord-popup__slot">
            <div className="chipper-alt-coord-popup__slot-keywords">
              {slot.prefix && (
                <span className="chipper-alt-coord-popup__slot-prefix">
                  {slot.prefix}
                </span>
              )}
              {slot.keywords.map((keyword) => {
                const isSelected = slotSelections[slotIndex] === keyword.value;
                return (
                  <button
                    key={keyword.value}
                    type="button"
                    role="option"
                    className={[
                      'chipper-popup-option',
                      isSelected && 'chipper-popup-option--selected',
                    ].filter(Boolean).join(' ')}
                    aria-selected={isSelected}
                    onClick={() => handleSlotSelect(slotIndex, keyword.value)}
                  >
                    {typeof keyword.label === 'function' ? keyword.label({}) : keyword.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {activeMode.expression && (
          <div className="chipper-alt-coord-popup__expression">
            <input
              type="text"
              className="chipper-koe-popup__input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExpressionSubmit();
              }}
              placeholder={activeMode.expression.placeholder}
              maxLength={activeMode.expression.maxLength}
            />
          </div>
        )}
      </div>
    </div>
  );
}
