/**
 * Sentence — renders the clause list from the sentence definition.
 *
 * Reads definition from context. No props — the structure comes
 * from the SentenceProvider above.
 *
 * If the definition includes lines, clauses are grouped into
 * chipper-line wrappers. Otherwise each clause gets its own line.
 *
 * Indent is derived: a line is indented if all its clauses are
 * optional or contingent-not-present. Explicit indent on
 * LineDefinition overrides this.
 */

import { useSentence } from '../hooks/useSentence';
import type { ClauseDefinition, LineDefinition } from '../core/types';
import type { SentenceState } from '../core/state';
import { Clause } from './Clause';

/**
 * Determine whether a line should be indented.
 * Explicit indent on the LineDefinition takes precedence.
 * Otherwise, indent if every clause on the line is optional or contingent.
 */
function shouldIndent(
  line: LineDefinition,
  clausesByIds: Map<string, ClauseDefinition>,
  state: SentenceState,
): boolean {
  if (line.indent !== undefined) return line.indent;

  return line.clauseIds.every((id) => {
    const clauseDef = clausesByIds.get(id);
    if (!clauseDef) return false;
    return clauseDef.necessity === 'optional' || !!clauseDef.contingency;
  });
}

function Line({ line, clausesByIds, state }: {
  line: LineDefinition;
  clausesByIds: Map<string, ClauseDefinition>;
  state: SentenceState;
}) {
  const indent = shouldIndent(line, clausesByIds, state);
  const className = indent
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
  const { definition, state } = useSentence();

  const clausesByIds = new Map(
    definition.clauses.map((c) => [c.id, c]),
  );

  // If lines are defined, render through them.
  // Otherwise, each clause gets its own implicit line.
  const lines: LineDefinition[] = (definition.lines
    ?? definition.clauses.map((c) => ({ clauseIds: [c.id] })))
    .filter((line) => line.clauseIds.length > 0);

  return (
    <div className="chipper-sentence">
      {lines.map((line, index) => (
        <Line key={index} line={line} clausesByIds={clausesByIds} state={state} />
      ))}
    </div>
  );
}
