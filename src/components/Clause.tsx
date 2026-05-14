/**
 * Clause — renders interleaved text and chips for a single clause.
 *
 * Handles three presentation modes:
 * - Contingent + latent: returns null (clause not rendered)
 * - Optional + dormant: shows ↳ toggle + placeholder text
 * - Active: shows segments (with × toggle for optional clauses)
 */

import { useSentence } from '../hooks/useSentence';
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
          return (
            <span key={index} className="chipper-clause__text">
              {segment.value}
            </span>
          );
        }
        return (
          <Chip key={segment.chipId} clauseId={clauseId} chipId={segment.chipId} />
        );
      })}
    </div>
  );
}
