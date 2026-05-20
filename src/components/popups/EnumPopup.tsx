/**
 * EnumPopup — keyword list for pure enum domains.
 *
 * Renders a button per keyword, highlights current selection.
 * Closes after selection (single-select domain).
 */

import type { Keyword } from '../../core/types';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';

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
          key={String(keyword.value)}
          type="button"
          role="option"
          className={[
            'chipper-popup-option',
            keyword.value === value && 'chipper-popup-option--selected',
          ].filter(Boolean).join(' ')}
          aria-selected={keyword.value === value}
          onClick={() => {
            onSelect(keyword.value);
            onClose();
          }}
        >
          {resolveKeywordLabel(keyword)}
        </button>
      ))}
    </div>
  );
}
