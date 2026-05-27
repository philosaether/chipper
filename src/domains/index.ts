/**
 * Domain archetype implementations.
 *
 * Each archetype provides a factory function that creates a configured
 * Domain instance. See chipper-architecture.md §2, domain-factories.md,
 * koe-facades.md.
 */

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
} from './keyword-or-expression';
export {
  type KeywordConfig,
  type KeywordGroup,
  type KeywordGroupItem,
  type NormalizedKeywordGroup,
} from './normalize-keywords';
export {
  textDomain,
  numberDomain,
  dateDomain,
  keywordDomain,
  type TextDomainConfig,
  type NumberDomainConfig,
  type DateDomainConfig,
  type KeywordDomainConfig,
} from './facades';
export {
  multiSelectDomain,
  selectionMatchesKeyword,
  type MultiSelectDomainConfig,
} from './multi-select';
export {
  alternativeCoordinateDomain,
  type AlternativeCoordinateDomainConfig,
  type AlternativeCoordinateMode,
  type ResolvedAlternativeCoordinateMode,
  type ResolvedModeSlot,
  type ModeSlot,
} from './alternative-coordinate';
export {
  referenceDomain,
  type ReferenceDomainConfig,
  type ReferenceSource,
  type ReferenceItem,
} from './reference';
