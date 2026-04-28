/**
 * Chip — trigger button + popup mount point.
 *
 * Reads chip state from useChip, manages popup via usePopup.
 * The popup renders conditionally (unmounted when closed).
 */

import { useRef } from 'react';
import { useChip } from '../hooks/useChip';
import { usePopup } from '../hooks/usePopup';
import { ChipPopup } from './ChipPopup';

export interface ChipProps {
  clauseId: string;
  chipId: string;
}

export function Chip({ clauseId, chipId }: ChipProps) {
  const { displayValue, valid, domain, chipDefinition, value, setValue } =
    useChip(clauseId, chipId);
  const { open, close, isOpen } = usePopup();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isInteractive = chipDefinition.mode.type === 'interactive';
  const showPopup = isOpen(chipId);
  const showPlaceholder = !valid;

  const handleClick = () => {
    if (!isInteractive || !triggerRef.current) return;
    if (showPopup) {
      close();
    } else {
      open(clauseId, chipId, triggerRef.current);
    }
  };

  const triggerClasses = [
    'chipper-chip-trigger',
    showPlaceholder && 'chipper-chip-trigger--placeholder',
    showPopup && 'chipper-chip-trigger--expanded',
    !isInteractive && 'chipper-chip-trigger--readonly',
  ].filter(Boolean).join(' ');

  // Inline CSS variable for per-domain color theming
  const triggerStyle = {
    '--chip-trigger-color': `var(--chip-color-${domain.color})`,
  } as React.CSSProperties;

  return (
    <span className="chipper-chip">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
        style={triggerStyle}
        onClick={handleClick}
        aria-expanded={showPopup}
        aria-haspopup="listbox"
      >
        <span className="chipper-chip-trigger__text">
          {displayValue}
        </span>
      </button>
      {showPopup && (
        <ChipPopup
          clauseId={clauseId}
          chipId={chipId}
          domain={domain}
          value={value}
          onSelect={setValue}
          onClose={close}
        />
      )}
    </span>
  );
}
