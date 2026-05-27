/**
 * useReferenceDisplay — eager display resolution for reference domain chips.
 *
 * On mount, if the chip holds a non-keyword reference ID, calls
 * source.resolveDisplay() to populate the domain's displayCache.
 * Then re-dispatches SET_CHIP_VALUE with the same value to trigger
 * a re-render with the resolved display text.
 *
 * Internal hook — not exported from chipper/headless.
 */

import { useEffect } from 'react';
import type { Domain } from '../core/types';
import type { ReferenceSource } from '../domains/reference';

/**
 * Resolve display text for a reference chip's current value on mount.
 * No-ops for non-reference domains, empty values, or keyword values.
 */
export function useReferenceDisplay(
  domain: Domain,
  value: unknown,
  clauseId: string,
  chipId: string,
  dispatch: React.Dispatch<{ type: 'SET_CHIP_VALUE'; clauseId: string; chipId: string; value: unknown }>,
): void {
  useEffect(() => {
    if (domain.type !== 'reference') return;
    if (typeof value !== 'string' || value === '') return;

    // Skip if it's a keyword value (already has a static label)
    if (domain.keywords.some((k) => k.value === value)) return;

    const displayCache = domain.meta?.displayCache as Map<string, string> | undefined;
    if (!displayCache) return;

    // Skip if already cached
    if (displayCache.has(value)) return;

    const source = domain.meta?.source as ReferenceSource | undefined;
    if (!source?.resolveDisplay) return;

    let cancelled = false;
    const result = source.resolveDisplay(value);

    if (result instanceof Promise) {
      result.then((label) => {
        if (cancelled) return;
        displayCache.set(value, label);
        // Re-dispatch same value to trigger display recomputation
        dispatch({ type: 'SET_CHIP_VALUE', clauseId, chipId, value });
      });
    } else {
      displayCache.set(value, result);
      dispatch({ type: 'SET_CHIP_VALUE', clauseId, chipId, value });
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, value]);
}
