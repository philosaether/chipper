/**
 * State initialization — creates a SentenceStore from a SentenceDefinition.
 *
 * Resolves each chip's domain from the palette, creates initial ChipState
 * with defaultValue, and derives clause/sentence validity.
 */

import type { Domain, Palette, SentenceDefinition } from './types';
import type { ChipState, ClauseState, SentenceState } from './state';
import type { ResolvedDomains, SentenceStore } from './store';

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

/** Compute displayValue from a domain and value. */
function computeDisplayValue(domain: Domain, value: unknown, isValid: boolean): string {
  if (isValid) {
    return domain.display(value);
  }
  return domain.placeholder ?? domain.display(value);
}

/**
 * Create a SentenceStore from a sentence definition.
 *
 * Resolves domains from the palette, initializes chip state with
 * default values, and derives clause/sentence validity.
 */
export function initializeSentenceState(definition: SentenceDefinition): SentenceStore {
  const domains: ResolvedDomains = {};
  const clauses: Record<string, ClauseState> = {};

  for (const clauseDef of definition.clauses) {
    const chips: Record<string, ChipState> = {};

    for (const chipDef of clauseDef.chips) {
      const domain = resolveDomain(chipDef.domainName, definition.palette);
      domains[chipDef.id] = domain;

      const isValid = domain.validate(domain.defaultValue);
      chips[chipDef.id] = {
        value: domain.defaultValue,
        displayValue: computeDisplayValue(domain, domain.defaultValue, isValid),
        valid: isValid,
        dirty: false,
      };
    }

    clauses[clauseDef.id] = {
      active: clauseDef.necessity === 'required',
      chips,
      valid: Object.values(chips).every((c) => c.valid),
    };
  }

  const state: SentenceState = {
    clauses,
    contexts: [],
    valid: Object.values(clauses).every((c) => !c.active || c.valid),
  };

  return { state, domains };
}

export { computeDisplayValue };
