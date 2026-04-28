/**
 * SET_LIVE_VALUE action — updates a live chip with fetched data or an error.
 *
 * Stub — handler not yet implemented.
 */

import type { SentenceStore } from '../store';

/** Update a live chip's value from an external source. */
export interface SetLiveValueAction {
  type: 'SET_LIVE_VALUE';
  chipId: string;
  value: unknown;
  error?: string;
}

/** Handle SET_LIVE_VALUE. Stub — returns store unchanged. */
export function handleSetLiveValue(
  store: SentenceStore,
  _action: SetLiveValueAction,
): SentenceStore {
  return store;
}
