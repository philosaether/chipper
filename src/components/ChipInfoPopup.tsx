/**
 * ChipInfoPopup — read-only info popup for display chips.
 *
 * Shows provenance/context text. Reuses popup positioning but
 * renders a simple text block instead of domain-specific input UI.
 */

import { useEffect, useRef } from 'react';

export interface ChipInfoPopupProps {
  content: string;
  onClose: () => void;
}

export function ChipInfoPopup({ content, onClose }: ChipInfoPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Outside-click closes the popup
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Defer close to allow trigger click to re-toggle
        setTimeout(onClose, 0);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Escape closes the popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div ref={popupRef} className="chipper-chip-info" role="dialog" aria-label="Chip information">
      <div className="chipper-chip-info__caret" />
      <div className="chipper-chip-info__content">
        {content}
      </div>
    </div>
  );
}
