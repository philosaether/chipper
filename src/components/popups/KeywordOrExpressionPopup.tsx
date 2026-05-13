/**
 * KeywordOrExpressionPopup — keyword pills + text input.
 *
 * Keywords on top (high-value shortcuts), input field below.
 * Expression-only domains render just the input.
 * Keyword click selects and closes. Enter submits typed value.
 */

import { useState } from 'react';
import type { ExpressionMode, Keyword } from '../../core/types';
import { NumericInput } from './NumericInput';

export interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  value: string;
  expressionMode: ExpressionMode<string>;
  maxLength?: number;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function isKeywordValue(value: string, keywords: Keyword<string>[]): boolean {
  return keywords.some((k) => k.value === value);
}

export function KeywordOrExpressionPopup({
  keywords,
  value,
  expressionMode,
  maxLength,
  onSelect,
  onClose,
}: KeywordOrExpressionPopupProps) {
  const [inputValue, setInputValue] = useState(
    isKeywordValue(value, keywords) ? '' : value,
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
                'chipper-popup-option',
                keyword.value === value && 'chipper-popup-option--selected',
              ]
                .filter(Boolean)
                .join(' ')}
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
        {expressionMode.inputType === 'number' ? (
          <NumericInput
            value={inputValue || value}
            min={expressionMode.min}
            max={expressionMode.max}
            step={expressionMode.step}
            onSelect={(v) => {
              setInputValue(v);
              onSelect(v);
            }}
          />
        ) : (
          <input
            type="text"
            className="chipper-koe-popup__input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder={expressionMode.label}
            maxLength={maxLength}
            autoFocus={keywords.length === 0}
          />
        )}
      </div>
    </div>
  );
}
