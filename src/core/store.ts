/**
 * SentenceStore — the combined state + resolved domains for a sentence instance.
 *
 * The store is the single value managed by useReducer in the React layer.
 * Domains are resolved once at initialization and stored alongside state
 * so the reducer can call validate/display without re-resolving from the palette.
 */

import type { ClauseDefinition, Domain, SentenceDefinition } from './types';
import type { SentenceState } from './state';

/** Resolved domains keyed by chip ID. */
export type ResolvedDomains = Record<string, Domain>;

/** Combined state + domains + definition for a sentence instance. */
export interface SentenceStore {
  state: SentenceState;
  domains: ResolvedDomains;
  /** Static sentence definition — stored for reducer access to contingency config. */
  definition: SentenceDefinition;
  /** Clause lookup by ID — precomputed at init, avoids repeated .find() calls. */
  clauseById: Map<string, ClauseDefinition>;
  /** Contingent clauses grouped by superclause ID — precomputed at init. */
  clausesBySuper: Map<string, ClauseDefinition[]>;
}
