/**
 * Tests for enumDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { enumDomain } from '../../src/domains/enum';
import { allMonthKeywords as months } from '../fixtures/month-keywords';

describe('enumDomain', () => {
  it('creates a domain with type "enum"', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.type).toBe('enum');
  });

  it('passes through color and keywords', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.color).toBe('month');
    expect(domain.keywords.length).toBe(months.length);
    expect(domain.keywords.map(k => k.value)).toEqual(months.map(k => k.value));
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

  it('defaults to first keyword when no default provided', () => {
    const domain = enumDomain({ color: 'month', keywords: months });
    expect(domain.defaultValue).toBe('january');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('accepts an explicit default', () => {
    const domain = enumDomain({ color: 'month', keywords: months, default: 'september' });
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
