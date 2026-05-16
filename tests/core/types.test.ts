/**
 * Smoke test — verify core types compile and basic builder works.
 */

import { describe, it, expect } from 'vitest';
import { sentence, builder, chip, createPalette, extendPalette } from '../../src/index';
import type { Domain, SentenceDefinition, Palette } from '../../src/index';

describe('core types', () => {
  it('creates a palette', () => {
    const palette = createPalette({ domains: {}, clauseTemplates: {} });
    expect(palette.domains).toEqual({});
  });

  it('extends the default palette', () => {
    const extended = extendPalette({ chips: {} });
    expect(extended).toBeDefined();
    expect(extended.domains).toEqual({});
  });

  it('builds a sentence definition', () => {
    const definition = sentence()
      .clause('greeting', builder().required().text('Hello').chip('name', 'freeText'))
      .build();

    expect(definition.clauses).toHaveLength(1);
    expect(definition.clauses[0]?.id).toBe('greeting');
    expect(definition.clauses[0]?.chips).toHaveLength(1);
    expect(definition.clauses[0]?.chips[0]?.id).toBe('name');
  });

  it('builds a sentence with optional clauses', () => {
    const definition = sentence()
      .clause('action', builder().required().text('Do').chip('what', 'freeText'))
      .clause('when', builder().optional().text('at').placeholder('any time').chip('time', 'timeOfDay'))
      .build();

    expect(definition.clauses).toHaveLength(2);
    expect(definition.clauses[0]?.necessity).toBe('required');
    expect(definition.clauses[1]?.necessity).toBe('optional');
    expect(definition.clauses[1]?.placeholder).toBe('any time');
  });
});
