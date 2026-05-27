/**
 * State initialization — creates a SentenceStore from a SentenceDefinition.
 *
 * Resolves each chip's domain from the palette, creates initial ChipState
 * with defaultValue, and derives clause/sentence validity. Runs an initial
 * context evaluation pass so contingent clauses start in the correct state.
 */

import type { Domain, Palette, SentenceContext, SentenceDefinition } from './types';
import type { ChipState, ClauseState, SentenceState } from './state';
import type { ResolvedDomains, SentenceStore } from './store';
import { runInitialContextPass } from './context-resolution';

/**
 * Resolve a domain name from a palette. Throws if not found —
 * a missing domain is a consumer configuration bug.
 */
function resolveDomain(domainName: string, palette: Palette): Domain {
  const domain = palette.domains[domainName];
  if (!domain) {
    throw new Error(
      `Domain "${domainName}" not found in palette. ` +
      `Available domains: ${Object.keys(palette.domains).join(', ') || '(none)'}`,
    );
  }
  return domain;
}

/** Compute displayValue from a domain and value. Context enables dynamic display. */
export function computeDisplayValue(
  domain: Domain,
  value: unknown,
  isValid: boolean,
  context?: SentenceContext,
): string {
  if (isValid) {
    return domain.display(value, context);
  }
  return domain.placeholder ?? domain.display(value, context);
}

/** Derive clause validity: all visible chips must be valid. */
export function computeClauseValidity(
  chips: Record<string, ChipState>,
  visibleChips?: string[],
): boolean {
  for (const [chipId, chipState] of Object.entries(chips)) {
    if (visibleChips && !visibleChips.includes(chipId)) continue;
    if (!chipState.valid) return false;
  }
  return true;
}

/** Derive sentence validity: all present+active clauses must be valid. */
export function computeSentenceValidity(clauses: Record<string, ClauseState>): boolean {
  return Object.values(clauses).every((c) => !(c.present && c.active) || c.valid);
}

/**
 * Build context values from a clause's chips using its contextProductions mapping.
 */
/**
 * Build context values from a clause's chips using its contextProductions mapping.
 * Hidden chips (not in visibleChips) are excluded from context production.
 */
export function buildContextFromChips(
  contextProductions: Record<string, string>,
  clauseState: ClauseState,
): SentenceContext {
  const values: SentenceContext = {};
  for (const [contextKey, sourceChipId] of Object.entries(contextProductions)) {
    if (clauseState.visibleChips && !clauseState.visibleChips.includes(sourceChipId)) continue;
    const chipState = clauseState.chips[sourceChipId];
    if (chipState) {
      values[contextKey] = chipState.value;
    }
  }
  return values;
}

/**
 * Evaluate which chips in a clause are visible based on segment presence predicates.
 * Returns undefined if all chips are unconditionally visible (no predicates).
 */
export function evaluateVisibleChips(
  segments: import('./types').ClauseSegment[],
  context: SentenceContext,
): string[] | undefined {
  let hasPredicates = false;
  const visible: string[] = [];

  for (const segment of segments) {
    if (segment.type === 'chip') {
      if (segment.present) {
        hasPredicates = true;
        if (segment.present(context)) {
          visible.push(segment.chipId);
        }
      } else {
        visible.push(segment.chipId);
      }
    }
  }

  return hasPredicates ? visible : undefined;
}

/**
 * Create a SentenceStore from a sentence definition.
 *
 * Resolves domains from the palette, initializes chip state with
 * default values (or initial values if provided), and derives
 * clause/sentence validity. Runs an initial context pass so contingent
 * clauses reflect the starting values.
 *
 * @param initialValues — Optional saved data to overlay. Keys are chip IDs
 *   with their values. `__active` maps optional clause IDs to activation state.
 *   `__expressionMode` maps chip IDs to expression mode flags.
 */
export function initializeSentenceState(
  definition: SentenceDefinition,
  initialValues?: Record<string, unknown>,
): SentenceStore {
  const domains: ResolvedDomains = {};
  const clauses: Record<string, ClauseState> = {};

  const activeOverrides = initialValues?.__active as Record<string, boolean> | undefined;
  const expressionModeOverrides = initialValues?.__expressionMode as Record<string, boolean> | undefined;

  for (const clauseDef of definition.clauses) {
    const chips: Record<string, ChipState> = {};

    for (const chipDef of clauseDef.chips) {
      const domain = resolveDomain(chipDef.domainName, definition.palette);
      domains[chipDef.id] = domain;

      const savedValue = initialValues?.[chipDef.id];
      const chipValue = savedValue !== undefined ? savedValue : domain.defaultValue;
      const isValid = domain.validate(chipValue);
      chips[chipDef.id] = {
        value: chipValue,
        displayValue: computeDisplayValue(domain, chipValue, isValid),
        valid: isValid,
        dirty: savedValue !== undefined,
        expressionMode: expressionModeOverrides?.[chipDef.id] ?? undefined,
      };
    }

    // Evaluate initial segment visibility — needs context from ancestor productions,
    // but at init time there's no context yet. Use empty context; the initial context
    // pass (runInitialContextPass) will re-evaluate after defaults propagate.
    const visibleChips = evaluateVisibleChips(clauseDef.segments, {});

    // Determine clause activation: explicit override > default behavior
    const isOptional = clauseDef.necessity === 'optional';
    const activeDefault = !isOptional; // required = active, optional = inactive
    const active = isOptional && activeOverrides
      ? (activeOverrides[clauseDef.id] ?? activeDefault)
      : activeDefault;

    clauses[clauseDef.id] = {
      present: !clauseDef.contingency,
      active,
      chips,
      valid: computeClauseValidity(chips, visibleChips),
      visibleChips,
    };
  }

  const state: SentenceState = {
    clauses,
    contexts: [],
    valid: computeSentenceValidity(clauses),
  };

  // Precompute clause lookup indices
  const clauseById = new Map(definition.clauses.map((c) => [c.id, c]));
  const clausesBySuper = new Map<string, import('./types').ClauseDefinition[]>();
  for (const clause of definition.clauses) {
    if (clause.contingency) {
      const superId = clause.contingency.superclauseId;
      const existing = clausesBySuper.get(superId);
      if (existing) {
        existing.push(clause);
      } else {
        clausesBySuper.set(superId, [clause]);
      }
    }
  }

  const store: SentenceStore = { state, domains, definition, clauseById, clausesBySuper };

  // Run initial context pass so contingent clauses reflect starting values
  return runInitialContextPass(store);
}
