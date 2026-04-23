/**
 * Chipper — Plain-English editing interfaces for complex configuration.
 *
 * Public API surface. Everything exported here is part of the library contract.
 */

// Core types
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
} from './core/types';

// State types
export type {
  ChipState,
  ClauseState,
  ContextScope,
  SentenceState,
} from './core/state';

// Palette
export { createPalette, extendPalette } from './palette';

// Builder
export { sentence, clause, chip, repeating } from './builder';

// Components
export { Chipper } from './components';
