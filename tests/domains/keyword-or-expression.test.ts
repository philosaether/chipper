/**
 * Tests for keywordOrExpressionDomain and expressionDomain factories.
 */

import { describe, it, expect } from 'vitest';
import {
  keywordOrExpressionDomain,
  expressionDomain,
} from '../../src/domains/keyword-or-expression';

const timeKeywords = [
  { label: 'morning', value: '09:00' },
  { label: 'afternoon', value: '12:00' },
  { label: 'evening', value: '17:00' },
];

describe('keywordOrExpressionDomain', () => {
  it('creates a domain with type "keyword-or-expression"', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.type).toBe('keyword-or-expression');
  });

  it('validates keyword values', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.validate('09:00')).toBe(true);
    expect(domain.validate('17:00')).toBe(true);
  });

  it('validates non-empty expression values', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.validate('14:30')).toBe(true);
    expect(domain.validate('any text')).toBe(true);
  });

  it('rejects empty string', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.validate('')).toBe(false);
  });

  it('displays keyword label for keyword values', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.display('09:00')).toBe('morning');
    expect(domain.display('17:00')).toBe('evening');
  });

  it('displays raw value for expression values', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.display('14:30')).toBe('14:30');
  });

  it('uses custom expression validate', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: {
        validate: (v) => /^\d{2}:\d{2}$/.test(v),
      },
    });
    expect(domain.validate('14:30')).toBe(true);
    expect(domain.validate('not a time')).toBe(false);
    // Keywords still valid even if they fail expression validate
    expect(domain.validate('09:00')).toBe(true);
  });

  it('uses custom expression display', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: {
        display: (v) => `at ${v}`,
      },
    });
    expect(domain.display('14:30')).toBe('at 14:30');
    // Keywords still use label
    expect(domain.display('09:00')).toBe('morning');
  });

  it('defaults to first keyword when keywords provided', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
    });
    expect(domain.defaultValue).toBe('09:00');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('defaults to empty string when no keywords and no default', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      expression: { inputType: 'text' },
    });
    expect(domain.defaultValue).toBe('');
    expect(domain.validate(domain.defaultValue)).toBe(false);
  });

  it('accepts explicit default', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text' },
      default: '09:00',
    });
    expect(domain.defaultValue).toBe('09:00');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('keywords are optional (expression-only)', () => {
    const domain = keywordOrExpressionDomain({
      color: 'rose',
      expression: { inputType: 'text', placeholder: 'task name' },
    });
    expect(domain.keywords).toEqual([]);
    expect(domain.validate('My Task')).toBe(true);
    expect(domain.display('My Task')).toBe('My Task');
  });

  it('has exactly one expression mode', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: timeKeywords,
      expression: { inputType: 'text', placeholder: 'HH:MM' },
    });
    expect(domain.expressionModes).toHaveLength(1);
    expect(domain.expressionModes[0].id).toBe('text');
    expect(domain.expressionModes[0].label).toBe('HH:MM');
  });

  it('expression mode validate and display match config', () => {
    const validate = (v: string) => v.length >= 3;
    const display = (v: string) => v.toUpperCase();
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      expression: { inputType: 'text', validate, display },
    });
    const mode = domain.expressionModes[0];
    expect(mode.validate('ab')).toBe(false);
    expect(mode.validate('abc')).toBe(true);
    expect(mode.display('hello')).toBe('HELLO');
  });

  it('stores maxLength on expression mode', () => {
    const domain = keywordOrExpressionDomain({
      color: 'rose',
      expression: { inputType: 'text', maxLength: 200 },
    });
    expect(domain.expressionModes[0].maxLength).toBe(200);
  });

  it('passes through optional context fields', () => {
    const onChange = () => ({ keywords: [] });
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      expression: { inputType: 'text' },
      consumes: ['period'],
      produces: ['time'],
      onContextChange: onChange,
    });
    expect(domain.consumes).toEqual(['period']);
    expect(domain.produces).toEqual(['time']);
    expect(domain.onContextChange).toBe(onChange);
  });
});

describe('expressionDomain', () => {
  it('creates a keyword-or-expression domain with no keywords', () => {
    const domain = expressionDomain({
      color: 'rose',
      expression: { inputType: 'text', placeholder: 'task name' },
    });
    expect(domain.type).toBe('keyword-or-expression');
    expect(domain.keywords).toEqual([]);
  });

  it('validates non-empty input', () => {
    const domain = expressionDomain({
      color: 'rose',
      expression: { inputType: 'text' },
    });
    expect(domain.validate('hello')).toBe(true);
    expect(domain.validate('')).toBe(false);
  });

  it('uses custom expression validate', () => {
    const domain = expressionDomain({
      color: 'rose',
      expression: {
        validate: (v) => v.length <= 10,
      },
    });
    expect(domain.validate('short')).toBe(true);
    expect(domain.validate('this is too long')).toBe(false);
  });

  it('stores placeholder', () => {
    const domain = expressionDomain({
      color: 'rose',
      expression: { inputType: 'text' },
      placeholder: 'a new task',
    });
    expect(domain.placeholder).toBe('a new task');
  });
});
