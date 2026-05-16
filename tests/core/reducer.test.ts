/**
 * Tests for the sentence reducer — SET_CHIP_VALUE action.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, clause } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { enumDomain } from '../../src/domains/enum';
import { monthKeywords } from '../fixtures/month-keywords';

const palette = extendPalette({
  chips: {
    month: enumDomain({
      color: 'month',
      keywords: monthKeywords,
      default: '',
      placeholder: 'a month',
    }),
  },
});

function createStore() {
  const definition = sentence(palette)
    .clause('when', clause().required().text('Wake me up when').chip('month', 'month'))
    .build();
  return initializeSentenceState(definition);
}

describe('sentenceReducer — SET_CHIP_VALUE', () => {
  it('updates chip value', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.state.clauses['when'].chips['month'].value).toBe('september');
  });

  it('computes displayValue from domain', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.state.clauses['when'].chips['month'].displayValue).toBe('September');
  });

  it('validates the new value', () => {
    const store = createStore();
    const valid = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });
    const invalid = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'smarch',
    });

    expect(valid.state.clauses['when'].chips['month'].valid).toBe(true);
    expect(invalid.state.clauses['when'].chips['month'].valid).toBe(false);
  });

  it('uses placeholder for display when value is invalid', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'smarch',
    });

    expect(next.state.clauses['when'].chips['month'].displayValue).toBe('a month');
  });

  it('marks chip as dirty after value change', () => {
    const store = createStore();
    expect(store.state.clauses['when'].chips['month'].dirty).toBe(false);

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.state.clauses['when'].chips['month'].dirty).toBe(true);
  });

  it('recomputes clause validity', () => {
    const store = createStore();
    expect(store.state.clauses['when'].valid).toBe(false);

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.state.clauses['when'].valid).toBe(true);
  });

  it('recomputes sentence validity', () => {
    const store = createStore();
    expect(store.state.valid).toBe(false);

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.state.valid).toBe(true);
  });

  it('does not mutate the original store', () => {
    const store = createStore();
    const originalValue = store.state.clauses['when'].chips['month'].value;

    sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(store.state.clauses['when'].chips['month'].value).toBe(originalValue);
  });

  it('preserves domains on the store', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'month',
      value: 'september',
    });

    expect(next.domains).toBe(store.domains);
  });
});

describe('sentenceReducer — TOGGLE_CLAUSE', () => {
  it('toggles a required clause active to inactive', () => {
    const store = createStore();
    expect(store.state.clauses['when']!.active).toBe(true);

    const next = sentenceReducer(store, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'when',
    });

    expect(next.state.clauses['when']!.active).toBe(false);
  });

  it('toggles back to active on second dispatch', () => {
    const store = createStore();
    const toggled = sentenceReducer(store, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'when',
    });
    const restored = sentenceReducer(toggled, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'when',
    });

    expect(restored.state.clauses['when']!.active).toBe(true);
  });

  it('recomputes sentence validity after toggle', () => {
    const store = createStore();
    // Clause has invalid chip (default empty string) → sentence invalid
    expect(store.state.valid).toBe(false);

    // Deactivate the clause → sentence becomes valid (inactive clause doesn't count)
    const next = sentenceReducer(store, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'when',
    });

    expect(next.state.valid).toBe(true);
  });
});

describe('sentenceReducer — SET_CONTEXT', () => {
  it('adds a context scope for the clause', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CONTEXT',
      clauseId: 'when',
      values: { month: 'september' },
    });

    expect(next.state.contexts).toHaveLength(1);
    expect(next.state.contexts[0]!.clauseId).toBe('when');
    expect(next.state.contexts[0]!.values).toEqual({ month: 'september' });
  });

  it('updates existing context scope on repeated dispatch', () => {
    const store = createStore();
    const first = sentenceReducer(store, {
      type: 'SET_CONTEXT',
      clauseId: 'when',
      values: { month: 'september' },
    });
    const second = sentenceReducer(first, {
      type: 'SET_CONTEXT',
      clauseId: 'when',
      values: { month: 'october' },
    });

    expect(second.state.contexts).toHaveLength(1);
    expect(second.state.contexts[0]!.values).toEqual({ month: 'october' });
  });

  it('SET_LIVE_VALUE returns store unchanged', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_LIVE_VALUE',
      chipId: 'month',
      value: 'test',
    });

    expect(next).toBe(store);
  });
});
