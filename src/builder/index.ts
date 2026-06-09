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
  DisplaySource,
  LineDefinition,
  Palette,
  RepeatingClauseConfig,
  SentenceContext,
  SentenceDefinition,
} from '../core/types';
import type { SentenceState } from '../core/state';
import { buildClauseContext } from '../core/context-resolution';
import { chipperPalette } from '../palette';

// ---------------------------------------------------------------------------
// Chip builder
// ---------------------------------------------------------------------------

/** Display shorthand accepted by the builder `display` key on ChipOptions. */
export type DisplayShorthand<T = unknown> =
  | T
  | ((context: import('../core/types').SentenceContext, state: import('../core/state').SentenceState) => T)
  | { url: string; extract: (response: unknown) => T; interval?: number }
  | { subscribe: (callback: (value: T) => void) => (() => void) };

/** Resolve builder `display` shorthand into a DisplaySource. */
function resolveDisplaySource(display: DisplayShorthand): DisplaySource {
  if (typeof display === 'function') {
    return { type: 'derived', compute: display as (context: import('../core/types').SentenceContext, state: import('../core/state').SentenceState) => unknown };
  }
  if (typeof display === 'object' && display !== null) {
    const obj = display as Record<string, unknown>;
    if ('url' in obj && typeof obj.url === 'string') {
      return {
        type: 'remote',
        url: obj.url,
        extract: obj.extract as (response: unknown) => unknown,
        interval: obj.interval as number | undefined,
      };
    }
    if ('subscribe' in obj) {
      return {
        type: 'external',
        subscribe: obj.subscribe as (callback: (value: unknown) => void) => (() => void),
      };
    }
  }
  // Primitive value — static source
  return { type: 'static', value: display };
}

/**
 * Define a chip within a clause.
 */
export function chip(
  id: string,
  domainName?: string | ChipOptions,
  options?: ChipOptions,
): ChipDefinition {
  // Detect .chip('id', { present: ... }) — second arg is options, not domain name
  if (typeof domainName === 'object' && domainName !== null) {
    options = domainName;
    domainName = undefined;
  }
  let mode: ChipMode = { type: 'interactive' };
  if (options?.display !== undefined) {
    const source = resolveDisplaySource(options.display);
    mode = { type: 'display', source, info: options.info };
  } else if (options?.mode) {
    mode = options.mode;
  }
  return {
    id,
    domainName: domainName ?? id,
    mode,
  };
}

// ---------------------------------------------------------------------------
// Clause builder
// ---------------------------------------------------------------------------

export interface ChipOptions {
  /** Make this a display chip. Accepts a value, function, or source config. */
  display?: DisplayShorthand;
  /** Info popup content for display chips. Accepts ReactNode for rich content. */
  info?: import('react').ReactNode | ((value: unknown, state: import('../core/state').SentenceState) => import('react').ReactNode);
  /** Legacy mode key — prefer `display` for non-interactive chips. */
  mode?: ChipMode;
  present?: (context: SentenceContext) => boolean;
}

export interface TextOptions {
  /** Dynamic text content based on sentence context. When provided, overrides the static string. */
  display?: (context: SentenceContext) => string;
  present?: (context: SentenceContext) => boolean;
}

export interface PuncOptions {
  display?: (context: SentenceContext) => string;
  present?: (context: SentenceContext) => boolean;
}

export interface ClauseBuilder {
  required(): ClauseBuilder;
  optional(): ClauseBuilder;
  text(text: string, options?: TextOptions): ClauseBuilder;
  leads(first: string, rest: string): ClauseBuilder;
  placeholder(text: string): ClauseBuilder;
  chip(id: string, domainName?: string | ChipOptions, options?: ChipOptions): ClauseBuilder;
  punc(options?: PuncOptions): ClauseBuilder;
  a(): ClauseBuilder;
  period(options?: { present?: (context: SentenceContext) => boolean }): ClauseBuilder;
  contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'> | ((context: SentenceContext) => boolean)): ClauseBuilder;
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
    text(value: string, options?: TextOptions) {
      if (options?.display) {
        // Push sentinel — post-build pass binds context resolution
        segments.push({
          type: 'text',
          value,
          present: options.present,
          __textDisplay: options.display,
        } as ClauseSegment);
      } else {
        segments.push({ type: 'text', value, present: options?.present });
      }
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
    chip(id: string, domainName?: string | ChipOptions, options?: ChipOptions) {
      // Shift object-in-second-arg before passing to standalone chip()
      if (typeof domainName === 'object' && domainName !== null) {
        options = domainName;
        domainName = undefined;
      }
      const chipDef = chip(id, domainName, options);
      chips.push(chipDef);
      segments.push({ type: 'chip', chipId: id, present: options?.present });
      return clauseBuilder;
    },
    punc(options?: PuncOptions) {
      // Push a sentinel segment — sentence().build() replaces it with a bound resolver.
      // The sentinel carries the clause ID and optional user config.
      segments.push({
        type: 'text',
        value: '__punctuation_sentinel__',
        __punctuation: { config: options },
      } as ClauseSegment);
      return clauseBuilder;
    },
    a() {
      // Push a sentinel — sentence().build() replaces it with a resolver
      // that reads the next chip's displayValue and returns "a" or "an".
      segments.push({
        type: 'text',
        value: '__article_sentinel__',
        __article: true,
      } as ClauseSegment);
      return clauseBuilder;
    },
    period(options?: { present?: (context: SentenceContext) => boolean }) {
      // Push a sentinel — sentence().build() uses it as a punc boundary
      // and replaces it with a resolver that returns ".".
      segments.push({
        type: 'text',
        value: '__period_sentinel__',
        __period: { config: options },
      } as ClauseSegment);
      return clauseBuilder;
    },
    contingentOn(superclauseId: string, config: Omit<ContingencyConfig, 'superclauseId'> | ((context: SentenceContext) => boolean)) {
      contingency = typeof config === 'function'
        ? { superclauseId, present: config }
        : { superclauseId, ...config };
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
  const rawValue = firstTextSegment?.type === 'text' ? firstTextSegment.value : '';
  const leadText = typeof rawValue === 'function' ? '' : rawValue;
  return {
    firstLead: leadText,
    restLead: leadText,
    min: options.min ?? 0,
    max: options.max ?? 5,
    template,
  };
}

// ---------------------------------------------------------------------------
// Punctuation resolution
// ---------------------------------------------------------------------------

/**
 * Default trailing-clause punctuation resolver.
 * Comma when any subsequent clause is present+active, period when last.
 * Returns empty string when owning clause is inactive.
 *
 * subsequentIds is precomputed at build time for O(1) lookups at render time.
 */
function resolveDefaultPunctuation(
  clauseId: string,
  subsequentIds: string[],
  state: SentenceState,
): string {
  const clauseState = state.clauses[clauseId];
  if (!clauseState?.present || !clauseState?.active) return '';

  const anySubsequentActive = subsequentIds.some(id => {
    const cs = state.clauses[id];
    return cs && cs.present && cs.active;
  });

  return anySubsequentActive ? ',' : '.';
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

      const definition: SentenceDefinition = {
        clauses: clauseDefinitions,
        lines: lineDefinitions.length > 0 ? lineDefinitions : undefined,
        palette: resolvedPalette,
        serializer: serializerFn,
        deserializer: deserializerFn,
      };

      // Post-build pass: replace sentinels with bound resolvers.
      // Precompute clause lookup + ordering once for all resolvers.
      const clauseByIdMap = new Map(definition.clauses.map((c) => [c.id, c]));
      const allClauseIds = definition.lines
        ? definition.lines.flatMap(l => l.clauseIds)
        : definition.clauses.map(c => c.id);

      // First pass: find period boundaries so punc knows where to stop.
      // Map clause ID → true if clause contains a period sentinel.
      const periodClauseIds = new Set<string>();
      for (const clauseDef of definition.clauses) {
        for (const segment of clauseDef.segments) {
          if ((segment as unknown as Record<string, unknown>).__period) {
            periodClauseIds.add(clauseDef.id);
          }
        }
      }

      for (const clauseDef of definition.clauses) {
        for (let i = 0; i < clauseDef.segments.length; i++) {
          const segment = clauseDef.segments[i] as unknown as Record<string, unknown>;

          // Punctuation sentinel → bound resolver
          if (segment.__punctuation) {
            const { config } = segment.__punctuation as { config?: PuncOptions };
            const clauseId = clauseDef.id;
            const idx = allClauseIds.indexOf(clauseId);
            // Subsequent IDs stop at the next period boundary
            const rawSubsequentIds = allClauseIds.slice(idx + 1);
            const periodBoundaryIdx = rawSubsequentIds.findIndex(id => periodClauseIds.has(id));
            const subsequentIds = periodBoundaryIdx >= 0
              ? rawSubsequentIds.slice(0, periodBoundaryIdx + 1)
              : rawSubsequentIds;
            clauseDef.segments[i] = {
              type: 'text',
              value: config?.display
                ? (state: SentenceState) => {
                    const cs = state.clauses[clauseId];
                    if (!cs?.present || !cs?.active) return '';
                    const context = buildClauseContext(clauseId, clauseDef, cs.chips, clauseByIdMap, state.contexts);
                    return config.display!(context);
                  }
                : (state: SentenceState) => resolveDefaultPunctuation(clauseId, subsequentIds, state),
              present: config?.present,
            };
          }

          // Article sentinel → bound resolver reading next chip's displayValue
          if (segment.__article) {
            const nextChipSegment = clauseDef.segments.slice(i + 1).find(s => s.type === 'chip');
            if (!nextChipSegment || nextChipSegment.type !== 'chip') {
              throw new Error(`.a() in clause "${clauseDef.id}" has no subsequent chip segment`);
            }
            const nextChipId = nextChipSegment.chipId;
            const clauseId = clauseDef.id;
            clauseDef.segments[i] = {
              type: 'text',
              value: (state: SentenceState) => {
                const chipState = state.clauses[clauseId]?.chips[nextChipId];
                if (!chipState) return 'a';
                const display = chipState.displayValue;
                if (!display) return 'a';
                const firstChar = display[0]?.toLowerCase() ?? '';
                return 'aeiou'.includes(firstChar) ? 'an' : 'a';
              },
            };
          }

          // Text display sentinel → bound resolver
          if (segment.__textDisplay) {
            const displayFn = segment.__textDisplay as (context: SentenceContext) => string;
            const clauseId = clauseDef.id;
            clauseDef.segments[i] = {
              type: 'text',
              value: (state: SentenceState) => {
                const cs = state.clauses[clauseId];
                if (!cs) return segment.value as string;
                const context = buildClauseContext(clauseId, clauseDef, cs.chips, clauseByIdMap, state.contexts);
                return displayFn(context);
              },
              present: (segment as unknown as { present?: (context: SentenceContext) => boolean }).present,
            };
          }

          // Period sentinel → bound resolver
          if (segment.__period) {
            const { config } = segment.__period as { config?: { present?: (context: SentenceContext) => boolean } };
            const clauseId = clauseDef.id;
            clauseDef.segments[i] = {
              type: 'text',
              value: (state: SentenceState) => {
                const cs = state.clauses[clauseId];
                if (!cs?.present || !cs?.active) return '';
                return '.';
              },
              present: config?.present,
            };
          }
        }
      }

      return definition;
    },
  };

  return sentenceBuilder;
}
