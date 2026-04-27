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

// Store + reducer
export type { SentenceStore, ResolvedDomains } from './core/store';
export { initializeSentenceState } from './core/initialize';
export { sentenceReducer, type SentenceAction } from './core/reducer';
export type { SetChipValueAction } from './core/actions/set-chip-value';
export type { ToggleClauseAction } from './core/actions/toggle-clause';
export type { SetContextAction } from './core/actions/set-context';
export type { SetLiveValueAction } from './core/actions/set-live-value';

// Domains
export { enumDomain, type EnumDomainConfig } from './domains';

// Palette
export { createPalette, extendPalette } from './palette';

// Builder
export { sentence, clause, chip, repeating } from './builder';

// Components
export { Chipper } from './components';
