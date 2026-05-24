/**
 * Tests for context-aware punctuation — .punc() builder method.
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { keywordDomain } from '../../src/domains/facades';

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
    direction: keywordDomain({
      color: 'sage',
      keywords: [{ value: 'north' }, { value: 'south' }],
      default: 'north',
    }),
  },
});

describe('punc() — default resolver', () => {
  it('renders period when clause is last active in sentence', () => {
    const definition = sentence(palette)
      .clause('verb', builder().text('I').chip('action').punc())
      .build();

    const store = initializeSentenceState(definition);
    // The punc segment should be a function
    const puncSegment = definition.clauses[0].segments[2];
    expect(puncSegment.type).toBe('text');
    expect(typeof puncSegment.value).toBe('function');

    // Should resolve to period — only clause in sentence
    const text = (puncSegment.value as (state: any) => string)(store.state);
    expect(text).toBe('.');
  });

  it('renders comma when subsequent clause is active', () => {
    const definition = sentence(palette)
      .clause('verb', builder().text('I').chip('action').punc())
      .clause('speed', builder().text('and').chip('speed').punc())
      .build();

    const store = initializeSentenceState(definition);

    const puncVerb = definition.clauses[0].segments[2];
    const puncSpeed = definition.clauses[1].segments[2];

    // First clause: comma (second clause follows)
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe(',');
    // Last clause: period
    expect((puncSpeed.value as (state: any) => string)(store.state)).toBe('.');
  });

  it('renders empty string when owning clause is inactive', () => {
    const definition = sentence(palette)
      .clause('verb', builder().text('I').chip('action').punc())
      .clause('speed', builder().optional().text('and').chip('speed').punc())
      .build();

    const store = initializeSentenceState(definition);

    // Optional clause starts inactive
    const puncSpeed = definition.clauses[1].segments[2];
    expect((puncSpeed.value as (state: any) => string)(store.state)).toBe('');

    // First clause becomes last active → period
    const puncVerb = definition.clauses[0].segments[2];
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe('.');
  });

  it('updates when optional clause is toggled active', () => {
    const definition = sentence(palette)
      .clause('verb', builder().text('I').chip('action').punc())
      .clause('speed', builder().optional().text('and').chip('speed').punc())
      .build();

    const store = initializeSentenceState(definition);

    // Toggle optional clause on
    const next = sentenceReducer(store, {
      type: 'TOGGLE_CLAUSE',
      clauseId: 'speed',
    });

    const puncVerb = definition.clauses[0].segments[2];
    const puncSpeed = definition.clauses[1].segments[2];

    // First clause now has a follower → comma
    expect((puncVerb.value as (state: any) => string)(next.state)).toBe(',');
    // Second clause is last → period
    expect((puncSpeed.value as (state: any) => string)(next.state)).toBe('.');
  });

  it('looks across lines for subsequent clauses', () => {
    const definition = sentence(palette)
      .clause('verb', builder().text('I').chip('action').punc())
      .line()
      .clause('speed', builder().text('and').chip('speed').punc())
      .build();

    const store = initializeSentenceState(definition);

    // First clause: comma (second clause on next line is still subsequent)
    const puncVerb = definition.clauses[0].segments[2];
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe(',');

    // Second clause: period (last in sentence)
    const puncSpeed = definition.clauses[1].segments[2];
    expect((puncSpeed.value as (state: any) => string)(store.state)).toBe('.');
  });
});

describe('punc() — contingent clauses', () => {
  it('renders period when contingent clause is not present', () => {
    const definition = sentence(palette)
      .clause('verb', builder()
        .text('I').chip('action').punc()
        .produces('action'))
      .clause('speed', builder()
        .text('and').chip('speed').punc()
        .contingentOn('verb', (ctx) => ctx.action === 'run'))
      .build();

    const store = initializeSentenceState(definition);

    // action defaults to 'run', so speed is present
    const puncVerb = definition.clauses[0].segments[2];
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe(',');

    // Change to 'walk' — speed clause becomes not present
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'verb',
      chipId: 'action',
      value: 'walk',
    });

    expect((puncVerb.value as (state: any) => string)(next.state)).toBe('.');
  });
});

describe('punc({ display }) — custom display', () => {
  it('uses custom display function with SentenceContext', () => {
    const definition = sentence(palette)
      .clause('verb', builder()
        .text('I').chip('action')
        .punc({ display: () => '!' })
        .produces('action'))
      .build();

    const store = initializeSentenceState(definition);

    const puncVerb = definition.clauses[0].segments[2];
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe('!');
  });

  it('renders empty when clause is inactive even with custom display', () => {
    const definition = sentence(palette)
      .clause('verb', builder()
        .optional().text('I').chip('action')
        .punc({ display: () => '!' }))
      .build();

    const store = initializeSentenceState(definition);

    // Optional starts inactive
    const puncVerb = definition.clauses[0].segments[2];
    expect((puncVerb.value as (state: any) => string)(store.state)).toBe('');
  });
});
