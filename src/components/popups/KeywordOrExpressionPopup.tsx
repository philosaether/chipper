/**
 * KeywordOrExpressionPopup — keyword pills + text/numeric input.
 *
 * Three layout modes:
 * 1. Always-on expression (no trigger): keywords + expression visible simultaneously.
 * 2. Trigger-gated, keyword mode: keywords + trigger pill, no expression input.
 * 3. Trigger-gated, expression mode: keywords (escape hatches) + expression input.
 *
 * Text: keyword click or Enter submits. Valid input auto-saves on close.
 * Numeric: stepper buttons submit immediately. Manual entry validates.
 */

import { useEffect, useRef, useState } from 'react';
import type { ExpressionMode, Keyword, SentenceContext } from '../../core/types';
import { TRIGGER_SENTINEL } from '../../core/mode-switching';
import { NumericInput } from './NumericInput';

export interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  value: string;
  expressionMode?: ExpressionMode<string>;
  /** Is the chip currently in trigger-gated expression mode? */
  expressionActive?: boolean;
  /** Label for the trigger pill (absent = always-on expression). */
  triggerLabel?: string;
  /** Sentence context for resolving dynamic prefix/suffix. */
  context?: SentenceContext;
  maxLength?: number;
  onSelect: (value: string | symbol) => void;
  onClose: () => void;
}

function isKeywordValue(value: string, keywords: Keyword<string>[]): boolean {
  return keywords.some((k) => k.value === value);
}

export function KeywordOrExpressionPopup({
  keywords,
  value,
  expressionMode,
  expressionActive,
  triggerLabel,
  context,
  maxLength,
  onSelect,
  onClose,
}: KeywordOrExpressionPopupProps) {
  // Should the expression input be shown?
  // Always-on (no trigger): show if expressionMode exists.
  // Trigger-gated: show only when expressionActive.
  const hasTrigger = !!triggerLabel;
  const showExpression = expressionMode && (!hasTrigger || expressionActive);

  const isNumeric = expressionMode?.inputType === 'number';
  const [inputValue, setInputValue] = useState(
    // No expression visible → no input state needed.
    // Numeric inputs always initialize with the current value (for the stepper).
    // Text inputs start empty when the current value is a keyword.
    !showExpression ? '' : isNumeric ? value : (isKeywordValue(value, keywords) ? '' : value),
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
      if (!showExpression) return;
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
                keyword.value === value && !expressionActive && 'chipper-popup-option--selected',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-selected={keyword.value === value && !expressionActive}
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
      {hasTrigger && !expressionActive && (
        <div className="chipper-koe-popup__trigger">
          <button
            type="button"
            role="option"
            className="chipper-popup-option"
            onClick={() => {
              onSelect(TRIGGER_SENTINEL);
              onClose();
            }}
          >
            {triggerLabel}
          </button>
        </div>
      )}
      {showExpression && <>
        {keywords.length > 0 && <hr className="chipper-koe-popup__separator" />}
        <div className="chipper-koe-popup__input-row">
          {expressionMode!.prefix && (
            <span className="chipper-koe-popup__affix">
              {typeof expressionMode!.prefix === 'function'
                ? expressionMode!.prefix(context ?? {})
                : expressionMode!.prefix}
            </span>
          )}
          {expressionMode!.inputType === 'number' ? (
            <NumericInput
              value={inputValue}
              min={expressionMode!.min}
              max={expressionMode!.max}
              step={expressionMode!.step}
              onSelect={(v) => {
                setInputValue(v);
                if (expressionMode!.validate(v)) {
                  onSelect(v);
                }
              }}
              onSubmit={() => {
                if (expressionMode!.validate(inputValue)) {
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
              placeholder={expressionMode!.label}
              maxLength={maxLength}
              autoFocus={keywords.length === 0}
            />
          )}
          {expressionMode!.suffix && (
            <span className="chipper-koe-popup__affix">
              {typeof expressionMode!.suffix === 'function'
                ? expressionMode!.suffix(context ?? {})
                : expressionMode!.suffix}
            </span>
          )}
        </div>
      </>}
    </div>
  );
}
