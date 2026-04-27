/**
 * Tests for enumDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { enumDomain } from '../../src/domains/enum';

const months = [
  { label: 'January', value: 'january' },
  { label: 'February', value: 'february' },
  { label: 'March', value: 'march' },
  { label: 'April', value: 'april' },
  { label: 'May', value: 'may' },
  { label: 'June', value: 'june' },
  { label: 'July', value: 'july' },
  { label: 'August', value: 'august' },
  { label: 'September', value: 'september' },
  { label: 'October', value: 'october' },
  { label: 'November', value: 'november' },
  { label: 'December', value: 'december' },
];

describe('enumDomain', () => {
  it('creates a domain with type "enum"', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.type).toBe('enum');
  });

  it('passes through color and keywords', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.color).toBe('month');
    expect(domain.keywords).toBe(months);
  });

  it('validates values in the keyword list', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.validate('september')).toBe(true);
    expect(domain.validate('january')).toBe(true);
  });

  it('rejects values not in the keyword list', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.validate('')).toBe(false);
    expect(domain.validate('smarch')).toBe(false);
  });

  it('displays the keyword label for a valid value', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.display('september')).toBe('September');
    expect(domain.display('january')).toBe('January');
  });

  it('falls back to raw value for display when value is not a keyword', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.display('smarch')).toBe('smarch');
  });

  it('defaults to empty string when no defaultValue provided', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.defaultValue).toBe('');
    expect(domain.validate(domain.defaultValue)).toBe(false);
  });

  it('accepts an explicit defaultValue', () => {
    const domain = enumDomain({ color: 'month', keywords: months, defaultValue: 'september' });
    expect(domain.defaultValue).toBe('september');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('stores placeholder text', () => {
    const domain = enumDomain({ color: 'month', keywords: months, placeholder: 'a specific month' });
    expect(domain.placeholder).toBe('a specific month');
  });

  it('has no placeholder when not provided', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.placeholder).toBeUndefined();
  });

  it('has no expression modes', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.expressionModes).toEqual([]);
  });

  it('passes through optional context fields', () => {
    const onChange = () => ({ keywords: [] });
    const domain = enumDomain({
      color: 'month',
      keywords: months,
      consumes: ['calendar'],
      produces: ['month'],
      onContextChange: onChange,
    });
    expect(domain.consumes).toEqual(['calendar']);
    expect(domain.produces).toEqual(['month']);
    expect(domain.onContextChange).toBe(onChange);
  });
});
