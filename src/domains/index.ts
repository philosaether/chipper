/**
 * Domain archetype implementations.
 *
 * Each archetype provides a factory function that creates a configured
 * Domain instance. See chipper-architecture.md §2, domain-factories.md.
 */

export { enumDomain, type EnumDomainConfig } from './enum';
export {
  keywordOrExpressionDomain,
  expressionDomain,
  textExpression,
  numericExpression,
  type KeywordOrExpressionDomainConfig,
  type ExpressionDomainConfig,
  type ExpressionConfig,
} from './keyword-or-expression';
export { type KeywordConfig } from './normalize-keywords';
export {
  multiSelectDomain,
  selectionMatchesKeyword,
  type MultiSelectDomainConfig,
} from './multi-select';
export {
  alternativeCoordinateDomain,
  type AlternativeCoordinateDomainConfig,
  type AlternativeCoordinateMode,
  type ModeSlot,
} from './alternative-coordinate';
export {
  referenceDomain,
  type ReferenceDomainConfig,
  type ReferenceSource,
  type ReferenceItem,
} from './reference';
