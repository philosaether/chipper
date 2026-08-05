/**
 * Tests for keyword grouping: normalizeKeywordGroups, isKeywordGroup,
 * and grouped domain factory behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeKeywordGroups,
  isKeywordGroup,
  type KeywordConfig,
  type KeywordGroup,
  type KeywordGroupItem,
} from '../../src/domains/normalize-keywords';
import { keywordDomain, keywordOrExpressionDomain, numericExpression } from '../../src/domains';

describe('isKeywordGroup', () => {
  it('returns false for plain keyword configs', () => {
    expect(isKeywordGroup({ value: 'a' })).toBe(false);
    expect(isKeywordGroup({ value: 'b', label: 'B' })).toBe(false);
  });

  it('returns true for group objects', () => {
    expect(isKeywordGroup({ keywords: [{ value: 'a' }] })).toBe(true);
    expect(isKeywordGroup({ label: 'test', keywords: [] })).toBe(true);
  });
});

describe('normalizeKeywordGroups', () => {
  it('normalizes flat keywords into a single implicit group', () => {
    const items: KeywordGroupItem<string>[] = [
      { value: 'a' },
      { value: 'b', label: 'Beta' },
    ];
    const { flat, groups } = normalizeKeywordGroups(items);

    expect(flat).toHaveLength(2);
    expect(flat[0]!.value).toBe('a');
    expect(flat[0]!.label).toBe('a'); // auto-label from value
    expect(flat[1]!.label).toBe('Beta');

    expect(groups).toHaveLength(1);
    expect(groups[0]!.layout).toBe('flow');
    expect(groups[0]!.label).toBeUndefined();
    expect(groups[0]!.keywords).toHaveLength(2);
  });

  it('normalizes explicit groups', () => {
    const items: KeywordGroupItem<string>[] = [
      {
        label: 'shortcuts',
        keywords: [{ value: '1', label: '1st' }, { value: '15', label: '15th' }],
      },
      {
        label: 'grid',
        layout: 'grid',
        columns: 7,
        keywords: [{ value: '1' }, { value: '2' }, { value: '3' }],
      },
    ];
    const { flat, groups } = normalizeKeywordGroups(items);

    expect(flat).toHaveLength(5);
    expect(groups).toHaveLength(2);

    expect(groups[0]!.label).toBe('shortcuts');
    expect(groups[0]!.layout).toBe('flow');
    expect(groups[0]!.keywords).toHaveLength(2);

    expect(groups[1]!.label).toBe('grid');
    expect(groups[1]!.layout).toBe('grid');
    expect(groups[1]!.columns).toBe(7);
    expect(groups[1]!.keywords).toHaveLength(3);
  });

  it('collects ungrouped keywords into one implicit group before explicit groups', () => {
    const items: KeywordGroupItem<string>[] = [
      { value: 'stray1' },
      { label: 'named', keywords: [{ value: 'grouped' }] },
      { value: 'stray2' },
    ];
    const { groups } = normalizeKeywordGroups(items);

    // Both stray keywords in one implicit group, then the named group
    expect(groups).toHaveLength(2);
    expect(groups[0]!.label).toBeUndefined();
    expect(groups[0]!.keywords.map((k) => k.value)).toEqual(['stray1', 'stray2']);
    expect(groups[1]!.label).toBe('named');
  });

  it('handles group with prefix', () => {
    const items: KeywordGroupItem<string>[] = [
      { label: 'dates', prefix: 'the', keywords: [{ value: '1', label: '1st' }] },
    ];
    const { groups } = normalizeKeywordGroups(items);

    expect(groups[0]!.prefix).toBe('the');
  });

  it('handles group without label (separator-only)', () => {
    const items: KeywordGroupItem<string>[] = [
      { keywords: [{ value: 'a' }] },
      { keywords: [{ value: 'b' }] },
    ];
    const { groups } = normalizeKeywordGroups(items);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.label).toBeUndefined();
    expect(groups[1]!.label).toBeUndefined();
  });

  it('produces correct flat list from mixed input', () => {
    const items: KeywordGroupItem<string>[] = [
      { value: 'plain' },
      { label: 'g1', keywords: [{ value: 'a' }, { value: 'b' }] },
      { label: 'g2', keywords: [{ value: 'c' }] },
    ];
    const { flat } = normalizeKeywordGroups(items);

    expect(flat.map((k) => k.value)).toEqual(['plain', 'a', 'b', 'c']);
  });
});

describe('domain factories with keyword groups', () => {
  it('keywordDomain sets keywordGroups when groups are present', () => {
    const domain = keywordDomain({
      color: 'sage',
      keywords: [
        {
          label: 'shortcuts',
          keywords: [{ value: '1', label: '1st' }, { value: '15', label: '15th' }],
        },
        {
          label: 'all',
          layout: 'grid',
          columns: 7,
          keywords: Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1) })),
        },
      ],
    });

    expect(domain.keywordGroups).toBeDefined();
    expect(domain.keywordGroups).toHaveLength(2);
    expect(domain.keywordGroups![0]!.label).toBe('shortcuts');
    expect(domain.keywordGroups![1]!.layout).toBe('grid');
    expect(domain.keywordGroups![1]!.columns).toBe(7);

    // Flat keywords for validation
    expect(domain.keywords).toHaveLength(7);
    expect(domain.validate('1')).toBe(true);
    expect(domain.validate('5')).toBe(true);
    expect(domain.validate('99')).toBe(false);
  });

  it('keywordDomain leaves keywordGroups undefined for flat keywords', () => {
    const domain = keywordDomain({
      color: 'sage',
      keywords: [{ value: 'a' }, { value: 'b' }],
    });

    expect(domain.keywordGroups).toBeUndefined();
    expect(domain.keywords).toHaveLength(2);
  });

  it('keywordOrExpressionDomain supports grouped keywords alongside expression', () => {
    const domain = keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        {
          label: 'presets',
          keywords: [{ value: '5', label: '5 days' }, { value: '10', label: '10 days' }],
        },
      ],
      expression: numericExpression({ min: 1, max: 365 }),
    });

    expect(domain.keywordGroups).toBeDefined();
    expect(domain.keywordGroups).toHaveLength(1);
    expect(domain.keywords).toHaveLength(2);
    expect(domain.validate('5')).toBe(true);
    expect(domain.validate('42')).toBe(true); // expression value
  });
});

describe('group prefix in chip display (ENYC bug)', () => {
  it('bakes the group prefix into keyword display', () => {
    const { flat } = normalizeKeywordGroups([
      {
        prefix: 'this',
        keywords: [
          { value: 'spring', label: 'spring' },
          { value: 'summer', label: 'summer', display: 'summer season' },
        ],
      },
    ]);
    expect(flat[0]!.display).toBe('this spring');
    // Explicit per-keyword display wins over prefix composition
    expect(flat[1]!.display).toBe('summer season');
  });

  it('leaves ungrouped and unprefixed keywords untouched', () => {
    const { flat } = normalizeKeywordGroups([
      { value: 'daily' },
      { label: 'Weekly', keywords: [{ value: 'weekly' }] },
    ]);
    expect(flat[0]!.display).toBeUndefined();
    expect(flat[1]!.display).toBeUndefined();
  });
});
