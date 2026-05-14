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

import type { SentenceContext, SentenceDefinition, ClauseDefinition } from './types';
import type { ChipState, ClauseState, ContextScope } from './state';
import type { SentenceStore } from './store';
import { computeClauseValidity, computeDisplayValue, computeSentenceValidity, buildContextFromChips } from './initialize';

/**
 * Resolve the full context visible to a clause by walking up the contingency chain.
 * Nearest ancestor's values win — keys already resolved are not overwritten.
 */
export function resolveContext(
  clauseId: string,
  definition: SentenceDefinition,
  contexts: ContextScope[],
): SentenceContext {
  const resolved: SentenceContext = {};
  let currentId: string | undefined = clauseId;

  while (currentId) {
    const clauseDef = definition.clauses.find((c) => c.id === currentId);
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
  definition: SentenceDefinition,
): string | null {
  const clauseDef = definition.clauses.find((c) => c.id === clauseId);
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
  const { definition } = store;

  // Update this clause's context scope
  const existingIndex = store.state.contexts.findIndex((s) => s.clauseId === clauseId);
  const parentScopeId = findParentScopeId(clauseId, definition);
  const newScope: ContextScope = { clauseId, values, parentScopeId };
  let newContexts = existingIndex >= 0
    ? store.state.contexts.map((s, i) => i === existingIndex ? newScope : s)
    : [...store.state.contexts, newScope];

  let newClauses = { ...store.state.clauses };
  let newDomains = { ...store.domains };

  // Find all clauses contingent on this one
  const contingentDefs = definition.clauses.filter(
    (c) => c.contingency?.superclauseId === clauseId,
  );

  for (const contingentDef of contingentDefs) {
    const context = resolveContext(contingentDef.id, definition, newContexts);

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

    // Revalidate chips whose domains changed
    revalidateClauseChips(contingentDef, store, newDomains, newClauses);

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
      newClauses = cascadeLatency(contingentDef.id, definition, newClauses, newContexts);
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
 * Revalidate chips in a clause whose domains may have changed.
 * Mutates newClauses in place for efficiency within the evaluation loop.
 */
function revalidateClauseChips(
  contingentDef: ClauseDefinition,
  store: SentenceStore,
  newDomains: Record<string, import('./types').Domain>,
  newClauses: Record<string, ClauseState>,
): void {
  for (const chipDef of contingentDef.chips) {
    if (newDomains[chipDef.id] !== store.domains[chipDef.id]) {
      const clause = newClauses[contingentDef.id];
      const chipState = clause?.chips[chipDef.id];
      if (clause && chipState) {
        const domain = newDomains[chipDef.id]!;
        const isValid = domain.validate(chipState.value);
        const newChipState: ChipState = {
          ...chipState,
          valid: isValid,
          displayValue: computeDisplayValue(domain, chipState.value, isValid),
        };
        const newChips = { ...clause.chips, [chipDef.id]: newChipState };
        newClauses[contingentDef.id] = {
          ...clause,
          chips: newChips,
          valid: computeClauseValidity(newChips),
        };
      }
    }
  }
}

/**
 * Cascade latency: when a clause becomes latent, its contingent
 * descendants also become latent and their context scopes are removed.
 */
function cascadeLatency(
  latentClauseId: string,
  definition: SentenceDefinition,
  clauses: Record<string, ClauseState>,
  contexts: ContextScope[],
): Record<string, ClauseState> {
  let newClauses = clauses;

  for (const child of definition.clauses) {
    if (child.contingency?.superclauseId !== latentClauseId) continue;
    const childState = newClauses[child.id];
    if (childState?.present) {
      newClauses = { ...newClauses, [child.id]: { ...childState, present: false } };
      // Remove child's context scope
      const scopeIndex = contexts.findIndex((s) => s.clauseId === child.id);
      if (scopeIndex >= 0) {
        contexts.splice(scopeIndex, 1);
      }
      // Recurse into grandchildren
      newClauses = cascadeLatency(child.id, definition, newClauses, contexts);
    }
  }

  return newClauses;
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
