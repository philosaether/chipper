/**
 * Tests for referenceDomain factory.
 */

import { describe, it, expect } from 'vitest';
import { referenceDomain } from '../../src/domains/reference';
import type { ReferenceItem, ReferenceSource } from '../../src/domains/reference';

const genreTree: ReferenceItem[] = [
  { id: 'rock', label: 'Rock', hasChildren: true },
  { id: 'jazz', label: 'Jazz', hasChildren: true },
  { id: 'electronic', label: 'Electronic', hasChildren: true, selectable: false },
  { id: 'classical', label: 'Classical', hasChildren: true },
];

const rockChildren: ReferenceItem[] = [
  { id: 'classic-rock', label: 'Classic Rock' },
  { id: 'punk', label: 'Punk' },
  { id: 'alternative', label: 'Alternative' },
];

const flatSource: ReferenceSource = {
  getItems: () => genreTree,
};

const hierarchicalSource: ReferenceSource = {
  getItems: (path) => {
    if (path.length === 0) return genreTree;
    if (path[0]!.id === 'rock') return rockChildren;
    return [];
  },
  search: (query) =>
    [...genreTree, ...rockChildren].filter((i) =>
      i.label.toLowerCase().includes(query.toLowerCase()),
    ),
  resolveDisplay: (id) => {
    const item = [...genreTree, ...rockChildren].find((i) => i.id === id);
    return item?.label ?? id;
  },
};

describe('referenceDomain', () => {
  it('creates a domain with type "reference"', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.type).toBe('reference');
  });

  it('passes through color', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.color).toBe('indigo');
  });

  it('defaults to empty string when no defaultValue provided', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.defaultValue).toBe('');
    expect(domain.validate(domain.defaultValue)).toBe(false);
  });

  it('accepts an explicit defaultValue', () => {
    const domain = referenceDomain({
      color: 'indigo',
      source: flatSource,
      defaultValue: 'rock',
    });
    expect(domain.defaultValue).toBe('rock');
    expect(domain.validate(domain.defaultValue)).toBe(true);
  });

  it('validates any non-empty string as true', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.validate('rock')).toBe(true);
    expect(domain.validate('unknown-id')).toBe(true);
    expect(domain.validate('literally anything')).toBe(true);
  });

  it('rejects empty string', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.validate('')).toBe(false);
  });

  it('displays the raw value when no cache entry exists', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.display('rock')).toBe('rock');
    expect(domain.display('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    );
  });

  it('displays cached label when display cache is populated', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    const cache = domain.meta?.displayCache as Map<string, string>;
    cache.set('rock', 'Rock');
    expect(domain.display('rock')).toBe('Rock');
  });

  it('displays keyword label over cached value', () => {
    const domain = referenceDomain({
      color: 'indigo',
      source: flatSource,
      keywords: [{ label: 'none', value: 'none' }],
    });
    const cache = domain.meta?.displayCache as Map<string, string>;
    cache.set('none', 'No Priority');
    // Keyword label wins
    expect(domain.display('none')).toBe('none');
  });

  it('stores placeholder text', () => {
    const domain = referenceDomain({
      color: 'indigo',
      source: flatSource,
      placeholder: 'a priority',
    });
    expect(domain.placeholder).toBe('a priority');
  });

  it('stores source in meta', () => {
    const domain = referenceDomain({
      color: 'indigo',
      source: hierarchicalSource,
    });
    expect(domain.meta?.source).toBe(hierarchicalSource);
  });

  it('stores display cache in meta', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.meta?.displayCache).toBeInstanceOf(Map);
  });

  it('has no expression modes', () => {
    const domain = referenceDomain({ color: 'indigo', source: flatSource });
    expect(domain.expressionModes).toEqual([]);
  });

  it('passes through keyword shortcuts', () => {
    const keywords = [
      { label: 'any', value: 'any' },
      { label: 'none', value: 'none' },
    ];
    const domain = referenceDomain({
      color: 'indigo',
      source: flatSource,
      keywords,
    });
    expect(domain.keywords).toBe(keywords);
  });

  it('passes through optional context fields', () => {
    const onChange = () => ({ keywords: [] });
    const domain = referenceDomain({
      color: 'indigo',
      source: flatSource,
      consumes: ['org'],
      produces: ['priority'],
      onContextChange: onChange,
    });
    expect(domain.consumes).toEqual(['org']);
    expect(domain.produces).toEqual(['priority']);
    expect(domain.onContextChange).toBe(onChange);
  });
});
