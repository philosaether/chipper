/**
 * Core type definitions for the Chipper data model.
 *
 * Hierarchy: Sentence > Clause > Chip > Domain
 *
 * These types define the *structure* of a sentence definition —
 * what clauses exist, what chips they contain, and how they relate.
 * Runtime state is defined in state.ts.
 */

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

/** A named preset value within a domain. */
export interface Keyword<T = unknown> {
  /** Display label shown in the popup */
  label: string;

  /** The value this keyword represents */
  value: T;

  /**
   * If true, this keyword collapses only some DOF — the chip may still
   * need additional input after selection.
   */
  partial?: boolean;
}

/** One way for a user to specify a value within a domain's value space. */
export interface ExpressionMode<T = unknown> {
  /** Unique identifier for this mode */
  id: string;

  /** Human-readable label (shown in tabbed UI for alternative-coordinate domains) */
  label: string;

  /** Number of independent choices the user must make */
  degreesOfFreedom: number;

  /** Validate a value produced by this mode */
  validate: (value: T) => boolean;

  /** Format a value produced by this mode for display */
  display: (value: T) => string;
}

/**
 * A domain defines the kind of data a chip accepts.
 * Every chip has exactly one domain.
 */
export interface Domain<T = unknown> {
  /** Unique identifier for this domain type */
  type: string;

  /** Semantic color key — maps to a CSS custom property (--chip-color-{color}) */
  color: string;

  /** Named presets. Full keywords collapse all DOF; partial keywords leave some open. */
  keywords: Keyword<T>[];

  /** Available ways to specify a value (besides keywords) */
  expressionModes: ExpressionMode<T>[];

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Validate a value */
  validate: (value: T) => boolean;

  /** Format a value for display in the chip trigger */
  display: (value: T) => string;

  /** Default value (may or may not be valid) */
  defaultValue: T;

  /** Text shown in the chip trigger when the current value is invalid */
  placeholder?: string;

  /** Reconfigure domain based on context from ancestor clauses */
  onContextChange?: (context: SentenceContext) => Partial<Domain<T>>;
}

// ---------------------------------------------------------------------------
// Chip modes
// ---------------------------------------------------------------------------

/** Configuration for a live data source (polling or one-shot fetch). */
export interface LiveSource {
  /** URL to fetch from */
  url: string;

  /** Extract value from response — JSONPath string or function */
  extract: string | ((response: unknown) => unknown);

  /** Poll interval in ms. If omitted, fetch once on mount. */
  interval?: number;

  /** Format the extracted value for display */
  format?: (value: unknown) => string;
}

/**
 * Configuration for a computed chip whose value derives from sibling state.
 * Uses import('...') to avoid circular dependency with state.ts.
 */
export interface ComputedSource<T = unknown> {
  /** Derive value from current sentence state */
  compute: (state: import('./state').SentenceState) => T;

  /** Which chip IDs to watch for changes */
  dependencies: string[];
}

export type ChipMode =
  | { type: 'interactive' }
  | { type: 'readonly' }
  | { type: 'live'; source: LiveSource }
  | { type: 'computed'; source: ComputedSource };

// ---------------------------------------------------------------------------
// Chips, Clauses, Sentences
// ---------------------------------------------------------------------------

/** Definition of a single chip within a clause. */
export interface ChipDefinition {
  /** Unique identifier within the sentence */
  id: string;

  /** Domain name (resolved from the palette) */
  domainName: string;

  /** Chip mode — defaults to interactive */
  mode: ChipMode;
}

/** Contingency configuration — how a clause depends on its superclause. */
export interface ContingencyConfig {
  /** The ID of the superclause */
  superclauseId: string;

  /** When is this clause present? Receives scoped context from ancestors. */
  present?: (context: SentenceContext) => boolean;

  /** How should this clause reconfigure based on context? */
  configure?: (context: SentenceContext) => ClauseOverrides;
}

/** Overrides applied to a clause when its superclause context changes. */
export interface ClauseOverrides {
  chipOverrides?: Record<string, Partial<Domain>>;
}

// ---------------------------------------------------------------------------
// Clause segments
// ---------------------------------------------------------------------------

/** A text span within a clause (lead text, trailing text, interleaved text). */
export interface TextSegment {
  type: 'text';
  value: string;
}

/** A chip reference within a clause. */
export interface ChipSegment {
  type: 'chip';
  chipId: string;
}

/** One piece of a clause's rendering order. */
export type ClauseSegment = TextSegment | ChipSegment;

/** Definition of a single clause within a sentence. */
export interface ClauseDefinition {
  /** Unique identifier within the sentence */
  id: string;

  /** Whether the user can toggle this clause */
  necessity: 'required' | 'optional';

  /** Rendering order: interleaved text spans and chip references */
  segments: ClauseSegment[];

  /** Extracted chip definitions (derived from segments for initializer/reducer convenience) */
  chips: ChipDefinition[];

  /** Placeholder text shown when an optional clause is dormant */
  placeholder?: string;

  /** Contingency on a superclause */
  contingency?: ContingencyConfig;

  /** Context keys this clause produces (mapped from chip values) */
  contextProductions?: Record<string, string>;
}

/** Configuration for a repeating clause group. */
export interface RepeatingClauseConfig {
  /** Lead text for the first instance */
  firstLead: string;

  /** Lead text for subsequent instances */
  restLead: string;

  /** Minimum number of instances (0 = all optional) */
  min: number;

  /** Maximum number of instances */
  max: number;

  /** The clause template to repeat */
  template: ClauseDefinition;
}

/** Complete definition of a sentence. */
export interface SentenceDefinition {
  /** Ordered list of clause definitions */
  clauses: ClauseDefinition[];

  /** Repeating clause groups, keyed by group ID */
  repeatingClauses?: Record<string, RepeatingClauseConfig>;

  /** The palette this sentence was built from */
  palette: Palette;

  /** Custom serializer (if not provided, default flat serialization is used) */
  serializer?: (state: import('./state').SentenceState) => Record<string, unknown>;

  /** Custom deserializer (if not provided, default flat deserialization is used) */
  deserializer?: (data: Record<string, unknown>) => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

/** A clause template — a reusable clause pattern within a palette. */
export interface ClauseTemplate {
  /** Human-readable description */
  description: string;

  /** The clause definition template */
  definition: Omit<ClauseDefinition, 'id'>;
}

/**
 * A palette provides pre-configured domains and reusable clause templates.
 * It sits between Chipper core and the consumer application.
 */
export interface Palette {
  /** Named domain configurations */
  domains: Record<string, Domain>;

  /** Named clause templates (optional convenience) */
  clauseTemplates?: Record<string, ClauseTemplate>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Sentence context — tree-scoped shared state.
 *
 * Context propagates down the contingency tree. A producing clause writes
 * keys visible to its contingent descendants. A consuming clause walks up
 * its contingency chain to the nearest ancestor producer.
 */
export type SentenceContext = Record<string, unknown>;
