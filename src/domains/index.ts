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
  type KeywordOrExpressionDomainConfig,
  type ExpressionDomainConfig,
  type ExpressionConfig,
} from './keyword-or-expression';
export {
  multiSelectDomain,
  type MultiSelectDomainConfig,
} from './multi-select';
export {
  alternativeCoordinateDomain,
  type AlternativeCoordinateDomainConfig,
  type AlternativeCoordinateMode,
  type ModeSlot,
} from './alternative-coordinate';
