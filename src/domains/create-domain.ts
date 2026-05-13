/**
 * Shared domain assembly — internal to src/domains/.
 *
 * All archetype factories call createDomain to produce a conformant
 * Domain<T>. This function fills defaults for omitted fields and
 * passes through everything else. It contains no archetype-specific logic.
 *
 * Not exported from the package. Consumers use archetype factories.
 */

import type { Domain, ExpressionMode, Keyword, SentenceContext } from '../core/types';

/** Fields accepted by the internal createDomain function. */
export interface BaseDomainConfig<T> {
  type: string;
  color: string;
  keywords?: Keyword<T>[];
  expressionModes?: ExpressionMode<T>[];
  defaultValue: T;
  placeholder?: string;
  validate?: (value: T) => boolean;
  display?: (value: T) => string;
  consumes?: string[];
  produces?: string[];
  onContextChange?: (context: SentenceContext) => Partial<Domain<T>>;
  meta?: Record<string, unknown>;
}

/** Assemble a Domain<T> from config, filling sensible defaults. */
export function createDomain<T>(config: BaseDomainConfig<T>): Domain<T> {
  return {
    type: config.type,
    color: config.color,
    keywords: config.keywords ?? [],
    expressionModes: config.expressionModes ?? [],
    defaultValue: config.defaultValue,
    placeholder: config.placeholder,
    validate: config.validate ?? (() => true),
    display: config.display ?? ((value: T) => String(value)),
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: config.meta,
  };
}
