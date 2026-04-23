/**
 * Chipper — top-level auto-rendering component.
 *
 * Reads a sentence definition and renders the full clause/chip tree.
 * Consumers who need custom layouts can drop down to individual
 * Clause and Chip components (not yet implemented).
 *
 * See chipper-architecture.md §5.
 */

import type { SentenceDefinition } from '../core/types';
import type { SentenceState } from '../core/state';

export interface ChipperProps {
  /** The sentence definition to render */
  sentence: SentenceDefinition;

  /** Current state (controlled component) */
  value?: SentenceState;

  /** Called on every state change */
  onChange?: (state: SentenceState) => void;
}

/**
 * Auto-rendering Chipper component.
 *
 * Placeholder — renders a sentence skeleton showing clause structure.
 * Full implementation will render interactive chips with popup editors.
 */
export function Chipper({ sentence }: ChipperProps) {
  return (
    <div className="chipper-sentence">
      {sentence.clauses.map((clauseDef) => (
        <div key={clauseDef.id} className="chipper-clause">
          {clauseDef.lead && (
            <span className="chipper-clause__lead">{clauseDef.lead}</span>
          )}
          {clauseDef.chips.map((chipDef) => (
            <span key={chipDef.id} className="chipper-chip">
              <button
                type="button"
                className={`chipper-chip-trigger chipper-chip-trigger--placeholder`}
              >
                <span className="chipper-chip-trigger__text">
                  {chipDef.domainName}
                </span>
              </button>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
