/**
 * Tests for keywordDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { keywordDomain } from '../../src/domains/facades';
import { allMonthKeywords as months } from '../fixtures/month-keywords';

describe('keywordDomain', () => {
  it('creates a domain with type "keyword-or-expression"', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.type).toBe('keyword-or-expression');
  });

  it('passes through color and keywords', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.color).toBe('month');
    expect(domain.keywords.length).toBe(months.length);
    expect(domain.keywords.map(k => k.value)).toEqual(months.map(k => k.value));
  });

  it('validates values in the keyword list', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.validate('september')).toBe(true);
    expect(domain.validate('january')).toBe(true);
  });

  it('rejects values not in the keyword list', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.validate('')).toBe(false);
    expect(domain.validate('smarch')).toBe(false);
  });

  it('displays the keyword label for a valid value', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.display('september')).toBe('September');
    expect(domain.display('january')).toBe('January');
  });

  it('falls back to raw value for display when value is not a keyword', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.display('smarch')).toBe('smarch');
  });

  it('defaults to first keyword when no default provided', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.defaultValue).toBe('january');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('accepts an explicit default', () => {
    const domain = keywordDomain({ color: 'month', keywords: months, default: 'september' });
    expect(domain.defaultValue).toBe('september');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('stores placeholder text', () => {
    const domain = keywordDomain({ color: 'month', keywords: months, placeholder: 'a specific month' });
    expect(domain.placeholder).toBe('a specific month');
  });

  it('has no placeholder when not provided', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.placeholder).toBeUndefined();
  });

  it('has no expression modes', () => {
    const domain = keywordDomain({ color: 'month', keywords: months });
    expect(domain.expressionModes).toEqual([]);
  });
});
