/**
 * Clause — renders interleaved text and chips for a single clause.
 *
 * Iterates the clause's segments array, rendering text spans and
 * Chip components in definition order.
 */

import { useSentence } from '../hooks/useSentence';
import { Chip } from './Chip';

export interface ClauseProps {
  clauseId: string;
}

export function Clause({ clauseId }: ClauseProps) {
  const { definition } = useSentence();
  const clauseDef = definition.clauses.find((c) => c.id === clauseId);

  if (!clauseDef) return null;

  return (
    <div className="chipper-clause">
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
