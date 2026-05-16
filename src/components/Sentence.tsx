/**
 * Sentence — renders the clause list from the sentence definition.
 *
 * Reads definition from context. No props — the structure comes
 * from the SentenceProvider above.
 *
 * If the definition includes lines, clauses are grouped into
 * chipper-line wrappers. Otherwise each clause gets its own line.
 */

import { useSentence } from '../hooks/useSentence';
import type { LineDefinition } from '../core/types';
import { Clause } from './Clause';

function Line({ line }: { line: LineDefinition }) {
  const className = line.indent
    ? 'chipper-line chipper-line--indent'
    : 'chipper-line';

  return (
    <div className={className}>
      {line.clauseIds.map((clauseId) => (
        <Clause key={clauseId} clauseId={clauseId} />
      ))}
    </div>
  );
}

export function Sentence() {
  const { definition } = useSentence();

  // If lines are defined, render through them.
  // Otherwise, each clause gets its own implicit line.
  const lines: LineDefinition[] = (definition.lines
    ?? definition.clauses.map((c) => ({ clauseIds: [c.id] })))
    .filter((line) => line.clauseIds.length > 0);

  return (
    <div className="chipper-sentence">
      {lines.map((line, index) => (
        <Line key={index} line={line} />
      ))}
    </div>
  );
}
