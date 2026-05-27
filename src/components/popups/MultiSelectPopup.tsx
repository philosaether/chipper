/**
 * MultiSelectPopup — toggle grid with optional group keyword shortcuts.
 *
 * Unlike enum/KOE popups, this popup stays open during selection.
 * The user toggles options freely and closes via outside-click,
 * Escape, or trigger re-click.
 */

import type { Keyword } from '../../core/types';
import type { NormalizedKeywordGroup } from '../../domains/normalize-keywords';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';
import { selectionMatchesKeyword } from '../../domains/multi-select';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { KeywordGroupList } from './KeywordGroupList';

export interface MultiSelectPopupProps {
  options: Keyword<string>[];
  optionGroups?: NormalizedKeywordGroup<string>[];
  keywords: Keyword<string[]>[];
  value: string[];
  maxSelections?: number;
  onSelect: (value: string[]) => void;
  onClose?: () => void;
}

export function MultiSelectPopup({
  options,
  optionGroups,
  keywords,
  value,
  maxSelections,
  onSelect,
  onClose,
}: MultiSelectPopupProps) {
  const selectedSet = new Set(value);

  // All navigable items: keywords first, then options
  const allItems: ({ type: 'keyword'; keyword: Keyword<string[]> } | { type: 'option'; option: Keyword<string> })[] = [
    ...keywords.map((k) => ({ type: 'keyword' as const, keyword: k })),
    ...options.map((o) => ({ type: 'option' as const, option: o })),
  ];
  const keyboard = useKeyboardNavigation({
    itemCount: allItems.length,
    onSelect: (index) => {
      const item = allItems[index]!;
      if (item.type === 'keyword') {
        handleKeywordSelect(item.keyword.value);
      } else {
        handleToggle(item.option.value);
      }
    },
    onClose: onClose ?? (() => {}),
    closeOnSelect: false,
    idPrefix: 'chipper-multi-option',
  });

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

  // Option index offset: keywords come first in the flat nav list
  const optionIndexOffset = keywords.length;

  return (
    <div
      className="chipper-multi-select-popup"
      onKeyDown={keyboard.handleKeyDown}
      tabIndex={0}
      aria-activedescendant={keyboard.activeDescendantId}
    >
      {keywords.length > 0 && (
        <div className="chipper-multi-select-popup__keywords">
          {keywords.map((keyword, index) => {
            const isMatch = selectionMatchesKeyword(selectedSet, value.length, keyword.value);
            const optionProps = keyboard.getOptionProps(index);
            return (
              <button
                key={String(keyword.value)}
                type="button"
                {...optionProps}
                aria-selected={isMatch}
                className={[
                  optionProps.className,
                  isMatch && 'chipper-popup-option--selected',
                ].filter(Boolean).join(' ')}
              >
                {resolveKeywordLabel(keyword)}
              </button>
            );
          })}
        </div>
      )}
      {optionGroups ? (
        <div className="chipper-multi-select-popup__grid">
          <KeywordGroupList
            groups={optionGroups}
            getOptionProps={(index) => keyboard.getOptionProps(optionIndexOffset + index)}
            isSelected={(kw) => selectedSet.has(kw.value)}
            isDisabled={(kw) => !selectedSet.has(kw.value) &&
              maxSelections !== undefined &&
              value.length >= maxSelections}
          />
        </div>
      ) : (
        <div className="chipper-multi-select-popup__grid">
          {options.map((option, index) => {
            const isSelected = selectedSet.has(option.value);
            const isDisabled = !isSelected &&
              maxSelections !== undefined &&
              value.length >= maxSelections;
            const optionProps = keyboard.getOptionProps(optionIndexOffset + index);
            return (
              <button
                key={option.value}
                type="button"
                {...optionProps}
                aria-selected={isSelected}
                className={[
                  optionProps.className,
                  isSelected && 'chipper-popup-option--selected',
                ].filter(Boolean).join(' ')}
                disabled={isDisabled}
              >
                {resolveKeywordLabel(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
