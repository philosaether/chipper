/**
 * MultiSelectPopup — toggle grid with optional group keyword shortcuts.
 *
 * Unlike enum/KOE popups, this popup stays open during selection.
 * The user toggles options freely and closes via outside-click,
 * Escape, or trigger re-click.
 */

import type { Keyword } from '../../core/types';

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
            const isMatch =
              keyword.value.length === value.length &&
              keyword.value.every((v) => selectedSet.has(v));
            return (
              <button
                key={keyword.label}
                type="button"
                role="option"
                className={[
                  'chipper-popup-option',
                  isMatch && 'chipper-popup-option--selected',
                ].filter(Boolean).join(' ')}
                aria-selected={isMatch}
                onClick={() => handleKeywordSelect(keyword.value)}
              >
                {keyword.label}
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
                'chipper-multi-select-popup__option',
                isSelected && 'chipper-multi-select-popup__option--selected',
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
