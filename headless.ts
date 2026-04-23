/**
 * Chipper headless entry point.
 *
 * Exports hooks and state management without any UI components or styles.
 * Import as 'chipper/headless'.
 */

// Re-export core types and state
export type {
  Domain,
  Keyword,
  ExpressionMode,
  ChipMode,
  LiveSource,
  ComputedSource,
  ChipDefinition,
  ClauseDefinition,
  ContingencyConfig,
  ClauseOverrides,
  RepeatingClauseConfig,
  SentenceDefinition,
  SentenceContext,
  Palette,
  ClauseTemplate,
} from './src/core/types';

export type {
  ChipState,
  ClauseState,
  ContextScope,
  SentenceState,
} from './src/core/state';

// Re-export builders and palette
export { sentence, clause, chip, repeating } from './src/builder';
export { createPalette, extendPalette } from './src/palette';
