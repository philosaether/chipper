/**
 * Chipper — top-level auto-rendering component.
 *
 * Wraps SentenceProvider + Sentence. Consumers write:
 *   <Chipper sentence={def} onChange={fn} />
 *
 * For custom layouts, pass children instead of relying on auto-render:
 *   <Chipper sentence={def} onChange={fn}>
 *     <MyCustomLayout />
 *   </Chipper>
 */

import type { SentenceDefinition } from '../core/types';
import type { SentenceState } from '../core/state';
import { SentenceProvider } from '../hooks/SentenceProvider';
import { Sentence } from './Sentence';

export interface ChipperProps {
  /** The sentence definition to render */
  sentence: SentenceDefinition;

  /** Called on every state change */
  onChange?: (state: SentenceState) => void;

  /** Custom children — if provided, replaces auto-rendered Sentence */
  children?: React.ReactNode;
}

export function Chipper({ sentence, onChange, children }: ChipperProps) {
  return (
    <SentenceProvider definition={sentence} onChange={onChange}>
      {children ?? <Sentence />}
    </SentenceProvider>
  );
}
