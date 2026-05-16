/**
 * KeywordOrExpressionPopup — keyword pills + text/numeric input.
 *
 * Keywords on top (high-value shortcuts), input field below.
 * Expression-only domains render just the input.
 * Text: keyword click or Enter submits. Valid input auto-saves on close.
 * Numeric: stepper buttons submit immediately. Manual entry validates.
 */

import { useEffect, useRef, useState } from 'react';
import type { ExpressionMode, Keyword } from '../../core/types';
import { NumericInput } from './NumericInput';

export interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  value: string;
  expressionMode?: ExpressionMode<string>;
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
  const isNumeric = expressionMode?.inputType === 'number';
  const [inputValue, setInputValue] = useState(
    // No expression mode → keywords only, no input state needed.
    // Numeric inputs always initialize with the current value (for the stepper).
    // Text inputs start empty when the current value is a keyword.
    !expressionMode ? '' : isNumeric ? value : (isKeywordValue(value, keywords) ? '' : value),
  );

  // Track whether a keyword was clicked (skip auto-save in that case)
  const keywordSelected = useRef(false);

  // Ref tracks latest inputValue for the unmount cleanup (avoids stale closure)
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  const handleSubmit = () => {
    if (!expressionMode) return;
    const trimmed = inputValue.trim();
    if (trimmed && expressionMode.validate(trimmed)) {
      onSelect(trimmed);
      onClose();
    }
  };

  // Auto-save valid text expression on unmount (outside-click close)
  useEffect(() => {
    return () => {
      if (!expressionMode) return;
      if (keywordSelected.current) return;
      if (isNumeric) return;
      const trimmed = inputValueRef.current.trim();
      if (trimmed && trimmed !== value && expressionMode.validate(trimmed)) {
        onSelect(trimmed);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                keywordSelected.current = true;
                onSelect(keyword.value);
                onClose();
              }}
            >
              {keyword.label}
            </button>
          ))}
        </div>
      )}
      {expressionMode && <div className="chipper-koe-popup__input-row">
        {expressionMode.inputType === 'number' ? (
          <NumericInput
            value={inputValue}
            min={expressionMode.min}
            max={expressionMode.max}
            step={expressionMode.step}
            onSelect={(v) => {
              setInputValue(v);
              if (expressionMode.validate(v)) {
                onSelect(v);
              }
            }}
            onSubmit={() => {
              if (expressionMode.validate(inputValue)) {
                onSelect(inputValue);
                onClose();
              }
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
      </div>}
    </div>
  );
}
