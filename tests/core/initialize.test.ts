/**
 * Tests for state initialization.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentence, clause } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { enumDomain } from '../../src/domains/enum';

const monthKeywords = [
  { label: 'January', value: 'january' },
  { label: 'February', value: 'february' },
  { label: 'September', value: 'september' },
  { label: 'December', value: 'december' },
];

const palette = extendPalette({
  domains: {
    month: enumDomain({
      color: 'month',
      keywords: monthKeywords,
      placeholder: 'a month',
    }),
    monthWithDefault: enumDomain({
      color: 'month',
      keywords: monthKeywords,
      defaultValue: 'september',
    }),
  },
});

describe('initializeSentenceState', () => {
  it('creates initial state from a sentence definition', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().lead('Wake me up when').chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    expect(store.state.clauses['when']).toBeDefined();
    expect(store.state.clauses['when'].chips['month']).toBeDefined();
  });

  it('resolves domains and stores them by chip ID', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    expect(store.domains['month']).toBeDefined();
    expect(store.domains['month'].type).toBe('enum');
  });

  it('initializes chip with domain defaultValue', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);
    const chipState = store.state.clauses['when'].chips['month'];

    expect(chipState.value).toBe('');
    expect(chipState.dirty).toBe(false);
  });

  it('uses placeholder for display when default is invalid', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);
    const chipState = store.state.clauses['when'].chips['month'];

    expect(chipState.valid).toBe(false);
    expect(chipState.displayValue).toBe('a month');
  });

  it('uses display for a valid default', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'monthWithDefault'))
      .build();

    const store = initializeSentenceState(definition);
    const chipState = store.state.clauses['when'].chips['month'];

    expect(chipState.valid).toBe(true);
    expect(chipState.displayValue).toBe('September');
  });

  it('required clauses start active', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    expect(store.state.clauses['when'].active).toBe(true);
  });

  it('optional clauses start dormant', () => {
    const definition = sentence(palette)
      .clause('when', clause().optional().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    expect(store.state.clauses['when'].active).toBe(false);
  });

  it('derives clause validity from chip validity', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    // month has invalid default → clause invalid
    expect(store.state.clauses['when'].valid).toBe(false);
  });

  it('derives sentence validity from active clause validity', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    // active clause with invalid chip → sentence invalid
    expect(store.state.valid).toBe(false);
  });

  it('dormant clauses do not affect sentence validity', () => {
    const definition = sentence(palette)
      .clause('when', clause().optional().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    // optional clause is dormant → sentence valid despite invalid chip
    expect(store.state.valid).toBe(true);
  });

  it('throws on missing domain', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'nonexistent'))
      .build();

    expect(() => initializeSentenceState(definition)).toThrow(
      'Domain "nonexistent" not found in palette',
    );
  });

  it('starts with empty contexts', () => {
    const definition = sentence(palette)
      .clause('when', clause().required().chip('month', 'month'))
      .build();

    const store = initializeSentenceState(definition);

    expect(store.state.contexts).toEqual([]);
  });
});
