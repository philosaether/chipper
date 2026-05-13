/**
 * Tests for alternativeCoordinateDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { alternativeCoordinateDomain } from '../../src/domains/alternative-coordinate';
import type { AlternativeCoordinateMode } from '../../src/domains/alternative-coordinate';

const dateMode: AlternativeCoordinateMode = {
  id: 'date',
  label: 'Date',
  slots: [
    {
      prefix: 'the',
      keywords: [
        { label: '1st', value: '1' },
        { label: '15th', value: '15' },
        { label: 'last day', value: 'last' },
      ],
    },
  ],
  compose: (day) => day,
  decompose: (v) => [v],
  expression: {
    placeholder: 'day of month (1-31)',
    validate: (v) => /^([1-9]|[12]\d|3[01])$/.test(v),
  },
};

const weekdayMode: AlternativeCoordinateMode = {
  id: 'weekday',
  label: 'Weekday',
  slots: [
    {
      prefix: 'the',
      keywords: [
        { label: 'first', value: 'first' },
        { label: 'second', value: 'second' },
        { label: 'third', value: 'third' },
        { label: 'fourth', value: 'fourth' },
        { label: 'last', value: 'last' },
      ],
    },
    {
      keywords: [
        { label: 'Mon', value: 'monday' },
        { label: 'Tue', value: 'tuesday' },
        { label: 'Wed', value: 'wednesday' },
      ],
    },
  ],
  compose: (ordinal, day) => `${ordinal} ${day}`,
  decompose: (v) => {
    const parts = v.split(' ');
    return parts.length === 2 ? parts : [undefined, undefined];
  },
  display: (v) => {
    const [ord, day] = v.split(' ');
    if (!ord || !day) return v;
    return `${ord} ${day.charAt(0).toUpperCase() + day.slice(1, 3)}`;
  },
};

describe('alternativeCoordinateDomain', () => {
  it('creates a domain with type "alternative-coordinate"', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.type).toBe('alternative-coordinate');
  });

  it('passes through color', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.color).toBe('sage');
  });

  it('stores modes in meta', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.meta?.modes).toEqual([dateMode, weekdayMode]);
  });

  // -- validation --

  it('validates single-slot keyword values', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.validate('1')).toBe(true);
    expect(domain.validate('15')).toBe(true);
    expect(domain.validate('last')).toBe(true);
  });

  it('validates multi-slot composed values via decompose', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.validate('first monday')).toBe(true);
    expect(domain.validate('last wednesday')).toBe(true);
  });

  it('validates expression values', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.validate('23')).toBe(true);
    expect(domain.validate('7')).toBe(true);
  });

  it('rejects empty string', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.validate('')).toBe(false);
  });

  it('rejects invalid values', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.validate('0')).toBe(false);
    expect(domain.validate('32')).toBe(false);
  });

  // -- display --

  it('displays single-slot keyword labels', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.display('1')).toBe('1st');
    expect(domain.display('15')).toBe('15th');
    expect(domain.display('last')).toBe('last day');
  });

  it('displays multi-slot values via mode display function', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.display('first monday')).toBe('first Mon');
    expect(domain.display('last wednesday')).toBe('last Wed');
  });

  it('falls back to raw value when no display match', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    expect(domain.display('23')).toBe('23');
  });

  // -- defaults --

  it('defaults to empty string when no defaultValue provided', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode],
    });
    expect(domain.defaultValue).toBe('');
    expect(domain.validate(domain.defaultValue)).toBe(false);
  });

  it('accepts an explicit defaultValue', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode],
      defaultValue: '15',
    });
    expect(domain.defaultValue).toBe('15');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('stores placeholder text', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode],
      placeholder: 'which day',
    });
    expect(domain.placeholder).toBe('which day');
  });

  // -- keywords and expressionModes --

  it('flattens single-slot keywords into domain keywords', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    // dateMode has 3 keywords (single-slot), weekdayMode is multi-slot (excluded)
    expect(domain.keywords).toHaveLength(3);
    expect(domain.keywords.map((k) => k.value)).toEqual(['1', '15', 'last']);
  });

  it('builds expressionModes from modes with expression configs', () => {
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode, weekdayMode],
    });
    // Only dateMode has an expression config
    expect(domain.expressionModes).toHaveLength(1);
    expect(domain.expressionModes[0]?.id).toBe('date');
  });

  // -- context pass-throughs --

  it('passes through optional context fields', () => {
    const onChange = () => ({ keywords: [] });
    const domain = alternativeCoordinateDomain({
      color: 'sage',
      modes: [dateMode],
      consumes: ['period'],
      produces: ['day'],
      onContextChange: onChange,
    });
    expect(domain.consumes).toEqual(['period']);
    expect(domain.produces).toEqual(['day']);
    expect(domain.onContextChange).toBe(onChange);
  });
});
