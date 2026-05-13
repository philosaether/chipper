/**
 * Tests for AlternativeCoordinatePopup component.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AlternativeCoordinatePopup } from '../../src/components/popups/AlternativeCoordinatePopup';
import type { AlternativeCoordinateMode } from '../../src/domains/alternative-coordinate';

afterEach(cleanup);

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
    placeholder: 'day of month',
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
        { label: 'last', value: 'last' },
      ],
    },
    {
      keywords: [
        { label: 'Mon', value: 'monday' },
        { label: 'Wed', value: 'wednesday' },
      ],
    },
  ],
  compose: (ordinal, day) => `${ordinal} ${day}`,
  decompose: (v) => {
    const parts = v.split(' ');
    return parts.length === 2 ? parts : [undefined, undefined];
  },
};

const modes = [dateMode, weekdayMode];

function renderPopup(overrides: Partial<Parameters<typeof AlternativeCoordinatePopup>[0]> = {}) {
  const defaults = {
    modes,
    value: '',
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<AlternativeCoordinatePopup {...props} />);
  return props;
}

describe('AlternativeCoordinatePopup', () => {
  // -- tabs --

  it('renders tabs for each mode', () => {
    renderPopup();
    expect(screen.getByText('Date')).toBeDefined();
    expect(screen.getByText('Weekday')).toBeDefined();
  });

  it('starts on the first tab by default', () => {
    renderPopup();
    const dateTab = screen.getByText('Date');
    expect(dateTab.getAttribute('aria-selected')).toBe('true');
  });

  it('starts on the matching tab when value matches', () => {
    renderPopup({ value: '15' });
    const dateTab = screen.getByText('Date');
    expect(dateTab.getAttribute('aria-selected')).toBe('true');
  });

  it('starts on weekday tab when value matches multi-slot decompose', () => {
    renderPopup({ value: 'first monday' });
    const weekdayTab = screen.getByText('Weekday');
    expect(weekdayTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches tab content on click', () => {
    renderPopup();
    // Initially showing date mode keywords
    expect(screen.getByText('1st')).toBeDefined();

    // Switch to weekday
    fireEvent.click(screen.getByText('Weekday'));
    expect(screen.getByText('first')).toBeDefined();
    expect(screen.getByText('Mon')).toBeDefined();
  });

  // -- single-slot mode (date) --

  it('renders slot prefix text', () => {
    renderPopup();
    expect(screen.getByText('the')).toBeDefined();
  });

  it('selects keyword and closes on single-slot mode', () => {
    const props = renderPopup();
    fireEvent.click(screen.getByText('15th'));
    expect(props.onSelect).toHaveBeenCalledWith('15');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('highlights selected keyword', () => {
    renderPopup({ value: '15' });
    const button = screen.getByText('15th');
    expect(button.getAttribute('aria-selected')).toBe('true');
  });

  // -- multi-slot mode (weekday) --

  it('stays open after first slot selection in multi-slot mode', () => {
    const props = renderPopup();
    fireEvent.click(screen.getByText('Weekday'));
    fireEvent.click(screen.getByText('first'));
    // Only one slot filled — should not close
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('composes and closes after all slots filled', () => {
    const props = renderPopup();
    fireEvent.click(screen.getByText('Weekday'));
    fireEvent.click(screen.getByText('first'));
    fireEvent.click(screen.getByText('Mon'));
    expect(props.onSelect).toHaveBeenCalledWith('first monday');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('highlights decomposed slot selections for existing value', () => {
    renderPopup({ value: 'first monday' });
    // Should be on weekday tab with both slots highlighted
    const firstButton = screen.getByText('first');
    const monButton = screen.getByText('Mon');
    expect(firstButton.getAttribute('aria-selected')).toBe('true');
    expect(monButton.getAttribute('aria-selected')).toBe('true');
  });

  // -- expression input --

  it('renders expression input when mode has expression config', () => {
    renderPopup();
    const input = screen.getByPlaceholderText('day of month');
    expect(input).toBeDefined();
  });

  it('does not render expression input for modes without expression', () => {
    renderPopup();
    fireEvent.click(screen.getByText('Weekday'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('submits expression on Enter and closes', () => {
    const props = renderPopup();
    const input = screen.getByPlaceholderText('day of month');
    fireEvent.change(input, { target: { value: '23' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith('23');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('does not submit invalid expression', () => {
    const props = renderPopup();
    const input = screen.getByPlaceholderText('day of month');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
