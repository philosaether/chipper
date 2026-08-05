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
import type { NormalizedKeywordGroup } from '../../domains/normalize-keywords';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';
import { TRIGGER_SENTINEL } from '../../core/mode-switching';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { NumericInput } from './NumericInput';
import { KeywordGroupList } from './KeywordGroupList';

/** Keys forwarded from text/textarea inputs to keyboard navigation. */
const TEXT_INPUT_NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape']);

export interface KeywordOrExpressionPopupProps {
  keywords: Keyword<string>[];
  keywordGroups?: NormalizedKeywordGroup<string>[];
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
  keywordGroups,
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
  const isDate = expressionMode?.inputType === 'date';
  const isTextarea = expressionMode?.inputType === 'textarea';
  const [inputValue, setInputValue] = useState(
    // No expression visible → no input state needed.
    // Numeric/date inputs always initialize with the current value.
    // Text inputs start empty when the current value is a keyword.
    !showExpression ? '' : (isNumeric || isDate) ? value : (isKeywordValue(value, keywords) ? '' : value),
  );

  // Track whether a keyword was clicked (skip auto-save in that case)
  const keywordSelected = useRef(false);

  // Keyboard navigation for keyword options (+ trigger pill if present)
  const totalOptions = keywords.length + (hasTrigger && !expressionActive ? 1 : 0);
  const selectedIndex = keywords.findIndex((k) => k.value === value && !expressionActive);
  const keyboard = useKeyboardNavigation({
    itemCount: totalOptions,
    initialIndex: selectedIndex >= 0 ? selectedIndex : -1,
    onSelect: (index) => {
      if (index < keywords.length) {
        keywordSelected.current = true;
        onSelect(keywords[index]!.value);
      } else {
        // Trigger pill
        onSelect(TRIGGER_SENTINEL);
      }
    },
    onClose,
    idPrefix: 'chipper-koe-option',
  });

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

  const expressionAbove = expressionMode?.position === 'above';

  const keywordsSection = keywords.length > 0 && (
    keywordGroups ? (
      <div className="chipper-koe-popup__keywords chipper-koe-popup__keywords--grouped">
        <KeywordGroupList
          groups={keywordGroups}
          context={context}
          getOptionProps={keyboard.getOptionProps}
          isSelected={(kw) => kw.value === value && !expressionActive}
        />
      </div>
    ) : (
      <div className="chipper-koe-popup__keywords">
        {keywords.map((keyword, index) => {
          const optionProps = keyboard.getOptionProps(index);
          return (
            <button
              key={keyword.value}
              type="button"
              {...optionProps}
              className={[
                optionProps.className,
                keyword.value === value && !expressionActive && 'chipper-popup-option--selected',
              ].filter(Boolean).join(' ')}
            >
              {resolveKeywordLabel(keyword, context)}
            </button>
          );
        })}
      </div>
    )
  );

  const triggerSection = hasTrigger && !expressionActive && (
    <div className="chipper-koe-popup__trigger">
      <button
        type="button"
        {...keyboard.getOptionProps(keywords.length)}
      >
        {triggerLabel}
      </button>
    </div>
  );

  const expressionSection = showExpression && (
    <>
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
        ) : expressionMode!.inputType === 'date' ? (
          <input
            type="date"
            className="chipper-koe-popup__input"
            value={inputValue}
            onChange={(e) => {
              const v = e.target.value;
              setInputValue(v);
              if (v && expressionMode!.validate(v)) {
                onSelect(v);
                onClose();
              }
            }}
            autoFocus={keywords.length === 0}
          />
        ) : isTextarea ? (
          <textarea
            className="chipper-koe-popup__input chipper-koe-popup__input--textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => keyboard.setActiveIndex(-1)}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter submits; plain Enter inserts newline
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={expressionMode!.label}
            maxLength={maxLength}
            rows={3}
            autoFocus={keywords.length === 0}
          />
        ) : (
          <input
            type="text"
            className="chipper-koe-popup__input"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Typing is new intent — drop any lingering option highlight.
              if (keyboard.activeIndex >= 0) keyboard.setActiveIndex(-1);
            }}
            onFocus={() => keyboard.setActiveIndex(-1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // Only an arrow-key highlight outranks the typed text —
                // a hover highlight on Enter would grab a keyword the
                // mouse happens to be resting on.
                if (
                  keyboard.activeSource === 'keyboard' &&
                  keyboard.activeIndex >= 0 &&
                  keyboard.activeIndex < keywords.length
                ) {
                  keyboard.handleKeyDown(e);
                } else {
                  handleSubmit();
                }
              } else if (TEXT_INPUT_NAV_KEYS.has(e.key)) {
                keyboard.handleKeyDown(e);
              }
            }}
            placeholder={expressionMode!.label}
            maxLength={maxLength}
            autoFocus={keywords.length === 0}
            aria-activedescendant={keyboard.activeDescendantId}
            role="combobox"
            aria-expanded={true}
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
    </>
  );

  return (
    <div
      className="chipper-koe-popup"
      onKeyDown={!showExpression ? keyboard.handleKeyDown : undefined}
      tabIndex={!showExpression ? 0 : undefined}
      aria-activedescendant={!showExpression ? keyboard.activeDescendantId : undefined}
    >
      {expressionAbove ? (
        <>
          {expressionSection}
          {keywordsSection}
          {triggerSection}
        </>
      ) : (
        <>
          {keywordsSection}
          {triggerSection}
          {expressionSection}
        </>
      )}
    </div>
  );
}
