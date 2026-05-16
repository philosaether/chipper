/**
 * Clause — renders interleaved text and chips for a single clause.
 *
 * Handles three presentation modes:
 * - Contingent + latent: returns null (clause not rendered)
 * - Optional + dormant: shows ↳ toggle + placeholder text
 * - Active: shows segments (with × toggle for optional clauses)
 */

import { useMemo } from 'react';
import { useSentence } from '../hooks/useSentence';
import { buildClauseContext } from '../core/context-resolution';
import { Chip } from './Chip';

export interface ClauseProps {
  clauseId: string;
}

export function Clause({ clauseId }: ClauseProps) {
  const { definition, state, dispatch } = useSentence();
  const clauseDef = definition.clauses.find((c) => c.id === clauseId);
  const clauseState = state.clauses[clauseId];

  if (!clauseDef) return null;

  // Contingent clause that is not present: don't render
  if (clauseDef.contingency && !clauseState?.present) {
    return null;
  }

  // Optional clause that is not active: show toggle + placeholder
  if (clauseDef.necessity === 'optional' && !clauseState?.active) {
    return (
      <div className="chipper-clause chipper-clause--dormant">
        <button
          type="button"
          className="chipper-clause__toggle"
          onClick={() => dispatch({ type: 'TOGGLE_CLAUSE', clauseId })}
        >
          ↳
        </button>
        <span className="chipper-clause__placeholder">
          {clauseDef.placeholder ?? clauseId}
        </span>
      </div>
    );
  }

  // Resolve context for text segment predicates (only computed if needed)
  const hasTextPredicates = clauseDef.segments.some(
    (s) => s.type === 'text' && s.present,
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resolvedContext = useMemo(() => {
    if (!hasTextPredicates || !clauseState) return {};
    return buildClauseContext(clauseId, clauseDef, clauseState.chips, definition, state.contexts);
  }, [hasTextPredicates, clauseId, clauseDef, clauseState, definition, state.contexts]);

  // Active clause: render segments with optional × toggle
  return (
    <div className="chipper-clause">
      {clauseDef.necessity === 'optional' && (
        <button
          type="button"
          className="chipper-clause__toggle"
          onClick={() => dispatch({ type: 'TOGGLE_CLAUSE', clauseId })}
        >
          ×
        </button>
      )}
      {clauseDef.segments.map((segment, index) => {
        if (segment.type === 'text') {
          // Text with present predicate: evaluate at render time
          if (segment.present && !segment.present(resolvedContext)) {
            return null;
          }
          return (
            <span key={index} className="chipper-clause__text">
              {segment.value}
            </span>
          );
        }
        // Chip: check visibleChips from clause state
        if (clauseState?.visibleChips && !clauseState.visibleChips.includes(segment.chipId)) {
          return null;
        }
        return (
          <Chip key={segment.chipId} clauseId={clauseId} chipId={segment.chipId} />
        );
      })}
    </div>
  );
}
