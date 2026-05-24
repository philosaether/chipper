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

// Store + reducer
export type { SentenceStore, ResolvedDomains } from './src/core/store';
export { initializeSentenceState } from './src/core/initialize';
export { sentenceReducer, type SentenceAction } from './src/core/reducer';
export { serialize, deserialize, type SerializedSentence } from './src/core/serialize';

// Hooks
export {
  SentenceProvider,
  type SentenceProviderProps,
  useSentence,
  useChip,
  usePopup,
  type SentenceContextValue,
  type PopupState,
} from './src/hooks';

// Re-export builders and palette
export { sentence, clause, chip, repeating } from './src/builder';
export { createPalette, extendPalette } from './src/palette';
