/**
 * Tests for KeywordGroupList component.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { KeywordGroupList } from '../../src/components/popups/KeywordGroupList';
import type { NormalizedKeywordGroup } from '../../src/domains/normalize-keywords';

afterEach(cleanup);

function mockGetOptionProps(index: number) {
  return {
    id: `option-${index}`,
    role: 'option',
    className: 'chipper-popup-option',
  };
}

describe('KeywordGroupList', () => {
  it('renders a single flow group', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      {
        layout: 'flow',
        keywords: [
          { label: 'Mon', value: 'mon' },
          { label: 'Tue', value: 'tue' },
        ],
      },
    ];
    render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
      />,
    );

    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Tue')).toBeDefined();
  });

  it('renders group labels', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      {
        label: 'shortcuts',
        layout: 'flow',
        keywords: [{ label: '1st', value: '1' }],
      },
      {
        label: 'all dates',
        layout: 'grid',
        columns: 7,
        keywords: [{ label: '1', value: '1' }, { label: '2', value: '2' }],
      },
    ];
    render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
      />,
    );

    expect(screen.getByText('shortcuts')).toBeDefined();
    expect(screen.getByText('all dates')).toBeDefined();
  });

  it('renders group prefix', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      {
        prefix: 'the',
        layout: 'flow',
        keywords: [{ label: 'first', value: 'first' }],
      },
    ];
    render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
      />,
    );

    expect(screen.getByText('the')).toBeDefined();
    expect(screen.getByText('first')).toBeDefined();
  });

  it('renders separator between groups (not before first)', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      { layout: 'flow', keywords: [{ label: 'A', value: 'a' }] },
      { layout: 'flow', keywords: [{ label: 'B', value: 'b' }] },
      { layout: 'flow', keywords: [{ label: 'C', value: 'c' }] },
    ];
    const { container } = render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
      />,
    );

    const separators = container.querySelectorAll('.chipper-keyword-group__separator');
    expect(separators).toHaveLength(2); // between groups, not before first
  });

  it('applies grid layout class and columns', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      {
        layout: 'grid',
        columns: 4,
        keywords: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
        ],
      },
    ];
    const { container } = render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
      />,
    );

    const gridItems = container.querySelector('.chipper-keyword-group__items--grid');
    expect(gridItems).toBeDefined();
    expect(gridItems?.style.getPropertyValue('--chipper-group-columns')).toBe('4');
  });

  it('passes correct flat index to getOptionProps across groups', () => {
    const getOptionProps = vi.fn(mockGetOptionProps);
    const groups: NormalizedKeywordGroup<string>[] = [
      { layout: 'flow', keywords: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
      { layout: 'flow', keywords: [{ label: 'C', value: 'c' }] },
    ];
    render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={getOptionProps}
      />,
    );

    // Group 1: indices 0, 1. Group 2: index 2.
    expect(getOptionProps).toHaveBeenCalledWith(0);
    expect(getOptionProps).toHaveBeenCalledWith(1);
    expect(getOptionProps).toHaveBeenCalledWith(2);
  });

  it('applies selected state via isSelected', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      { layout: 'flow', keywords: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
    ];
    const { container } = render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
        isSelected={(kw) => kw.value === 'b'}
      />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]!.classList.contains('chipper-popup-option--selected')).toBe(false);
    expect(buttons[1]!.classList.contains('chipper-popup-option--selected')).toBe(true);
  });

  it('applies disabled state via isDisabled', () => {
    const groups: NormalizedKeywordGroup<string>[] = [
      { layout: 'flow', keywords: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
    ];
    const { container } = render(
      <KeywordGroupList
        groups={groups}
        getOptionProps={mockGetOptionProps}
        isDisabled={(kw) => kw.value === 'a'}
      />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]!.disabled).toBe(true);
    expect(buttons[1]!.disabled).toBe(false);
  });
});
