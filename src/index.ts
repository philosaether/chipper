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
  DisplaySource,
  StaticDisplaySource,
  DerivedDisplaySource,
  RemoteDisplaySource,
  ExternalDisplaySource,
  DisplayConfig,
  ChipDefinition,
  TextSegment,
  ChipSegment,
  ClauseSegment,
  ClauseDefinition,
  ContingencyConfig,
  ClauseOverrides,
  RepeatingClauseConfig,
  LineDefinition,
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
export { serialize, deserialize, type SerializedSentence } from './core/serialize';
export type { SetChipValueAction } from './core/actions/set-chip-value';
export type { ToggleClauseAction } from './core/actions/toggle-clause';
export type { SetContextAction } from './core/actions/set-context';
export type { SetDisplayValueAction } from './core/actions/set-display-value';

// Domains — facade factories (sugar)
export {
  textDomain,
  numberDomain,
  dateDomain,
  keywordDomain,
  type TextDomainConfig,
  type NumberDomainConfig,
  type DateDomainConfig,
  type KeywordDomainConfig,
} from './domains';

// Domains — power-user factories
export {
  keywordOrExpressionDomain,
  expressionDomain,
  textExpression,
  numericExpression,
  dateExpression,
  type KeywordOrExpressionDomainConfig,
  type ExpressionDomainConfig,
  type ExpressionConfig,
  type ExpressionTrigger,
  type KeywordConfig,
  type KeywordGroup,
  type KeywordGroupItem,
  type NormalizedKeywordGroup,
  multiSelectDomain,
  type MultiSelectDomainConfig,
  alternativeCoordinateDomain,
  type AlternativeCoordinateDomainConfig,
  type AlternativeCoordinateMode,
  type ModeSlot,
  referenceDomain,
  type ReferenceDomainConfig,
  type ReferenceSource,
  type ReferenceItem,
} from './domains';

// Palette
export { createPalette, extendPalette, type PaletteConfig } from './palette';

// Builder
export { sentence, builder, chip, repeating } from './builder';
export type { ClauseBuilder, ChipOptions, TextOptions, PuncConfig } from './builder';

// Hooks
export {
  SentenceProvider,
  type SentenceProviderProps,
  useSentence,
  useChip,
  usePopup,
  type SentenceContextValue,
  type PopupState,
} from './hooks';

// Components
export {
  Chipper,
  type ChipperProps,
  Sentence,
  Clause,
  type ClauseProps,
  Chip,
  type ChipProps,
  ChipPopup,
  type ChipPopupProps,
  KeywordOrExpressionPopup,
  type KeywordOrExpressionPopupProps,
  MultiSelectPopup,
  type MultiSelectPopupProps,
  AlternativeCoordinatePopup,
  type AlternativeCoordinatePopupProps,
  ReferencePopup,
  type ReferencePopupProps,
} from './components';

// Theme types (runtime API lives in chipper/themes, only types re-exported here)
export type { ChipperTheme, Hue } from './themes/types';
