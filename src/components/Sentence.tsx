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
 * Otherwise, indent if every clause on the line is optional or contingent
 * AND at least one clause is optional (i.e., has a toggle icon).
 */
function shouldIndent(
  line: LineDefinition,
  clausesByIds: Map<string, ClauseDefinition>,
): boolean {
  if (line.indent !== undefined) return line.indent;

  let hasOptional = false;
  const allNonRequired = line.clauseIds.every((id) => {
    const clauseDef = clausesByIds.get(id);
    if (!clauseDef) return false;
    if (clauseDef.necessity === 'optional') hasOptional = true;
    return clauseDef.necessity === 'optional' || !!clauseDef.contingency;
  });

  return allNonRequired && hasOptional;
}

/**
 * Returns true when every clause on a line is contingent and not present
 * (latent). A latent line should not render at all — its empty wrapper
 * would otherwise consume flex gap space.
 */
function isLineLatent(
  line: LineDefinition,
  clausesByIds: Map<string, ClauseDefinition>,
  state: SentenceState,
): boolean {
  return line.clauseIds.every((id) => {
    const clauseDef = clausesByIds.get(id);
    if (!clauseDef) return true;
    if (!clauseDef.contingency) return false;
    return !state.clauses[id]?.present;
  });
}

function Line({ line, clausesByIds }: {
  line: LineDefinition;
  clausesByIds: Map<string, ClauseDefinition>;
}) {
  const { state } = useSentence();

  if (isLineLatent(line, clausesByIds, state)) return null;

  const indent = shouldIndent(line, clausesByIds);
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
  const { definition } = useSentence();

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
        <Line key={index} line={line} clausesByIds={clausesByIds} />
      ))}
    </div>
  );
}
