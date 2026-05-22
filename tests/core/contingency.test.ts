/**
 * Tests for the contingency engine — context propagation, clause presence,
 * domain reconfiguration, and cascade through the contingency tree.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { keywordDomain } from '../../src/domains/facades';
import { keywordOrExpressionDomain } from '../../src/domains/keyword-or-expression';

// --- Palette: cadence-like pattern with two levels of contingency ---

const palette = extendPalette({
  chips: {
    cadence: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { label: 'daily', value: 'daily' },
        { label: 'weekday', value: 'weekday' },
      ],
      expression: {
        inputType: 'number',
        min: 1,
        max: 52,
        placeholder: 'interval count',
        validate: (v) => /^\d+$/.test(v) && Number(v) >= 1,
      },
      default: '',
      placeholder: 'how often',
    }),
    period: keywordDomain({
      color: 'copper',
      keywords: [
        { label: 'weeks', value: 'weeks' },
        { label: 'months', value: 'months' },
        { label: 'quarters', value: 'quarters' },
      ],
      placeholder: 'period',
    }),
    daySet: keywordDomain({
      color: 'sage',
      keywords: [
        { label: 'Mon', value: 'monday' },
        { label: 'Tue', value: 'tuesday' },
      ],
      placeholder: 'which day',
    }),
    month: keywordDomain({
      color: 'copper',
      keywords: [
        { label: 'January', value: 'january' },
        { label: 'February', value: 'february' },
      ],
      placeholder: 'which month',
    }),
  },
});

const collapseKeywords = ['daily', 'weekday'];

function createCadenceSentence() {
  return sentence(palette)
    .clause('trigger', builder()
      .required()
      .text('Every')
      .chip('cadence', 'cadence')
      .produces({ cadence: 'cadence' })
    )
    .clause('detail', builder()
      .required()
      .contingentOn('trigger', {
        present: (ctx) => !collapseKeywords.includes(ctx.cadence as string),
      })
      .chip('period', 'period')
      .text('on')
      .chip('daySet', 'daySet')
      .produces({ period: 'period' })
    )
    .clause('month-clause', builder()
      .required()
      .contingentOn('detail', {
        present: (ctx) => ctx.period === 'quarters',
      })
      .text('of')
      .chip('month', 'month')
    )
    .build();
}

describe('contingency engine — clause presence', () => {
  it('contingent clauses start latent when default value is a collapse keyword', () => {
    // Build a sentence where the parent chip defaults to a collapse keyword
    const collapsedPalette = extendPalette({
      chips: {
        ...palette.domains,
        cadence: keywordOrExpressionDomain({
          color: 'copper',
          keywords: [
            { label: 'daily', value: 'daily' },
            { label: 'weekday', value: 'weekday' },
          ],
          expression: { inputType: 'number', min: 1, max: 52, placeholder: 'count' },
          defaultValue: 'daily',
        }),
      },
    });

    const def = sentence(collapsedPalette)
      .clause('trigger', builder()
        .required()
        .text('Every')
        .chip('cadence', 'cadence')
        .produces({ cadence: 'cadence' })
      )
      .clause('detail', builder()
        .required()
        .contingentOn('trigger', {
          present: (ctx) => !collapseKeywords.includes(ctx.cadence as string),
        })
        .chip('period', 'period')
      )
      .build();

    const store = initializeSentenceState(def);

    expect(store.state.clauses['trigger']!.present).toBe(true);
    expect(store.state.clauses['detail']!.present).toBe(false);
  });

  it('contingent clauses start present when default value passes present()', () => {
    // Default cadence is '' (empty string), not in collapseKeywords → detail starts present
    const store = initializeSentenceState(createCadenceSentence());

    expect(store.state.clauses['trigger']!.present).toBe(true);
    expect(store.state.clauses['detail']!.present).toBe(true);
  });

  it('detail clause becomes present when cadence is not a collapse keyword', () => {
    const store = initializeSentenceState(createCadenceSentence());

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });

    expect(next.state.clauses['detail']!.present).toBe(true);
  });

  it('detail clause becomes latent when cadence is set to a collapse keyword', () => {
    const store = initializeSentenceState(createCadenceSentence());

    // Expand
    const expanded = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });
    expect(expanded.state.clauses['detail']!.present).toBe(true);

    // Collapse
    const collapsed = sentenceReducer(expanded, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: 'daily',
    });
    expect(collapsed.state.clauses['detail']!.present).toBe(false);
  });

  it('collapse keyword in cadence keeps sentence valid (latent clauses ignored)', () => {
    const store = initializeSentenceState(createCadenceSentence());

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: 'daily',
    });

    // "daily" is valid, detail clause is latent → sentence is valid
    expect(next.state.valid).toBe(true);
  });
});

describe('contingency engine — multi-level cascade', () => {
  it('month-clause becomes present when period is quarters', () => {
    const store = initializeSentenceState(createCadenceSentence());

    // Expand cadence
    const expanded = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });

    // Set period to quarters
    const withQuarters = sentenceReducer(expanded, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'detail',
      chipId: 'period',
      value: 'quarters',
    });

    expect(withQuarters.state.clauses['month-clause']!.present).toBe(true);
  });

  it('month-clause stays latent when period is weeks', () => {
    const store = initializeSentenceState(createCadenceSentence());

    const expanded = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });

    const withWeeks = sentenceReducer(expanded, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'detail',
      chipId: 'period',
      value: 'weeks',
    });

    expect(withWeeks.state.clauses['month-clause']!.present).toBe(false);
  });

  it('collapsing cadence cascades latency to month-clause', () => {
    const store = initializeSentenceState(createCadenceSentence());

    // Expand, set period to quarters → month-clause present
    let current = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });
    current = sentenceReducer(current, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'detail',
      chipId: 'period',
      value: 'quarters',
    });
    expect(current.state.clauses['month-clause']!.present).toBe(true);

    // Collapse cadence → detail and month-clause both become latent
    const collapsed = sentenceReducer(current, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: 'daily',
    });

    expect(collapsed.state.clauses['detail']!.present).toBe(false);
    expect(collapsed.state.clauses['month-clause']!.present).toBe(false);
  });
});

describe('contingency engine — context scopes', () => {
  it('SET_CHIP_VALUE on producing clause creates context scope', () => {
    const store = initializeSentenceState(createCadenceSentence());

    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });

    const scope = next.state.contexts.find((s) => s.clauseId === 'trigger');
    expect(scope).toBeDefined();
    expect(scope!.values).toEqual({ cadence: '2' });
  });

  it('context scope updates on subsequent chip changes', () => {
    const store = initializeSentenceState(createCadenceSentence());

    const first = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });

    const second = sentenceReducer(first, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '4',
    });

    const scope = second.state.contexts.find((s) => s.clauseId === 'trigger');
    expect(scope!.values).toEqual({ cadence: '4' });
    // Should still be only one scope for this clause
    expect(second.state.contexts.filter((s) => s.clauseId === 'trigger')).toHaveLength(1);
  });

  it('latent clause context scope is removed', () => {
    const store = initializeSentenceState(createCadenceSentence());

    // Expand and set period
    let current = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: '2',
    });
    current = sentenceReducer(current, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'detail',
      chipId: 'period',
      value: 'quarters',
    });

    // detail clause should have a context scope
    expect(current.state.contexts.find((s) => s.clauseId === 'detail')).toBeDefined();

    // Collapse → detail becomes latent → its scope should be removed
    const collapsed = sentenceReducer(current, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'trigger',
      chipId: 'cadence',
      value: 'daily',
    });

    expect(collapsed.state.contexts.find((s) => s.clauseId === 'detail')).toBeUndefined();
  });
});

describe('contingency engine — domain reconfiguration', () => {
  it('configure() applies chip overrides when clause becomes present', () => {
    const reconfigPalette = extendPalette({
      chips: {
        mode: keywordDomain({
          color: 'copper',
          keywords: [
            { label: 'simple', value: 'simple' },
            { label: 'advanced', value: 'advanced' },
          ],
        }),
        target: keywordDomain({
          color: 'sage',
          keywords: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
          placeholder: 'choose',
        }),
      },
    });

    const def = sentence(reconfigPalette)
      .clause('parent', builder()
        .required()
        .chip('mode', 'mode')
        .produces({ mode: 'mode' })
      )
      .clause('child', builder()
        .required()
        .contingentOn('parent', {
          present: (ctx) => ctx.mode === 'advanced',
          configure: () => ({
            chipOverrides: {
              target: { placeholder: 'advanced target' },
            },
          }),
        })
        .chip('target', 'target')
      )
      .build();

    const store = initializeSentenceState(def);

    // Set mode to advanced → child present, target chip reconfigured
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'parent',
      chipId: 'mode',
      value: 'advanced',
    });

    expect(next.state.clauses['child']!.present).toBe(true);
    expect(next.domains['target']!.placeholder).toBe('advanced target');
  });
});
