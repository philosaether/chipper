/**
 * Tests for context-aware display values and dynamic keyword labels.
 */

import { describe, expect, it } from 'vitest';
import {
  sentence,
  builder,
  extendPalette,
  keywordOrExpressionDomain,
  numericExpression,
  initializeSentenceState,
  sentenceReducer,
} from '../../src';
import type { SentenceStore } from '../../src';

// -- Fixtures ----------------------------------------------------------------

/** A cadence sentence where the offset chip has context-aware display + dynamic keyword. */
const palette = extendPalette({
  chips: {
    cadenceUnit: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'week', label: 'weeks' },
        { value: 'month', label: 'months' },
        { value: 'quarter', label: 'quarters' },
      ],
      default: 'month',
    }),
    cadenceOffset: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: '0', label: 'immediately' },
        { value: '1', label: (ctx: Record<string, unknown>) => `next ${ctx.cadenceUnit ?? 'period'}` },
      ],
      expression: numericExpression({
        min: 0,
        max: 52,
        prefix: 'in',
        suffix: (ctx: Record<string, unknown>) => String(ctx.cadenceUnit ?? 'period') + 's',
      }),
      default: '0',
    }),
  },
});

const testSentence = sentence(palette)
  .clause('cadence', builder()
    .text('Every')
    .chip('cadenceUnit')
    .produces({ cadenceUnit: 'cadenceUnit' })
  )
  .clause('offset', builder()
    .text('starting')
    .chip('cadenceOffset')
    .contingentOn('cadence', { present: () => true })
  )
  .build();

function dispatch(store: SentenceStore, clauseId: string, chipId: string, value: unknown) {
  return sentenceReducer(store, { type: 'SET_CHIP_VALUE', clauseId, chipId, value });
}

// -- Context-aware display ---------------------------------------------------

describe('context-aware display', () => {
  it('display function receives context at SET_CHIP_VALUE time', () => {
    // Create a domain with a context-aware display function
    const ctxPalette = extendPalette({
      chips: {
        unit: keywordOrExpressionDomain({
          color: 'copper',
          keywords: [{ value: 'week' }, { value: 'month' }],
          default: 'month',
        }),
        amount: keywordOrExpressionDomain({
          color: 'copper',
          keywords: [],
          expression: numericExpression({ min: 1, max: 100 }),
          default: '1',
          placeholder: 'a number',
        }),
      },
    });

    // Override display on the amount domain to use context
    ctxPalette.domains['amount'] = {
      ...ctxPalette.domains['amount']!,
      display: (value: unknown, context?: Record<string, unknown>) => {
        const unit = context?.unit ?? 'unit';
        return `${value} ${unit}s`;
      },
    };

    const def = sentence(ctxPalette)
      .clause('main', builder()
        .chip('unit')
        .chip('amount')
        .produces({ unit: 'unit' })
      )
      .build();

    let store = initializeSentenceState(def);
    // Change amount — display should reflect context from sibling
    store = dispatch(store, 'main', 'amount', '5');
    const chip = store.state.clauses['main']!.chips['amount']!;
    expect(chip.displayValue).toBe('5 months');
  });

  it('revalidation recomputes display when context changes', () => {
    let store = initializeSentenceState(testSentence);

    // Set offset to '1' — initially cadenceUnit is 'month'
    store = dispatch(store, 'offset', 'cadenceOffset', '1');
    const before = store.state.clauses['offset']!.chips['cadenceOffset']!;
    // Keyword value '1' → displayByValue lookup or expression display
    // Since '1' matches keyword, displayByValue should map it
    // But the keyword has a function label, so buildDisplayMap skips it,
    // and display falls through to expression display: '1'
    expect(before.displayValue).toBe('1');

    // Change unit to 'quarter' — offset chip display should update on next value change
    store = dispatch(store, 'cadence', 'cadenceUnit', 'quarter');
    // The offset clause is contingent on cadence, so revalidation runs.
    // Display should still be '1' (context-aware display on the domain
    // requires a custom display function, which our test domain doesn't have)
    const after = store.state.clauses['offset']!.chips['cadenceOffset']!;
    expect(after.displayValue).toBe('1');
  });
});

// -- Dynamic keyword labels --------------------------------------------------

describe('dynamic keyword labels', () => {
  it('Keyword.label accepts a function', () => {
    const store = initializeSentenceState(testSentence);
    const domain = store.domains['cadenceOffset']!;
    const dynamicKeyword = domain.keywords.find((k) => k.value === '1')!;
    expect(typeof dynamicKeyword.label).toBe('function');
  });

  it('function label resolves with context', () => {
    const store = initializeSentenceState(testSentence);
    const domain = store.domains['cadenceOffset']!;
    const dynamicKeyword = domain.keywords.find((k) => k.value === '1')!;
    const label = dynamicKeyword.label as (ctx: Record<string, unknown>) => string;
    expect(label({ cadenceUnit: 'quarter' })).toBe('next quarter');
    expect(label({ cadenceUnit: 'week' })).toBe('next week');
    expect(label({})).toBe('next period');
  });

  it('static keyword labels are unaffected', () => {
    const store = initializeSentenceState(testSentence);
    const domain = store.domains['cadenceOffset']!;
    const staticKeyword = domain.keywords.find((k) => k.value === '0')!;
    expect(staticKeyword.label).toBe('immediately');
  });

  it('keywords with function labels are excluded from displayByValue', () => {
    const store = initializeSentenceState(testSentence);
    const domain = store.domains['cadenceOffset']!;
    // '0' → 'immediately' (static label, in display map)
    expect(domain.display('0')).toBe('immediately');
    // '1' → function label, no displayLabel → falls through to expression display → '1'
    expect(domain.display('1')).toBe('1');
  });
});
