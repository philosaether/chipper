/**
 * Chip — trigger button + popup mount point.
 *
 * Reads chip state from useChip, manages popup via usePopup.
 * The popup renders conditionally (unmounted when closed).
 *
 * Interactive chips open a domain-specific input popup.
 * Display chips optionally open a read-only info popup.
 */

import { useMemo, useRef } from 'react';
import { useChip } from '../hooks/useChip';
import { useSentence } from '../hooks/useSentence';
import { usePopup } from '../hooks/usePopup';
import { useReferenceDisplay } from '../hooks/useReferenceDisplay';
import { useDisplaySource } from '../hooks/useDisplaySource';
import { buildClauseContext } from '../core/context-resolution';
import { ChipPopup } from './ChipPopup';
import { ChipInfoPopup } from './ChipInfoPopup';

export interface ChipProps {
  clauseId: string;
  chipId: string;
}

export function Chip({ clauseId, chipId }: ChipProps) {
  const { displayValue, valid, domain, chipDefinition, value, expressionMode, loading, error, setValue } =
    useChip(clauseId, chipId);
  const { definition, state, clauseById, dispatch } = useSentence();
  const { open, close, isOpen } = usePopup();
  useReferenceDisplay(domain, value, clauseId, chipId, dispatch);
  useDisplaySource(chipDefinition, state, dispatch);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Resolve context for dynamic prefix/suffix (only when expression mode has function affixes)
  const needsContext = useMemo(
    () => domain.expressionModes.some(
      (m) => typeof m.prefix === 'function' || typeof m.suffix === 'function',
    ),
    [domain.expressionModes],
  );
  const clauseDef = needsContext ? clauseById.get(clauseId) : undefined;
  const clauseState = needsContext ? state.clauses[clauseId] : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const popupContext = useMemo(
    () => needsContext && clauseDef && clauseState
      ? buildClauseContext(clauseId, clauseDef, clauseState.chips, clauseById, state.contexts)
      : undefined,
    [needsContext, clauseId, clauseDef, clauseState, clauseById, state.contexts],
  );

  const isInteractive = chipDefinition.mode.type === 'interactive';
  const isDisplay = chipDefinition.mode.type === 'display';
  const displayMode = chipDefinition.mode.type === 'display' ? chipDefinition.mode : undefined;
  const hasInfoPopup = displayMode?.info != null;
  const showPopup = isOpen(chipId);
  const showPlaceholder = !valid;

  const handleClick = () => {
    if (!triggerRef.current) return;
    if (!isInteractive && !hasInfoPopup) return;
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
    isDisplay && 'chipper-chip-trigger--display',
    loading && 'chipper-chip-trigger--loading',
    error && 'chipper-chip-trigger--error',
  ].filter(Boolean).join(' ');

  // Inline CSS variables bridge domain color key to theme tokens.
  // Set on the wrapper so both trigger and popup inherit them.
  const chipStyle = {
    '--chip-trigger-color-text': `var(--chipper-color-${domain.color}-text)`,
    '--chip-trigger-color-bg': `var(--chipper-color-${domain.color}-bg)`,
    '--chip-trigger-color-hover': `var(--chipper-color-${domain.color}-hover)`,
  } as React.CSSProperties;

  // Resolve info popup content for display chips
  const infoContent = useMemo(() => {
    if (!displayMode?.info) return undefined;
    const info = displayMode.info;
    return typeof info === 'function' ? info(value, state) : info;
  }, [displayMode, value, state]);

  // Display chips without an info popup render as non-interactive spans
  const renderAsButton = isInteractive || hasInfoPopup;

  return (
    <span className="chipper-chip" style={chipStyle}>
      {renderAsButton ? (
        <button
          ref={triggerRef}
          type="button"
          className={triggerClasses}
          onClick={handleClick}
          aria-expanded={showPopup}
          aria-haspopup={isInteractive ? 'listbox' : hasInfoPopup ? 'dialog' : undefined}
        >
          <span className="chipper-chip-trigger__text">
            {displayValue}
          </span>
        </button>
      ) : (
        <span className={triggerClasses}>
          <span className="chipper-chip-trigger__text">
            {displayValue}
          </span>
        </span>
      )}
      {showPopup && isInteractive && (
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
      {showPopup && hasInfoPopup && infoContent && (
        <ChipInfoPopup
          content={infoContent}
          onClose={handleClose}
        />
      )}
    </span>
  );
}
