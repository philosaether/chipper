/**
 * EnumPopup — keyword list for pure enum domains.
 *
 * Renders a button per keyword, highlights current selection.
 * Closes after selection (single-select domain).
 */

import type { Keyword } from '../../core/types';

export interface EnumPopupProps {
  keywords: Keyword[];
  value: unknown;
  onSelect: (value: unknown) => void;
  onClose: () => void;
}

export function EnumPopup({ keywords, value, onSelect, onClose }: EnumPopupProps) {
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
          onClick={() => {
            onSelect(keyword.value);
            onClose();
          }}
        >
          {keyword.label}
        </button>
      ))}
    </div>
  );
}
