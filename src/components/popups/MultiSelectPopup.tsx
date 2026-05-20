/**
 * MultiSelectPopup — toggle grid with optional group keyword shortcuts.
 *
 * Unlike enum/KOE popups, this popup stays open during selection.
 * The user toggles options freely and closes via outside-click,
 * Escape, or trigger re-click.
 */

import type { Keyword } from '../../core/types';
import { selectionMatchesKeyword } from '../../domains/multi-select';

export interface MultiSelectPopupProps {
  options: Keyword<string>[];
  keywords: Keyword<string[]>[];
  value: string[];
  maxSelections?: number;
  onSelect: (value: string[]) => void;
}

export function MultiSelectPopup({
  options,
  keywords,
  value,
  maxSelections,
  onSelect,
}: MultiSelectPopupProps) {
  const selectedSet = new Set(value);

  const handleToggle = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      onSelect(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelections !== undefined && value.length >= maxSelections) return;
      onSelect([...value, optionValue]);
    }
  };

  const handleKeywordSelect = (keywordValue: string[]) => {
    onSelect(keywordValue);
  };

  return (
    <div className="chipper-multi-select-popup">
      {keywords.length > 0 && (
        <div className="chipper-multi-select-popup__keywords">
          {keywords.map((keyword) => {
            const isMatch = selectionMatchesKeyword(selectedSet, value.length, keyword.value);
            return (
              <button
                key={String(keyword.value)}
                type="button"
                role="option"
                className={[
                  'chipper-popup-option',
                  isMatch && 'chipper-popup-option--selected',
                ].filter(Boolean).join(' ')}
                aria-selected={isMatch}
                onClick={() => handleKeywordSelect(keyword.value)}
              >
                {typeof keyword.label === 'function' ? keyword.label({}) : keyword.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="chipper-multi-select-popup__grid">
        {options.map((option) => {
          const isSelected = selectedSet.has(option.value);
          const isDisabled = !isSelected &&
            maxSelections !== undefined &&
            value.length >= maxSelections;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              className={[
                'chipper-popup-option',
                isSelected && 'chipper-popup-option--selected',
              ].filter(Boolean).join(' ')}
              aria-selected={isSelected}
              disabled={isDisabled}
              onClick={() => handleToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
