/**
 * Sentence — renders the clause list from the sentence definition.
 *
 * Reads definition from context. No props — the structure comes
 * from the SentenceProvider above.
 */

import { useSentence } from '../hooks/useSentence';
import { Clause } from './Clause';

export function Sentence() {
  const { definition } = useSentence();

  return (
    <div className="chipper-sentence">
      {definition.clauses.map((clauseDef) => (
        <Clause key={clauseDef.id} clauseId={clauseDef.id} />
      ))}
    </div>
  );
}
