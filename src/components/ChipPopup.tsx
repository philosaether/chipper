/**
 * ChipPopup — popup container with positioning, Escape, outside-click,
 * and archetype routing.
 *
 * Positioned via CSS (absolute, below trigger). Routes to the
 * appropriate archetype popup based on domain.type.
 */

import { useEffect, useRef } from 'react';
import type { Domain, ExpressionMode, Keyword, SentenceContext } from '../core/types';
import type { ResolvedAlternativeCoordinateMode } from '../domains/alternative-coordinate';
import type { NormalizedKeywordGroup } from '../domains/normalize-keywords';
import type { ExpressionTrigger } from '../domains/keyword-or-expression';
import type { ReferenceSource } from '../domains/reference';
import { KeywordOrExpressionPopup } from './popups/KeywordOrExpressionPopup';
import { MultiSelectPopup } from './popups/MultiSelectPopup';
import { AlternativeCoordinatePopup } from './popups/AlternativeCoordinatePopup';
import { ReferencePopup } from './popups/ReferencePopup';

export interface ChipPopupProps {
  clauseId: string;
  chipId: string;
  domain: Domain;
  value: unknown;
  expressionActive?: boolean;
  context?: SentenceContext;
  onSelect: (value: unknown) => void;
  onClose: () => void;
}

export function ChipPopup({ chipId, domain, value, expressionActive, context, onSelect, onClose }: ChipPopupProps) {
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

  // Focus trap: Tab wraps within popup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && popupRef.current) {
        const focusable = popupRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const el = popupRef.current;
    el?.addEventListener('keydown', handleKeyDown);
    return () => el?.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      case 'keyword-or-expression': {
        const expressionMode = domain.expressionModes[0] as ExpressionMode<string> | undefined;
        const trigger = domain.meta?.trigger as ExpressionTrigger | undefined;
        return (
          <KeywordOrExpressionPopup
            keywords={domain.keywords as Keyword<string>[]}
            keywordGroups={domain.keywordGroups as NormalizedKeywordGroup<string>[] | undefined}
            value={value as string}
            expressionMode={expressionMode}
            expressionActive={expressionActive}
            triggerLabel={trigger?.label}
            context={context}
            maxLength={expressionMode?.maxLength}
            onSelect={onSelect as (value: string | symbol) => void}
            onClose={onClose}
          />
        );
      }
      case 'multi-select':
        return (
          <MultiSelectPopup
            options={domain.meta?.options as Keyword<string>[]}
            optionGroups={domain.meta?.optionGroups as NormalizedKeywordGroup<string>[] | undefined}
            keywords={domain.keywords as Keyword<string[]>[]}
            value={value as string[]}
            maxSelections={domain.meta?.maxSelections as number | undefined}
            onSelect={onSelect as (value: string[]) => void}
            onClose={onClose}
          />
        );
      case 'alternative-coordinate':
        return (
          <AlternativeCoordinatePopup
            modes={domain.meta?.modes as ResolvedAlternativeCoordinateMode[]}
            value={value as string}
            onSelect={onSelect as (value: string) => void}
            onClose={onClose}
          />
        );
      case 'reference':
        return (
          <ReferencePopup
            source={domain.meta?.source as ReferenceSource}
            keywords={domain.keywords as Keyword<string>[]}
            value={value as string}
            onSelect={onSelect as (value: string) => void}
            onClose={onClose}
            displayCache={domain.meta?.displayCache as Map<string, string>}
          />
        );
      default:
        return <div>Unsupported domain type: {domain.type}</div>;
    }
  };

  // Move focus into the popup on mount
  useEffect(() => {
    if (!popupRef.current) return;
    const firstFocusable = popupRef.current.querySelector<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, []);

  return (
    <div
      ref={popupRef}
      id={`chipper-popup-${chipId}`}
      className="chipper-popup chipper-popup--open"
      role="listbox"
      aria-label={domain.placeholder ?? domain.type}
    >
      {popupContent()}
    </div>
  );
}
