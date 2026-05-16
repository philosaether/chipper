/**
 * Sentence builder API.
 *
 * The builder is how consumers define sentences — composing clauses
 * from palette domains with contingency relationships and behavior.
 * See chipper-architecture.md §4, builder-dx.md.
 */

import type {
  ChipDefinition,
  ChipMode,
  ClauseDefinition,
  ClauseSegment,
  ContingencyConfig,
  LineDefinition,
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
  domainName?: string,
  options?: { mode?: ChipMode },
): ChipDefinition {
  return {
    id,
    domainName: domainName ?? id,
    mode: options?.mode ?? { type: 'interactive' },
  };
}

// ---------------------------------------------------------------------------
// Clause builder
// ---------------------------------------------------------------------------

export interface ClauseBuilder {
  required(): ClauseBuilder;
  optional(): ClauseBuilder;
  text(text: string): ClauseBuilder;
  leads(first: string, rest: string): ClauseBuilder;
  placeholder(text: string): ClauseBuilder;
  chip(id: string, domainName?: string, options?: { mode?: ChipMode }): ClauseBuilder;
  contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'>): ClauseBuilder;
  produces(chipIdOrMapping: string | Record<string, string>): ClauseBuilder;
  _build(id: string): ClauseDefinition;
}

/**
 * Define a clause within a sentence.
 *
 * Segments are built in call order: .text(), .chip(), .text()
 * all push to the segment list. Text and chips interleave freely.
 */
export function builder(): ClauseBuilder {
  const segments: ClauseSegment[] = [];
  const chips: ChipDefinition[] = [];
  let necessity: ClauseDefinition['necessity'] = 'required';
  let placeholderText: string | undefined;
  let contingency: ClauseDefinition['contingency'];
  let contextProductions: ClauseDefinition['contextProductions'];

  const clauseBuilder: ClauseBuilder = {
    required() {
      necessity = 'required';
      return clauseBuilder;
    },
    optional() {
      necessity = 'optional';
      return clauseBuilder;
    },
    text(value: string) {
      segments.push({ type: 'text', value });
      return clauseBuilder;
    },
    leads(_first: string, _rest: string) {
      // Used by repeating clauses — first/rest lead text
      segments.push({ type: 'text', value: _first });
      return clauseBuilder;
    },
    placeholder(text: string) {
      placeholderText = text;
      return clauseBuilder;
    },
    chip(id: string, domainName?: string, options?: { mode?: ChipMode }) {
      const chipDef = chip(id, domainName, options);
      chips.push(chipDef);
      segments.push({ type: 'chip', chipId: id });
      return clauseBuilder;
    },
    contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'>) {
      contingency = { superclauseId, ...config };
      return clauseBuilder;
    },
    produces(chipIdOrMapping: string | Record<string, string>) {
      if (typeof chipIdOrMapping === 'string') {
        contextProductions = { [chipIdOrMapping]: chipIdOrMapping };
      } else {
        contextProductions = chipIdOrMapping;
      }
      return clauseBuilder;
    },
    _build(id: string): ClauseDefinition {
      return {
        id,
        necessity,
        segments,
        chips,
        placeholder: placeholderText,
        contingency,
        contextProductions,
      };
    },
  };

  return clauseBuilder;
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
  const firstTextSegment = template.segments.find((s) => s.type === 'text');
  const leadText = firstTextSegment?.type === 'text' ? firstTextSegment.value : '';
  return {
    firstLead: leadText,
    restLead: leadText,
    min: options.min ?? 0,
    max: options.max ?? 5,
    template,
  };
}

// ---------------------------------------------------------------------------
// Sentence builder
// ---------------------------------------------------------------------------

interface LineOptions {
  indent?: boolean;
}

interface SentenceBuilder {
  clause(id: string, clauseBuilder: ClauseBuilder): SentenceBuilder;
  clauses(clauseBuilders: ClauseBuilder[]): SentenceBuilder;
  line(options?: LineOptions): SentenceBuilder;
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
  const lineDefinitions: LineDefinition[] = [];
  // Track which line we're currently appending clauses to.
  // -1 means "before any explicit .line() call" — the implicit first line.
  let currentLineIndex = -1;
  let serializerFn: ((state: SentenceState) => Record<string, unknown>) | undefined;
  let deserializerFn: ((data: Record<string, unknown>) => Record<string, unknown>) | undefined;

  function ensureCurrentLine(options?: LineOptions): void {
    if (currentLineIndex < 0) {
      lineDefinitions.push({ clauseIds: [], indent: options?.indent });
      currentLineIndex = 0;
    }
  }

  const sentenceBuilder: SentenceBuilder = {
    clause(id: string, clauseBuilder: ClauseBuilder) {
      ensureCurrentLine();
      clauseDefinitions.push(clauseBuilder._build(id));
      lineDefinitions[currentLineIndex]!.clauseIds.push(id);
      return sentenceBuilder;
    },
    clauses(clauseBuilders: ClauseBuilder[]) {
      ensureCurrentLine();
      for (const cb of clauseBuilders) {
        const id = `_composed_${clauseDefinitions.length}`;
        clauseDefinitions.push(cb._build(id));
        lineDefinitions[currentLineIndex]!.clauseIds.push(id);
      }
      return sentenceBuilder;
    },
    line(options?: LineOptions) {
      lineDefinitions.push({ clauseIds: [], indent: options?.indent });
      currentLineIndex = lineDefinitions.length - 1;
      return sentenceBuilder;
    },
    serializer(fn) {
      serializerFn = fn;
      return sentenceBuilder;
    },
    deserializer(fn) {
      deserializerFn = fn;
      return sentenceBuilder;
    },
    build(): SentenceDefinition {
      // Validate: no duplicate chip IDs
      const seenChipIds = new Set<string>();
      for (const clauseDef of clauseDefinitions) {
        for (const chipDef of clauseDef.chips) {
          if (seenChipIds.has(chipDef.id)) {
            throw new Error(`Duplicate chip ID "${chipDef.id}" in sentence definition`);
          }
          seenChipIds.add(chipDef.id);
        }
      }

      return {
        clauses: clauseDefinitions,
        lines: lineDefinitions.length > 0 ? lineDefinitions : undefined,
        palette: resolvedPalette,
        serializer: serializerFn,
        deserializer: deserializerFn,
      };
    },
  };

  return sentenceBuilder;
}
