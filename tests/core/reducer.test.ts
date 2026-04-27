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
  domains: {
    month: enumDomain({
      color: 'month',
      keywords: monthKeywords,
      placeholder: 'a month',
    }),
  },
});

function createStore() {
  const definition = sentence(palette)
    .clause('when', clause().required().lead('Wake me up when').chip('month', 'month'))
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

describe('sentenceReducer — stub actions', () => {
  it('TOGGLE_CLAUSE returns store unchanged', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'when',
    });

    expect(next).toBe(store);
  });

  it('SET_CONTEXT returns store unchanged', () => {
    const store = createStore();
    const next = sentenceReducer(store, {
      type: 'SET_CONTEXT',
      clauseId: 'when',
      values: {},
    });

    expect(next).toBe(store);
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
