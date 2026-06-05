/**
 * Tests for .a() (indefinite article) and .period() (sentence-terminal punctuation).
 */

import { describe, it, expect } from 'vitest';
import { initializeSentenceState } from '../../src/core/initialize';
import { sentenceReducer } from '../../src/core/reducer';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { keywordDomain } from '../../src/domains/facades';

const palette = extendPalette({
  chips: {
    animal: keywordDomain({
      color: 'slate',
      keywords: [{ value: 'dog' }, { value: 'elephant' }, { value: 'cat' }],
      default: 'dog',
    }),
    color: keywordDomain({
      color: 'copper',
      keywords: [{ value: 'orange' }, { value: 'blue' }],
      default: 'orange',
    }),
    action: keywordDomain({
      color: 'sage',
      keywords: [{ value: 'run' }, { value: 'walk' }],
      default: 'run',
    }),
  },
});

describe('a() — indefinite article', () => {
  it('renders "a" when next chip starts with a consonant', () => {
    const definition = sentence(palette)
      .clause('main', builder().text('I see').a().chip('animal'))
      .build();

    const store = initializeSentenceState(definition);
    // Article is segment index 1 (after "I see" text)
    const articleSegment = definition.clauses[0]!.segments[1]!;
    expect(typeof articleSegment.value).toBe('function');
    expect((articleSegment.value as (state: any) => string)(store.state)).toBe('a');
  });

  it('renders "an" when next chip starts with a vowel', () => {
    const definition = sentence(palette)
      .clause('main', builder().text('I see').a().chip('animal'))
      .build();

    const store = initializeSentenceState(definition);
    const next = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'main',
      chipId: 'animal',
      value: 'elephant',
    });

    const articleSegment = definition.clauses[0]!.segments[1]!;
    expect((articleSegment.value as (state: any) => string)(next.state)).toBe('an');
  });

  it('updates dynamically when chip value changes', () => {
    const definition = sentence(palette)
      .clause('main', builder().text('I see').a().chip('animal'))
      .build();

    const store = initializeSentenceState(definition);
    const articleSegment = definition.clauses[0]!.segments[1]!;
    const resolve = articleSegment.value as (state: any) => string;

    // dog → "a"
    expect(resolve(store.state)).toBe('a');

    // elephant → "an"
    const s2 = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'main',
      chipId: 'animal',
      value: 'elephant',
    });
    expect(resolve(s2.state)).toBe('an');

    // cat → "a"
    const s3 = sentenceReducer(store, {
      type: 'SET_CHIP_VALUE',
      clauseId: 'main',
      chipId: 'animal',
      value: 'cat',
    });
    expect(resolve(s3.state)).toBe('a');
  });

  it('renders "a" when next chip has empty display value', () => {
    const emptyPalette = extendPalette({
      chips: {
        thing: keywordDomain({
          color: 'slate',
          keywords: [{ value: 'dog' }],
          // No default — placeholder state
        }),
      },
    });
    const definition = sentence(emptyPalette)
      .clause('main', builder().text('I see').a().chip('thing'))
      .build();

    const store = initializeSentenceState(definition);
    const articleSegment = definition.clauses[0]!.segments[1]!;
    const resolve = articleSegment.value as (state: any) => string;

    // Placeholder — display value is the placeholder text or empty
    // Either way, "a" is the safe default
    expect(resolve(store.state)).toBe('a');
  });

  it('throws at build time if no subsequent chip exists', () => {
    expect(() => {
      sentence(palette)
        .clause('main', builder().text('I see').a())
        .build();
    }).toThrow(/no subsequent chip/i);
  });

  it('skips non-chip segments to find the next chip', () => {
    const definition = sentence(palette)
      .clause('main', builder().a().text('big').chip('animal'))
      .build();

    const store = initializeSentenceState(definition);
    const articleSegment = definition.clauses[0]!.segments[0]!;
    expect((articleSegment.value as (state: any) => string)(store.state)).toBe('a');
  });
});

describe('period() — sentence-terminal punctuation', () => {
  it('renders "." when clause is active', () => {
    const definition = sentence(palette)
      .clause('main', builder().text('I').chip('action').period())
      .build();

    const store = initializeSentenceState(definition);
    const periodSegment = definition.clauses[0]!.segments[2]!;
    expect(typeof periodSegment.value).toBe('function');
    expect((periodSegment.value as (state: any) => string)(store.state)).toBe('.');
  });

  it('renders empty when clause is inactive', () => {
    const definition = sentence(palette)
      .clause('main', builder().optional().text('I').chip('action').period())
      .build();

    const store = initializeSentenceState(definition);
    const periodSegment = definition.clauses[0]!.segments[2]!;
    expect((periodSegment.value as (state: any) => string)(store.state)).toBe('');
  });

  it('acts as boundary for preceding punc — punc renders period before period clause', () => {
    const definition = sentence(palette)
      .clause('first', builder().text('I').chip('action').punc())
      .clause('second', builder().text('then').chip('color').period())
      .clause('third', builder().text('also').chip('animal').punc())
      .build();

    const store = initializeSentenceState(definition);

    // first punc: subsequent stops at "second" (period boundary)
    // "second" is active, so first punc = comma
    const puncFirst = definition.clauses[0]!.segments[2]!;
    expect((puncFirst.value as (state: any) => string)(store.state)).toBe(',');

    // third punc: it's the last clause, so period
    const puncThird = definition.clauses[2]!.segments[2]!;
    expect((puncThird.value as (state: any) => string)(store.state)).toBe('.');

    // period itself: always "."
    const periodSecond = definition.clauses[1]!.segments[2]!;
    expect((periodSecond.value as (state: any) => string)(store.state)).toBe('.');
  });

  it('punc renders period when only clause before period boundary', () => {
    const definition = sentence(palette)
      .clause('only', builder().text('I').chip('action').punc())
      .clause('end', builder().text('then').chip('color').period())
      .build();

    const store = initializeSentenceState(definition);

    // "only" punc: subsequent includes "end" (period boundary) which is active → comma
    const puncOnly = definition.clauses[0]!.segments[2]!;
    expect((puncOnly.value as (state: any) => string)(store.state)).toBe(',');
  });
});
