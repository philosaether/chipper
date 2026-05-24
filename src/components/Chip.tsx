/**
 * Chip — trigger button + popup mount point.
 *
 * Reads chip state from useChip, manages popup via usePopup.
 * The popup renders conditionally (unmounted when closed).
 */

import { useMemo, useRef } from 'react';
import { useChip } from '../hooks/useChip';
import { useSentence } from '../hooks/useSentence';
import { usePopup } from '../hooks/usePopup';
import { buildClauseContext } from '../core/context-resolution';
import { ChipPopup } from './ChipPopup';

export interface ChipProps {
  clauseId: string;
  chipId: string;
}

export function Chip({ clauseId, chipId }: ChipProps) {
  const { displayValue, valid, domain, chipDefinition, value, expressionMode, setValue } =
    useChip(clauseId, chipId);
  const { definition, state } = useSentence();
  const { open, close, isOpen } = usePopup();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Resolve context for dynamic prefix/suffix (only when expression mode has function affixes)
  const needsContext = useMemo(
    () => domain.expressionModes.some(
      (m) => typeof m.prefix === 'function' || typeof m.suffix === 'function',
    ),
    [domain.expressionModes],
  );
  const clauseDef = needsContext ? definition.clauses.find((c) => c.id === clauseId) : undefined;
  const clauseState = needsContext ? state.clauses[clauseId] : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const popupContext = useMemo(
    () => needsContext && clauseDef && clauseState
      ? buildClauseContext(clauseId, clauseDef, clauseState.chips, definition, state.contexts)
      : undefined,
    [needsContext, clauseId, clauseDef, clauseState, definition, state.contexts],
  );

  const isInteractive = chipDefinition.mode.type === 'interactive';
  const showPopup = isOpen(chipId);
  const showPlaceholder = !valid;

  const handleClick = () => {
    if (!isInteractive || !triggerRef.current) return;
    if (showPopup) {
      close();
      triggerRef.current.focus();
    } else {
      open(clauseId, chipId, triggerRef.current);
    }
  };

  const handleClose = () => {
    close();
    triggerRef.current?.focus();
  };

  const triggerClasses = [
    'chipper-chip-trigger',
    showPlaceholder && 'chipper-chip-trigger--placeholder',
    showPopup && 'chipper-chip-trigger--expanded',
    !isInteractive && 'chipper-chip-trigger--readonly',
  ].filter(Boolean).join(' ');

  // Inline CSS variables bridge domain color key to theme tokens.
  // Set on the wrapper so both trigger and popup inherit them.
  const chipStyle = {
    '--chip-trigger-color-text': `var(--chipper-color-${domain.color}-text)`,
    '--chip-trigger-color-bg': `var(--chipper-color-${domain.color}-bg)`,
    '--chip-trigger-color-hover': `var(--chipper-color-${domain.color}-hover)`,
  } as React.CSSProperties;

  return (
    <span className="chipper-chip" style={chipStyle}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
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
          expressionActive={expressionMode}
          context={popupContext}
          onSelect={setValue}
          onClose={handleClose}
        />
      )}
    </span>
  );
}
