/**
 * Tests for MultiSelectPopup component.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MultiSelectPopup } from '../../src/components/popups/MultiSelectPopup';
import type { Keyword } from '../../src/core/types';

afterEach(cleanup);

const dayOptions: Keyword<string>[] = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
];

const dayKeywords: Keyword<string[]>[] = [
  { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
];

function renderPopup(overrides: Partial<Parameters<typeof MultiSelectPopup>[0]> = {}) {
  const defaults = {
    options: dayOptions,
    keywords: [] as Keyword<string[]>[],
    value: [] as string[],
    onSelect: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<MultiSelectPopup {...props} />);
  return props;
}

describe('MultiSelectPopup', () => {
  it('renders all options as toggle buttons', () => {
    renderPopup();
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.getByText('Mon')).toBeDefined();
    expect(screen.getByText('Fri')).toBeDefined();
  });

  it('marks selected options with aria-selected', () => {
    renderPopup({ value: ['mon', 'wed'] });
    expect(screen.getByText('Mon').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Wed').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Tue').getAttribute('aria-selected')).toBe('false');
  });

  it('toggles an option on when clicked', () => {
    const props = renderPopup({ value: ['mon'] });
    fireEvent.click(screen.getByText('Wed'));
    expect(props.onSelect).toHaveBeenCalledWith(['mon', 'wed']);
  });

  it('toggles an option off when clicked', () => {
    const props = renderPopup({ value: ['mon', 'wed'] });
    fireEvent.click(screen.getByText('Mon'));
    expect(props.onSelect).toHaveBeenCalledWith(['wed']);
  });

  it('does not close popup on selection (no onClose called)', () => {
    // MultiSelectPopup doesn't receive onClose — it stays open by design.
    // Verify it renders without an onClose prop.
    const props = renderPopup({ value: [] });
    fireEvent.click(screen.getByText('Mon'));
    expect(props.onSelect).toHaveBeenCalledWith(['mon']);
    // Component still renders after click
    expect(screen.getByText('Mon')).toBeDefined();
  });

  it('renders group keywords above the grid', () => {
    renderPopup({ keywords: dayKeywords });
    expect(screen.getByText('weekdays')).toBeDefined();
  });

  it('replaces selection when group keyword is clicked', () => {
    const props = renderPopup({ value: ['mon'], keywords: dayKeywords });
    fireEvent.click(screen.getByText('weekdays'));
    expect(props.onSelect).toHaveBeenCalledWith(['mon', 'tue', 'wed', 'thu', 'fri']);
  });

  it('highlights matching group keyword', () => {
    renderPopup({
      value: ['mon', 'tue', 'wed', 'thu', 'fri'],
      keywords: dayKeywords,
    });
    const weekdaysButton = screen.getByText('weekdays');
    expect(weekdaysButton.getAttribute('aria-selected')).toBe('true');
  });

  it('respects maxSelections', () => {
    const props = renderPopup({ value: ['mon', 'tue'], maxSelections: 2 });
    fireEvent.click(screen.getByText('Wed'));
    // Should not add — already at max
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('disables options at max selections', () => {
    renderPopup({ value: ['mon', 'tue'], maxSelections: 2 });
    const wedButton = screen.getByText('Wed');
    expect(wedButton.hasAttribute('disabled')).toBe(true);
  });

  it('allows deselecting when at max selections', () => {
    const props = renderPopup({ value: ['mon', 'tue'], maxSelections: 2 });
    fireEvent.click(screen.getByText('Mon'));
    expect(props.onSelect).toHaveBeenCalledWith(['tue']);
  });
});
