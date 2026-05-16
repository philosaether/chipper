/**
 * Tests for chip-level contingency — segment visibility within a clause.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { enumDomain } from '../../src/domains/enum';
import { keywordOrExpressionDomain } from '../../src/domains/keyword-or-expression';
import { multiSelectDomain } from '../../src/domains/multi-select';

// --- Palette: cadence pattern with chip-level contingency ---

const palette = extendPalette({
  chips: {
    cadenceType: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'daily' },
        { value: 'weekly' },
        { value: 'custom' },
      ],
      default: 'weekly',
    }),
    cadencePeriod: enumDomain({
      color: 'copper',
      keywords: [
        { value: 'weeks' },
        { value: 'months' },
      ],
    }),
    dayOfWeek: multiSelectDomain({
      color: 'sage',
      options: [
        { value: 'mon' },
        { value: 'tue' },
        { value: 'wed' },
      ],
      placeholder: 'which days',
    }),
  },
});

function createCadenceSentence() {
  return sentence(palette)
    .clause('cadence', builder()
      .text('Every')
      .chip('cadenceType')
      .chip('cadencePeriod', { present: (ctx) => ctx.cadenceType === 'custom' })
      .produces({ cadenceType: 'cadenceType', cadencePeriod: 'cadencePeriod' })
    )
    .clause('dayOfWeek', builder()
      .text('on')
      .chip('dayOfWeek')
      .contingentOn('cadence', {
        present: (ctx) => {
          if (ctx.cadenceType === 'weekly') return true;
          if (ctx.cadenceType === 'custom')
            return ['weeks', 'months'].includes(ctx.cadencePeriod as string);
          return false;
        },
      })
    )
    .build();
}

describe('chip-level contingency — segment visibility', () => {
  it('hides chip when present predicate returns false', () => {
    const def = createCadenceSentence();
    const store = initializeSentenceState(def);

    // cadenceType defaults to 'weekly' → cadencePeriod should be hidden
    const cadenceClause = store.state.clauses['cadence']!;
    expect(cadenceClause.visibleChips).toBeDefined();
    expect(cadenceClause.visibleChips!.includes('cadenceType')).toBe(true);
    expect(cadenceClause.visibleChips!.includes('cadencePeriod')).toBe(false);
  });

  it('shows chip when present predicate returns true', () => {
    const def = createCadenceSentence();
    let store = initializeSentenceState(def);

    // Set cadenceType to 'custom' → cadencePeriod should become visible
    store = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'cadence',
      chipId: 'cadenceType',
      value: 'custom',
    });

    const cadenceClause = store.state.clauses['cadence']!;
    expect(cadenceClause.visibleChips!.includes('cadenceType')).toBe(true);
    expect(cadenceClause.visibleChips!.includes('cadencePeriod')).toBe(true);
  });

  it('hidden chip does not produce context', () => {
    const def = createCadenceSentence();
    const store = initializeSentenceState(def);

    // cadenceType = 'weekly', cadencePeriod hidden → context should not include cadencePeriod
    const cadenceScope = store.state.contexts.find((s) => s.clauseId === 'cadence');
    expect(cadenceScope).toBeDefined();
    expect(cadenceScope!.values.cadenceType).toBe('weekly');
    expect('cadencePeriod' in cadenceScope!.values).toBe(false);
  });

  it('visible chip produces context', () => {
    const def = createCadenceSentence();
    let store = initializeSentenceState(def);

    store = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'cadence',
      chipId: 'cadenceType',
      value: 'custom',
    });

    const cadenceScope = store.state.contexts.find((s) => s.clauseId === 'cadence');
    expect(cadenceScope!.values.cadenceType).toBe('custom');
    expect(cadenceScope!.values.cadencePeriod).toBe('weeks'); // first keyword default
  });

  it('hidden chip does not affect clause validity', () => {
    const def = createCadenceSentence();
    const store = initializeSentenceState(def);

    // cadencePeriod is hidden and has a valid default (first keyword).
    // Even if it were invalid, hidden chips shouldn't affect validity.
    const cadenceClause = store.state.clauses['cadence']!;
    expect(cadenceClause.valid).toBe(true);
  });

  it('downstream clause sees context from visible chips only', () => {
    const def = createCadenceSentence();
    const store = initializeSentenceState(def);

    // cadenceType = 'weekly' → dayOfWeek should be present (weekly triggers it)
    expect(store.state.clauses['dayOfWeek']!.present).toBe(true);
  });

  it('downstream clause responds to chip becoming visible and producing context', () => {
    const def = createCadenceSentence();
    let store = initializeSentenceState(def);

    // Switch to 'daily' → dayOfWeek should hide
    store = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'cadence',
      chipId: 'cadenceType',
      value: 'daily',
    });
    expect(store.state.clauses['dayOfWeek']!.present).toBe(false);

    // Switch to 'custom' → cadencePeriod becomes visible, defaults to 'weeks' → dayOfWeek shows
    store = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'cadence',
      chipId: 'cadenceType',
      value: 'custom',
    });
    expect(store.state.clauses['cadence']!.visibleChips!.includes('cadencePeriod')).toBe(true);
    expect(store.state.clauses['dayOfWeek']!.present).toBe(true);
  });

  it('clauses without segment predicates have undefined visibleChips', () => {
    const def = createCadenceSentence();
    const store = initializeSentenceState(def);

    // dayOfWeek clause has no chip-level predicates
    expect(store.state.clauses['dayOfWeek']!.visibleChips).toBeUndefined();
  });
});

describe('chip-level contingency — builder footgun detection', () => {
  it('.chip(id, options) treats object second arg as options', () => {
    const def = sentence(palette)
      .clause('test', builder()
        .chip('cadenceType', { present: () => true })
      )
      .build();

    // Should resolve domain from chip ID, not throw "[object Object]" error
    const store = initializeSentenceState(def);
    expect(store.domains['cadenceType']).toBeDefined();
  });
});
