/**
 * Tests for serialization / deserialization.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { keywordDomain, numberDomain } from '../../src/domains/facades';
import { multiSelectDomain } from '../../src/domains/multi-select';
import { keywordOrExpressionDomain, numericExpression } from '../../src/domains/keyword-or-expression';
import { serialize, deserialize } from '../../src/core/serialize';
import { TRIGGER_SENTINEL } from '../../src/core/mode-switching';

const palette = extendPalette({
  chips: {
    action: keywordDomain({
      color: 'slate',
      keywords: [{ value: 'run' }, { value: 'walk' }],
      default: 'run',
    }),
    speed: keywordDomain({
      color: 'copper',
      keywords: [{ value: 'fast' }, { value: 'slow' }],
      default: 'fast',
    }),
    distance: keywordOrExpressionDomain({
      color: 'sage',
      keywords: [{ value: 'short' }, { value: 'long' }],
      expression: numericExpression({ min: 1, max: 100, trigger: { label: 'custom', default: '5' } }),
      default: 'short',
    }),
    days: multiSelectDomain({
      color: 'sage',
      options: [
        { label: 'Mon', value: 'mon' },
        { label: 'Tue', value: 'tue' },
        { label: 'Wed', value: 'wed' },
      ],
      keywords: [],
      placeholder: 'days',
    }),
  },
});

describe('serialize', () => {
  it('serializes active chip values', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().text('and').chip('speed'))
      .build();

    const store = initializeSentenceState(def);
    const result = serialize(def, store.state);

    expect(result.action).toBe('run');
    expect(result.speed).toBe('fast');
  });

  it('excludes inactive optional clause values', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().optional().text('and').chip('speed'))
      .build();

    const store = initializeSentenceState(def);
    const result = serialize(def, store.state);

    expect(result.action).toBe('run');
    expect(result.speed).toBeUndefined();
    expect(result.__active).toBeUndefined();
  });

  it('includes active optional clause with __active flag', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().optional().text('and').chip('speed'))
      .build();

    const store = initializeSentenceState(def);
    const toggled = sentenceReducer(store, { type: 'TOGGLE_CLAUSE', clauseId: 'how' });
    const result = serialize(def, toggled.state);

    expect(result.action).toBe('run');
    expect(result.speed).toBe('fast');
    expect(result.__active).toEqual({ how: true });
  });

  it('includes __expressionMode for chips in expression mode', () => {
    const def = sentence(palette)
      .clause('go', builder().text('go').chip('distance'))
      .build();

    const store = initializeSentenceState(def);
    const triggered = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'go',
      chipId: 'distance',
      value: TRIGGER_SENTINEL,
    });
    const result = serialize(def, triggered.state);

    expect(result.__expressionMode).toEqual({ distance: true });
  });

  it('serializes multi-select array values', () => {
    const def = sentence(palette)
      .clause('when', builder().text('on').chip('days'))
      .build();

    const store = initializeSentenceState(def);
    const updated = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'when',
      chipId: 'days',
      value: ['mon', 'wed'],
    });
    const result = serialize(def, updated.state);

    expect(result.days).toEqual(['mon', 'wed']);
  });

  it('uses custom serializer when provided', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .serializer((state) => ({
        custom_action: state.clauses['verb']?.chips['action']?.value,
      }))
      .build();

    const store = initializeSentenceState(def);
    const result = serialize(def, store.state);

    expect(result.custom_action).toBe('run');
    expect(result.action).toBeUndefined();
  });
});

describe('deserialize', () => {
  it('restores chip values', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().text('and').chip('speed'))
      .build();

    const store = deserialize(def, { action: 'walk', speed: 'slow' });

    expect(store.state.clauses['verb'].chips['action'].value).toBe('walk');
    expect(store.state.clauses['how'].chips['speed'].value).toBe('slow');
  });

  it('marks restored chips as dirty', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .build();

    const store = deserialize(def, { action: 'walk' });

    expect(store.state.clauses['verb'].chips['action'].dirty).toBe(true);
  });

  it('restores optional clause activation via __active', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().optional().text('and').chip('speed'))
      .build();

    const store = deserialize(def, {
      action: 'walk',
      speed: 'slow',
      __active: { how: true },
    });

    expect(store.state.clauses['how'].active).toBe(true);
    expect(store.state.clauses['how'].chips['speed'].value).toBe('slow');
  });

  it('optional clause stays inactive without __active', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().optional().text('and').chip('speed'))
      .build();

    const store = deserialize(def, { action: 'walk' });

    expect(store.state.clauses['how'].active).toBe(false);
  });

  it('restores expression mode via __expressionMode', () => {
    const def = sentence(palette)
      .clause('go', builder().text('go').chip('distance'))
      .build();

    const store = deserialize(def, {
      distance: '42',
      __expressionMode: { distance: true },
    });

    expect(store.state.clauses['go'].chips['distance'].expressionMode).toBe(true);
    expect(store.state.clauses['go'].chips['distance'].value).toBe('42');
  });

  it('recomputes display values from domains', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .build();

    const store = deserialize(def, { action: 'walk' });

    expect(store.state.clauses['verb'].chips['action'].displayValue).toBe('walk');
  });

  it('recomputes validity from domains', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .build();

    // 'jump' is not a valid keyword
    const store = deserialize(def, { action: 'jump' });

    expect(store.state.clauses['verb'].chips['action'].valid).toBe(false);
  });

  it('uses custom deserializer when provided', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .deserializer((data) => ({
        action: data.custom_action,
      }))
      .build();

    const store = deserialize(def, { custom_action: 'walk' });

    expect(store.state.clauses['verb'].chips['action'].value).toBe('walk');
  });

  it('falls back to domain defaults for missing chip values', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().text('and').chip('speed'))
      .build();

    // Only restore action, not speed
    const store = deserialize(def, { action: 'walk' });

    expect(store.state.clauses['verb'].chips['action'].value).toBe('walk');
    expect(store.state.clauses['how'].chips['speed'].value).toBe('fast'); // default
  });
});

describe('round-trip', () => {
  it('serialize then deserialize restores equivalent state', () => {
    const def = sentence(palette)
      .clause('verb', builder().text('I').chip('action'))
      .clause('how', builder().optional().text('and').chip('speed'))
      .build();

    const store = initializeSentenceState(def);
    const toggled = sentenceReducer(store, { type: 'TOGGLE_CLAUSE', clauseId: 'how' });
    const updated = sentenceReducer(toggled, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'verb',
      chipId: 'action',
      value: 'walk',
    });

    const serialized = serialize(def, updated.state);
    const restored = deserialize(def, serialized);

    // Values match
    expect(restored.state.clauses['verb'].chips['action'].value).toBe('walk');
    expect(restored.state.clauses['how'].chips['speed'].value).toBe('fast');
    expect(restored.state.clauses['how'].active).toBe(true);
  });
});
