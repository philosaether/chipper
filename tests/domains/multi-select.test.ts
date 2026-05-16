/**
 * Tests for multiSelectDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { multiSelectDomain } from '../../src/domains/multi-select';

const dayOptions = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
];

const dayKeywords = [
  { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { label: 'weekend', value: ['sat', 'sun'] },
];

describe('multiSelectDomain', () => {
  it('creates a domain with type "multi-select"', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.type).toBe('multi-select');
  });

  it('passes through color', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.color).toBe('sage');
  });

  it('stores options in meta', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    const opts = domain.meta?.options as { value: string }[];
    expect(opts.length).toBe(dayOptions.length);
    expect(opts.map(o => o.value)).toEqual(dayOptions.map(o => o.value));
  });

  it('stores group keywords on domain.keywords', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      keywords: dayKeywords,
    });
    expect(domain.keywords.length).toBe(dayKeywords.length);
    expect(domain.keywords.map(k => k.value)).toEqual(dayKeywords.map(k => k.value));
  });

  it('defaults to empty keywords when none provided', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.keywords).toEqual([]);
  });

  // -- validation --

  it('validates arrays of known option values', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.validate(['mon', 'wed'])).toBe(true);
    expect(domain.validate(['sat'])).toBe(true);
  });

  it('rejects empty arrays', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.validate([])).toBe(false);
  });

  it('rejects arrays with unknown values', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.validate(['mon', 'holiday'])).toBe(false);
  });

  it('respects maxSelections', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      maxSelections: 3,
    });
    expect(domain.validate(['mon', 'tue', 'wed'])).toBe(true);
    expect(domain.validate(['mon', 'tue', 'wed', 'thu'])).toBe(false);
  });

  // -- display --

  it('displays up to 3 labels comma-joined', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.display(['mon'])).toBe('Mon');
    expect(domain.display(['mon', 'wed'])).toBe('Mon, Wed');
    expect(domain.display(['mon', 'wed', 'fri'])).toBe('Mon, Wed, Fri');
  });

  it('displays count at 4+ selections', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.display(['mon', 'tue', 'wed', 'thu'])).toBe('4 selected');
    expect(domain.display(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('5 selected');
  });

  it('uses custom countLabel for 4+ selections', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions, countLabel: 'days' });
    expect(domain.display(['mon', 'tue', 'wed', 'thu'])).toBe('4 days');
    expect(domain.display(['mon', 'tue'])).toBe('Mon, Tue');
  });

  it('displays keyword label when selection matches a group keyword', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      keywords: dayKeywords,
    });
    expect(domain.display(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('weekdays');
    expect(domain.display(['sat', 'sun'])).toBe('weekend');
  });

  it('displays keyword label even when user arrived by manual selection', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      keywords: dayKeywords,
    });
    // Same values as 'weekdays' keyword, just in different order
    expect(domain.display(['fri', 'thu', 'wed', 'tue', 'mon'])).toBe('weekdays');
  });

  it('prefers keyword label over count display', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      keywords: dayKeywords,
      countLabel: 'days',
    });
    // 5 items would normally show "5 days", but matches 'weekdays' keyword
    expect(domain.display(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('weekdays');
  });

  it('displays empty string for empty selection', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.display([])).toBe('');
  });

  it('falls back to raw value for unknown option values', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.display(['holiday'])).toBe('holiday');
  });

  // -- defaults --

  it('defaults to empty array when no defaultValue provided', () => {
    const domain = multiSelectDomain({ color: 'sage', options: dayOptions });
    expect(domain.defaultValue).toEqual([]);
    expect(domain.validate(domain.defaultValue)).toBe(false);
  });

  it('accepts an explicit defaultValue', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      defaultValue: ['mon', 'fri'],
    });
    expect(domain.defaultValue).toEqual(['mon', 'fri']);
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('stores placeholder text', () => {
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      placeholder: 'which days',
    });
    expect(domain.placeholder).toBe('which days');
  });

  // -- context pass-throughs --

  it('passes through optional context fields', () => {
    const onChange = () => ({ keywords: [] });
    const domain = multiSelectDomain({
      color: 'sage',
      options: dayOptions,
      consumes: ['period'],
      produces: ['days'],
      onContextChange: onChange,
    });
    expect(domain.consumes).toEqual(['period']);
    expect(domain.produces).toEqual(['days']);
    expect(domain.onContextChange).toBe(onChange);
  });
});
