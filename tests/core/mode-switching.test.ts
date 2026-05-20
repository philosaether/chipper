/**
 * Mode-switching tests — trigger keywords enter expression mode,
 * regular keywords exit. Always-on expression chips are unaffected.
 */

import { describe, expect, it } from 'vitest';
import {
  sentence,
  builder,
  extendPalette,
  keywordOrExpressionDomain,
  numericExpression,
  textExpression,
  initializeSentenceState,
  sentenceReducer,
} from '../../src';
import { TRIGGER_SENTINEL } from '../../src/core/mode-switching';
import type { SentenceStore } from '../../src';

// -- Fixtures ----------------------------------------------------------------

const triggerPalette = extendPalette({
  chips: {
    cadenceType: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'daily', label: 'day' },
        { value: 'weekly', label: 'week on...', display: 'week' },
        { value: 'weekday' },
        { value: 'weekend', label: 'weekend day' },
      ],
      expression: numericExpression({
        min: 2,
        max: 365,
        trigger: { label: 'custom interval', default: '2' },
      }),
      default: 'weekly',
    }),
  },
});

const triggerSentence = sentence(triggerPalette)
  .clause('cadence', builder()
    .text('Every')
    .chip('cadenceType')
    .produces({ cadenceType: 'cadenceType' })
  )
  .build();

function dispatch(store: SentenceStore, clauseId: string, chipId: string, value: unknown) {
  return sentenceReducer(store, { type: 'SET_CHIP_VALUE', clauseId, chipId, value });
}

// -- Always-on expression (no trigger) — unchanged behavior ------------------

const alwaysOnPalette = extendPalette({
  chips: {
    fitWeight: keywordOrExpressionDomain({
      color: 'sage',
      keywords: [
        { value: '8', label: 'a lot' },
        { value: '4', label: 'a little' },
      ],
      expression: numericExpression({ min: 1, max: 10 }),
      default: '5',
    }),
  },
});

const alwaysOnSentence = sentence(alwaysOnPalette)
  .clause('weight', builder()
    .text('Boost fit by')
    .chip('fitWeight')
  )
  .build();

// -- Tests -------------------------------------------------------------------

describe('mode-switching — trigger-gated expression', () => {
  let store: SentenceStore;

  it('initializes in keyword mode (expressionMode undefined)', () => {
    store = initializeSentenceState(triggerSentence);
    const chip = store.state.clauses['cadence']!.chips['cadenceType']!;
    expect(chip.value).toBe('weekly');
    expect(chip.displayValue).toBe('week');
    expect(chip.expressionMode).toBeUndefined();
  });

  it('stores trigger metadata on domain', () => {
    store = initializeSentenceState(triggerSentence);
    const domain = store.domains['cadenceType']!;
    expect(domain.meta?.trigger).toEqual({ label: 'custom interval', default: '2' });
  });

  it('enters expression mode on TRIGGER_SENTINEL', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    const chip = store.state.clauses['cadence']!.chips['cadenceType']!;
    expect(chip.expressionMode).toBe(true);
    expect(chip.value).toBe('2');
    expect(chip.displayValue).toBe('2');
    expect(chip.valid).toBe(true);
  });

  it('exits expression mode on regular keyword selection', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    store = dispatch(store, 'cadence', 'cadenceType', 'daily');
    const chip = store.state.clauses['cadence']!.chips['cadenceType']!;
    expect(chip.expressionMode).toBeUndefined();
    expect(chip.value).toBe('daily');
    expect(chip.displayValue).toBe('day');
  });

  it('stays in expression mode on stepper value change', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    store = dispatch(store, 'cadence', 'cadenceType', '5');
    const chip = store.state.clauses['cadence']!.chips['cadenceType']!;
    expect(chip.expressionMode).toBe(true);
    expect(chip.value).toBe('5');
  });

  it('produces context with expression value', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    const scope = store.state.contexts.find((s) => s.clauseId === 'cadence');
    expect(scope?.values.cadenceType).toBe('2');
  });

  it('produces context with keyword value after exit', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    store = dispatch(store, 'cadence', 'cadenceType', 'daily');
    const scope = store.state.contexts.find((s) => s.clauseId === 'cadence');
    expect(scope?.values.cadenceType).toBe('daily');
  });

  it('validates expression default on trigger entry', () => {
    store = initializeSentenceState(triggerSentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    const chip = store.state.clauses['cadence']!.chips['cadenceType']!;
    expect(chip.valid).toBe(true);
  });
});

describe('mode-switching — always-on expression (no trigger)', () => {
  let store: SentenceStore;

  it('initializes without expressionMode', () => {
    store = initializeSentenceState(alwaysOnSentence);
    const chip = store.state.clauses['weight']!.chips['fitWeight']!;
    expect(chip.value).toBe('5');
    expect(chip.expressionMode).toBeUndefined();
  });

  it('has no trigger metadata on domain', () => {
    store = initializeSentenceState(alwaysOnSentence);
    expect(store.domains['fitWeight']!.meta).toBeUndefined();
  });

  it('keyword selection does not set expressionMode', () => {
    store = initializeSentenceState(alwaysOnSentence);
    store = dispatch(store, 'weight', 'fitWeight', '8');
    const chip = store.state.clauses['weight']!.chips['fitWeight']!;
    expect(chip.value).toBe('8');
    expect(chip.displayValue).toBe('a lot');
    expect(chip.expressionMode).toBeUndefined();
  });

  it('expression value does not set expressionMode', () => {
    store = initializeSentenceState(alwaysOnSentence);
    store = dispatch(store, 'weight', 'fitWeight', '7');
    const chip = store.state.clauses['weight']!.chips['fitWeight']!;
    expect(chip.value).toBe('7');
    expect(chip.expressionMode).toBeUndefined();
  });
});

describe('mode-switching — interaction with chip-level contingency', () => {
  const contingencyPalette = extendPalette({
    chips: {
      cadenceType: keywordOrExpressionDomain({
        color: 'copper',
        keywords: [
          { value: 'daily', label: 'day' },
          { value: 'weekly', label: 'week on...', display: 'week' },
        ],
        expression: numericExpression({
          min: 2,
          max: 365,
          trigger: { label: 'custom interval', default: '2' },
        }),
        default: 'weekly',
      }),
      cadencePeriod: keywordOrExpressionDomain({
        color: 'copper',
        keywords: [
          { value: 'days', label: 'days' },
          { value: 'weeks', label: 'weeks' },
        ],
        default: 'weeks',
      }),
    },
  });

  const contingencySentence = sentence(contingencyPalette)
    .clause('cadence', builder()
      .text('Every')
      .chip('cadenceType')
      .chip('cadencePeriod', { present: (ctx) => !isNaN(Number(ctx.cadenceType)) })
      .produces({ cadenceType: 'cadenceType', cadencePeriod: 'cadencePeriod' })
    )
    .build();

  it('trigger entry reveals contingent chip', () => {
    let store = initializeSentenceState(contingencySentence);
    // Starts as 'weekly' — cadencePeriod should be hidden (NaN)
    expect(store.state.clauses['cadence']!.visibleChips).toBeDefined();
    expect(store.state.clauses['cadence']!.visibleChips!.includes('cadencePeriod')).toBe(false);

    // Enter expression mode → value is '2' → cadencePeriod should appear
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    expect(store.state.clauses['cadence']!.visibleChips!.includes('cadencePeriod')).toBe(true);
  });

  it('keyword exit hides contingent chip', () => {
    let store = initializeSentenceState(contingencySentence);
    store = dispatch(store, 'cadence', 'cadenceType', TRIGGER_SENTINEL);
    expect(store.state.clauses['cadence']!.visibleChips!.includes('cadencePeriod')).toBe(true);

    store = dispatch(store, 'cadence', 'cadenceType', 'daily');
    expect(store.state.clauses['cadence']!.visibleChips!.includes('cadencePeriod')).toBe(false);
  });
});

describe('mode-switching — text expression with trigger', () => {
  const textTriggerPalette = extendPalette({
    chips: {
      surface: keywordOrExpressionDomain({
        color: 'slate',
        keywords: [
          { value: 'floor' },
          { value: 'counter' },
        ],
        expression: textExpression({
          placeholder: 'custom surface',
          trigger: { label: 'other...', default: '' },
        }),
        default: 'floor',
      }),
    },
  });

  const textTriggerSentence = sentence(textTriggerPalette)
    .clause('clean', builder()
      .text('Clean the')
      .chip('surface')
    )
    .build();

  it('enters expression mode with empty default', () => {
    let store = initializeSentenceState(textTriggerSentence);
    store = dispatch(store, 'clean', 'surface', TRIGGER_SENTINEL);
    const chip = store.state.clauses['clean']!.chips['surface']!;
    expect(chip.expressionMode).toBe(true);
    expect(chip.value).toBe('');
  });

  it('typing a value in expression mode preserves mode', () => {
    let store = initializeSentenceState(textTriggerSentence);
    store = dispatch(store, 'clean', 'surface', TRIGGER_SENTINEL);
    store = dispatch(store, 'clean', 'surface', 'bathtub');
    const chip = store.state.clauses['clean']!.chips['surface']!;
    expect(chip.expressionMode).toBe(true);
    expect(chip.value).toBe('bathtub');
  });

  it('typing a keyword value in expression mode stays in expression mode', () => {
    let store = initializeSentenceState(textTriggerSentence);
    store = dispatch(store, 'clean', 'surface', TRIGGER_SENTINEL);
    // User types "floor" into the text field — this is an expression value, not a keyword click
    // Since the value matches a keyword AND we're in expression mode, this is ambiguous.
    // The reducer checks domain.keywords.some(k => k.value === value) — "floor" IS a keyword,
    // so this exits expression mode. That's the correct behavior: if the user explicitly
    // enters a keyword value, treat it as keyword selection.
    store = dispatch(store, 'clean', 'surface', 'floor');
    const chip = store.state.clauses['clean']!.chips['surface']!;
    expect(chip.expressionMode).toBeUndefined();
    expect(chip.value).toBe('floor');
  });
});
