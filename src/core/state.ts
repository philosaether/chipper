/**
 * Runtime state types for a Chipper sentence.
 *
 * These types represent the *current state* of a sentence instance —
 * what values the user has selected, which clauses are active, etc.
 * Structure definitions live in types.ts.
 */

import type { SentenceContext } from './types';

/** State of a single chip. */
export interface ChipState<T = unknown> {
  /** Current value */
  value: T;

  /** Formatted display string (shown in chip trigger) */
  displayValue: string;

  /** Whether the current value passes domain validation */
  valid: boolean;

  /** Whether the value has changed from the initial state */
  dirty: boolean;

  /** Whether a live source is currently fetching (live chips only) */
  loading?: boolean;

  /** Error message from live source or computed derivation */
  error?: string;
}

/** State of a single clause. */
export interface ClauseState {
  /** Whether the clause is rendered. Engine-controlled via contingency. */
  present: boolean;

  /** Whether the clause contributes to sentence value. User-controlled for optional clauses. */
  active: boolean;

  /** State of each chip in this clause, keyed by chip ID */
  chips: Record<string, ChipState>;

  /** Whether all chips in this clause are valid (derived) */
  valid: boolean;

  /** Chips currently visible (undefined = all visible, for clauses without segment contingency) */
  visibleChips?: string[];
}

/** Context scope — one node in the contingency-scoped context tree. */
export interface ContextScope {
  /** The clause ID that owns this scope */
  clauseId: string;

  /** Context values produced by this clause */
  values: SentenceContext;

  /** Parent scope (from superclause), or null for root clauses */
  parentScopeId: string | null;
}

/** Complete state of a sentence instance. */
export interface SentenceState {
  /** State of each clause, keyed by clause ID */
  clauses: Record<string, ClauseState>;

  /** Tree-scoped context (see chipper-architecture.md §1) */
  contexts: ContextScope[];

  /** Whether all active clauses are valid (derived) */
  valid: boolean;
}
