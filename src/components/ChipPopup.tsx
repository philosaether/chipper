/**
 * ChipPopup — popup container with positioning, Escape, outside-click,
 * and archetype routing.
 *
 * Positioned via CSS (absolute, below trigger). Routes to the
 * appropriate archetype popup based on domain.type.
 */

import { useEffect, useRef } from 'react';
import type { Domain } from '../core/types';
import { EnumPopup } from './popups/EnumPopup';
import { KeywordOrExpressionPopup } from './popups/KeywordOrExpressionPopup';

export interface ChipPopupProps {
  clauseId: string;
  chipId: string;
  domain: Domain;
  value: unknown;
  onSelect: (value: unknown) => void;
  onClose: () => void;
}

export function ChipPopup({ domain, value, onSelect, onClose }: ChipPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // setTimeout(0) avoids closing from the trigger click that opened us
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const popupContent = () => {
    switch (domain.type) {
      case 'enum':
        return (
          <EnumPopup
            keywords={domain.keywords}
            value={value}
            onSelect={onSelect}
            onClose={onClose}
          />
        );
      case 'keyword-or-expression': {
        const expressionMode = domain.expressionModes[0] as import('../core/types').ExpressionMode<string>;
        return (
          <KeywordOrExpressionPopup
            keywords={domain.keywords as import('../core/types').Keyword<string>[]}
            value={value as string}
            expressionMode={expressionMode}
            maxLength={expressionMode.maxLength}
            onSelect={onSelect as (value: string) => void}
            onClose={onClose}
          />
        );
      }
      default:
        return <div>Unsupported domain type: {domain.type}</div>;
    }
  };

  return (
    <div
      ref={popupRef}
      className="chipper-popup chipper-popup--open"
      role="listbox"
    >
      {popupContent()}
    </div>
  );
}
