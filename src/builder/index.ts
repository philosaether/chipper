/**
 * Sentence builder API.
 *
 * The builder is how consumers define sentences — composing clauses
 * from palette domains with contingency relationships and behavior.
 * See chipper-architecture.md §4.
 */

import type {
  ChipDefinition,
  ChipMode,
  ClauseDefinition,
  ContingencyConfig,
  Palette,
  RepeatingClauseConfig,
  SentenceDefinition,
} from '../core/types';
import type { SentenceState } from '../core/state';
import { chipperPalette } from '../palette';

// ---------------------------------------------------------------------------
// Chip builder
// ---------------------------------------------------------------------------

/**
 * Define a chip within a clause.
 */
export function chip(
  id: string,
  domainName: string,
  options?: { mode?: ChipMode },
): ChipDefinition {
  return {
    id,
    domainName,
    mode: options?.mode ?? { type: 'interactive' },
  };
}

// ---------------------------------------------------------------------------
// Clause builder
// ---------------------------------------------------------------------------

interface ClauseBuilder {
  required(): ClauseBuilder;
  optional(): ClauseBuilder;
  lead(text: string): ClauseBuilder;
  leads(first: string, rest: string): ClauseBuilder;
  placeholder(text: string): ClauseBuilder;
  chip(id: string, domainName: string, options?: { mode?: ChipMode }): ClauseBuilder;
  contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'>): ClauseBuilder;
  produces(mapping: Record<string, string>): ClauseBuilder;
  _build(id: string): ClauseDefinition;
}

/**
 * Define a clause within a sentence.
 */
export function clause(): ClauseBuilder {
  const definition: Partial<ClauseDefinition> & { chips: ChipDefinition[] } = {
    necessity: 'required',
    chips: [],
  };

  const builder: ClauseBuilder = {
    required() {
      definition.necessity = 'required';
      return builder;
    },
    optional() {
      definition.necessity = 'optional';
      return builder;
    },
    lead(text: string) {
      definition.lead = text;
      return builder;
    },
    leads(_first: string, _rest: string) {
      // Used by repeating clauses — first/rest lead text
      definition.lead = _first;
      return builder;
    },
    placeholder(text: string) {
      definition.placeholder = text;
      return builder;
    },
    chip(id: string, domainName: string, options?: { mode?: ChipMode }) {
      definition.chips.push(chip(id, domainName, options));
      return builder;
    },
    contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'>) {
      definition.contingency = { superclauseId, ...config };
      return builder;
    },
    produces(mapping: Record<string, string>) {
      definition.contextProductions = mapping;
      return builder;
    },
    _build(id: string): ClauseDefinition {
      return {
        id,
        necessity: definition.necessity ?? 'required',
        lead: definition.lead,
        placeholder: definition.placeholder,
        chips: definition.chips,
        contingency: definition.contingency,
        contextProductions: definition.contextProductions,
      };
    },
  };

  return builder;
}

// ---------------------------------------------------------------------------
// Repeating clause helper
// ---------------------------------------------------------------------------

/**
 * Define a repeating clause group (e.g., "when [condition], and [condition], ...").
 */
export function repeating(
  clauseBuilder: ClauseBuilder,
  options: { min?: number; max?: number },
): RepeatingClauseConfig {
  const template = clauseBuilder._build('__template__');
  return {
    firstLead: template.lead ?? '',
    restLead: template.lead ?? '',
    min: options.min ?? 0,
    max: options.max ?? 5,
    template,
  };
}

// ---------------------------------------------------------------------------
// Sentence builder
// ---------------------------------------------------------------------------

interface SentenceBuilder {
  clause(id: string, clauseBuilder: ClauseBuilder): SentenceBuilder;
  clauses(clauseBuilders: ClauseBuilder[]): SentenceBuilder;
  serializer(fn: (state: SentenceState) => Record<string, unknown>): SentenceBuilder;
  deserializer(fn: (data: Record<string, unknown>) => Record<string, unknown>): SentenceBuilder;
  build(): SentenceDefinition;
}

/**
 * Define a sentence. Entry point for the builder API.
 *
 * @param palette - The palette to resolve domain names from. Defaults to chipperPalette.
 */
export function sentence(palette?: Palette): SentenceBuilder {
  const resolvedPalette = palette ?? chipperPalette;
  const clauseDefinitions: ClauseDefinition[] = [];
  let serializerFn: ((state: SentenceState) => Record<string, unknown>) | undefined;
  let deserializerFn: ((data: Record<string, unknown>) => Record<string, unknown>) | undefined;

  const builder: SentenceBuilder = {
    clause(id: string, clauseBuilder: ClauseBuilder) {
      clauseDefinitions.push(clauseBuilder._build(id));
      return builder;
    },
    clauses(clauseBuilders: ClauseBuilder[]) {
      // Clause composition helpers return arrays — spread them in
      for (const cb of clauseBuilders) {
        clauseDefinitions.push(cb._build(`_composed_${clauseDefinitions.length}`));
      }
      return builder;
    },
    serializer(fn) {
      serializerFn = fn;
      return builder;
    },
    deserializer(fn) {
      deserializerFn = fn;
      return builder;
    },
    build(): SentenceDefinition {
      return {
        clauses: clauseDefinitions,
        palette: resolvedPalette,
        serializer: serializerFn,
        deserializer: deserializerFn,
      };
    },
  };

  return builder;
}
