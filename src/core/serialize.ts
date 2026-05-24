/**
 * Serialization / deserialization — save and restore sentence state.
 *
 * serialize() extracts chip values from active clauses into a portable object.
 * deserialize() overlays saved values onto a fresh initialization pass.
 *
 * See designs/serialization.md for the full design.
 */

import type { SentenceDefinition } from './types';
import type { SentenceState } from './state';
import type { SentenceStore } from './store';
import { initializeSentenceState } from './initialize';

/**
 * Serialized sentence format.
 *
 * Keys are chip IDs with their raw values. Two reserved meta-keys:
 * - `__active`: Record<string, boolean> — which optional clauses are active
 * - `__expressionMode`: Record<string, boolean> — which chips are in expression mode
 */
export type SerializedSentence = Record<string, unknown>;

/**
 * Serialize a sentence state into a portable object.
 *
 * If the definition has a custom serializer, delegates to it.
 * Otherwise, collects chip values from all present+active clauses.
 */
export function serialize(
  definition: SentenceDefinition,
  state: SentenceState,
): SerializedSentence {
  if (definition.serializer) {
    return definition.serializer(state);
  }

  const result: SerializedSentence = {};
  const activeFlags: Record<string, boolean> = {};
  const expressionModeFlags: Record<string, boolean> = {};

  for (const clauseDef of definition.clauses) {
    const clauseState = state.clauses[clauseDef.id];
    if (!clauseState) continue;

    // Only serialize present + active clauses
    if (!clauseState.present || !clauseState.active) continue;

    // Track optional clause activation
    if (clauseDef.necessity === 'optional') {
      activeFlags[clauseDef.id] = true;
    }

    // Serialize chip values
    for (const chipDef of clauseDef.chips) {
      const chipState = clauseState.chips[chipDef.id];
      if (chipState) {
        result[chipDef.id] = chipState.value;
        if (chipState.expressionMode) {
          expressionModeFlags[chipDef.id] = true;
        }
      }
    }
  }

  if (Object.keys(activeFlags).length > 0) {
    result.__active = activeFlags;
  }
  if (Object.keys(expressionModeFlags).length > 0) {
    result.__expressionMode = expressionModeFlags;
  }

  return result;
}

/**
 * Deserialize saved data into a fully initialized SentenceStore.
 *
 * If the definition has a custom deserializer, calls it first to
 * transform the data back into the default { chipId: value } format.
 */
export function deserialize(
  definition: SentenceDefinition,
  data: SerializedSentence,
): SentenceStore {
  const normalizedData = definition.deserializer
    ? definition.deserializer(data)
    : data;

  return initializeSentenceState(definition, normalizedData);
}
