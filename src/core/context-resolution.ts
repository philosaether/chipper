/**
 * Context resolution — tree-scoped context propagation for the contingency engine.
 *
 * Context propagates down the contingency tree. A producing clause writes
 * context visible to its contingent descendants. A consuming clause walks
 * up its contingency chain to find the nearest ancestor producer.
 *
 * See chipper-architecture.md §1 (Sentence Context) and
 * contingency-engine.md §3 (Context Propagation).
 */

import type { SentenceContext, ClauseDefinition } from './types';
import type { ChipState, ClauseState, ContextScope } from './state';
import type { SentenceStore } from './store';
import { computeClauseValidity, computeDisplayValue, computeSentenceValidity, buildContextFromChips, evaluateVisibleChips } from './initialize';

/**
 * Build a clause's full context by merging ancestor context with its own productions.
 * Used for evaluating segment predicates (both chip and text visibility).
 */
export function buildClauseContext(
  clauseId: string,
  clauseDef: ClauseDefinition,
  clauseChips: Record<string, ChipState>,
  clauseById: Map<string, ClauseDefinition>,
  contexts: ContextScope[],
): SentenceContext {
  const ctx = resolveContext(clauseId, clauseById, contexts);
  if (clauseDef.contextProductions) {
    for (const [key, srcChipId] of Object.entries(clauseDef.contextProductions)) {
      const cs = clauseChips[srcChipId];
      if (cs) ctx[key] = cs.value;
    }
  }
  return ctx;
}

/**
 * Resolve the full context visible to a clause by walking up the contingency chain.
 * Nearest ancestor's values win — keys already resolved are not overwritten.
 */
export function resolveContext(
  clauseId: string,
  clauseById: Map<string, ClauseDefinition>,
  contexts: ContextScope[],
): SentenceContext {
  const resolved: SentenceContext = {};
  let currentId: string | undefined = clauseId;

  while (currentId) {
    const clauseDef = clauseById.get(currentId);
    const superclauseId = clauseDef?.contingency?.superclauseId;

    if (superclauseId) {
      const scope = contexts.find((s) => s.clauseId === superclauseId);
      if (scope) {
        for (const [key, value] of Object.entries(scope.values)) {
          if (!(key in resolved)) {
            resolved[key] = value;
          }
        }
      }
    }

    currentId = superclauseId;
  }

  return resolved;
}

/**
 * Find the parent scope ID for a clause (the superclause's clause ID, if any).
 */
function findParentScopeId(
  clauseId: string,
  clauseById: Map<string, ClauseDefinition>,
): string | null {
  const clauseDef = clauseById.get(clauseId);
  return clauseDef?.contingency?.superclauseId ?? null;
}

/**
 * Evaluate contingency for all clauses contingent on a given clause.
 * Updates presence, applies domain reconfiguration, revalidates chips,
 * and cascades through subtrees.
 */
export function evaluateContingency(
  store: SentenceStore,
  clauseId: string,
  values: SentenceContext,
): SentenceStore {
  const { clauseById, clausesBySuper } = store;

  // Update this clause's context scope
  const existingIndex = store.state.contexts.findIndex((s) => s.clauseId === clauseId);
  const parentScopeId = findParentScopeId(clauseId, clauseById);
  const newScope: ContextScope = { clauseId, values, parentScopeId };
  let newContexts = existingIndex >= 0
    ? store.state.contexts.map((s, i) => i === existingIndex ? newScope : s)
    : [...store.state.contexts, newScope];

  let newClauses = { ...store.state.clauses };
  let newDomains = { ...store.domains };

  // Find all clauses contingent on this one
  const contingentDefs = clausesBySuper.get(clauseId) ?? [];

  for (const contingentDef of contingentDefs) {
    const context = resolveContext(contingentDef.id, clauseById, newContexts);

    // Evaluate presence
    const shouldBePresent = contingentDef.contingency!.present
      ? contingentDef.contingency!.present(context)
      : true;

    const current = newClauses[contingentDef.id];
    if (!current) continue;

    if (current.present !== shouldBePresent) {
      newClauses = {
        ...newClauses,
        [contingentDef.id]: { ...current, present: shouldBePresent },
      };
    }

    // Apply clause-level domain overrides (configure)
    if (contingentDef.contingency!.configure && shouldBePresent) {
      const overrides = contingentDef.contingency!.configure(context);
      if (overrides.chipOverrides) {
        for (const [chipId, domainOverride] of Object.entries(overrides.chipOverrides)) {
          const baseDomain = store.domains[chipId];
          if (baseDomain) {
            newDomains = { ...newDomains, [chipId]: { ...baseDomain, ...domainOverride } };
          }
        }
      }
    }

    // Apply domain-level reconfiguration (onContextChange)
    if (shouldBePresent) {
      for (const chipDef of contingentDef.chips) {
        const domain = newDomains[chipDef.id];
        if (domain?.onContextChange) {
          const domainOverride = domain.onContextChange(context);
          newDomains = { ...newDomains, [chipDef.id]: { ...domain, ...domainOverride } };
        }
      }
    }

    // Revalidate and recompute display for chips (domains or context may have changed)
    if (shouldBePresent) {
      const revalContext = buildClauseContext(
        contingentDef.id, contingentDef, newClauses[contingentDef.id]!.chips, clauseById, newContexts,
      );
      newClauses = revalidateClauseChips(contingentDef, store, newDomains, newClauses, revalContext);
    } else {
      newClauses = revalidateClauseChips(contingentDef, store, newDomains, newClauses);
    }

    // Re-evaluate segment visibility for the contingent clause
    if (shouldBePresent) {
      const clauseForVisibility = newClauses[contingentDef.id];
      if (clauseForVisibility) {
        const segmentContext = buildClauseContext(
          contingentDef.id, contingentDef, clauseForVisibility.chips, clauseById, newContexts,
        );
        const visibleChips = evaluateVisibleChips(contingentDef.segments, segmentContext);
        newClauses = {
          ...newClauses,
          [contingentDef.id]: {
            ...clauseForVisibility,
            visibleChips,
            valid: computeClauseValidity(clauseForVisibility.chips, visibleChips),
          },
        };
      }
    }

    // Cascade: newly-present clause that produces context → recurse
    if (shouldBePresent && contingentDef.contextProductions && newClauses[contingentDef.id]?.present) {
      const childContext = buildContextFromChips(
        contingentDef.contextProductions,
        newClauses[contingentDef.id]!,
      );
      const cascaded = evaluateContingency(
        { ...store, state: { ...store.state, contexts: newContexts, clauses: newClauses }, domains: newDomains },
        contingentDef.id,
        childContext,
      );
      newClauses = cascaded.state.clauses;
      newContexts = cascaded.state.contexts;
      newDomains = cascaded.domains;
    }

    // Latent clause: remove context scope and cascade latency
    if (!shouldBePresent) {
      newContexts = newContexts.filter((s) => s.clauseId !== contingentDef.id);
      const cascaded = cascadeLatency(contingentDef.id, store.clausesBySuper, newClauses, newContexts);
      newClauses = cascaded.clauses;
      newContexts = cascaded.contexts;
    }
  }

  return {
    ...store,
    domains: newDomains,
    state: {
      ...store.state,
      contexts: newContexts,
      clauses: newClauses,
      valid: computeSentenceValidity(newClauses),
    },
  };
}

/**
 * Revalidate chips in a clause whose domains or context may have changed.
 * When context is provided, recomputes display for all chips (context-aware display).
 * When context is absent, only revalidates chips whose domains changed.
 * Returns a new clauses record — does not mutate the input.
 */
function revalidateClauseChips(
  contingentDef: ClauseDefinition,
  store: SentenceStore,
  newDomains: Record<string, import('./types').Domain>,
  clauses: Record<string, ClauseState>,
  context?: SentenceContext,
): Record<string, ClauseState> {
  let result = clauses;

  for (const chipDef of contingentDef.chips) {
    const domainChanged = newDomains[chipDef.id] !== store.domains[chipDef.id];
    if (!domainChanged && !context) continue;

    const clause = result[contingentDef.id];
    const chipState = clause?.chips[chipDef.id];
    if (clause && chipState) {
      const domain = newDomains[chipDef.id]!;
      const isValid = domainChanged ? domain.validate(chipState.value) : chipState.valid;
      const newDisplayValue = computeDisplayValue(domain, chipState.value, isValid, context);
      if (newDisplayValue === chipState.displayValue && isValid === chipState.valid) continue;
      const newChipState: ChipState = {
        ...chipState,
        valid: isValid,
        displayValue: newDisplayValue,
      };
      const newChips = { ...clause.chips, [chipDef.id]: newChipState };
      result = {
        ...result,
        [contingentDef.id]: {
          ...clause,
          chips: newChips,
          valid: computeClauseValidity(newChips, clause.visibleChips),
        },
      };
    }
  }

  return result;
}

/**
 * Cascade latency: when a clause becomes latent, its contingent
 * descendants also become latent and their context scopes are removed.
 * Returns new clauses and contexts — does not mutate inputs.
 */
function cascadeLatency(
  latentClauseId: string,
  clausesBySuper: Map<string, ClauseDefinition[]>,
  clauses: Record<string, ClauseState>,
  contexts: ContextScope[],
): { clauses: Record<string, ClauseState>; contexts: ContextScope[] } {
  let newClauses = clauses;
  let newContexts = contexts;

  const children = clausesBySuper.get(latentClauseId) ?? [];
  for (const child of children) {
    const childState = newClauses[child.id];
    if (childState?.present) {
      newClauses = { ...newClauses, [child.id]: { ...childState, present: false } };
      newContexts = newContexts.filter((s) => s.clauseId !== child.id);
      // Recurse into grandchildren
      const cascaded = cascadeLatency(child.id, clausesBySuper, newClauses, newContexts);
      newClauses = cascaded.clauses;
      newContexts = cascaded.contexts;
    }
  }

  return { clauses: newClauses, contexts: newContexts };
}

/**
 * Run initial context evaluation after state initialization.
 * For each clause that produces context, compute context from default
 * chip values and evaluate contingent clauses.
 */
export function runInitialContextPass(store: SentenceStore): SentenceStore {
  let current = store;

  for (const clauseDef of store.definition.clauses) {
    if (!clauseDef.contextProductions) continue;
    const clauseState = current.state.clauses[clauseDef.id];
    if (!clauseState?.present) continue;

    const contextValues = buildContextFromChips(
      clauseDef.contextProductions,
      clauseState,
    );

    current = evaluateContingency(current, clauseDef.id, contextValues);
  }

  return current;
}
