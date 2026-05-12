/**
 * Tests for KeywordOrExpressionPopup component.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KeywordOrExpressionPopup } from '../../src/components/popups/KeywordOrExpressionPopup';
import type { ExpressionMode, Keyword } from '../../src/core/types';

afterEach(cleanup);

const timeKeywords: Keyword<string>[] = [
  { label: 'morning', value: '09:00' },
  { label: 'afternoon', value: '12:00' },
  { label: 'evening', value: '17:00' },
];

const expressionMode: ExpressionMode<string> = {
  id: 'text',
  label: 'a specific time',
  degreesOfFreedom: 1,
  validate: (v) => v.length > 0,
  display: (v) => v,
};

function renderPopup(overrides: Partial<Parameters<typeof KeywordOrExpressionPopup>[0]> = {}) {
  const defaults = {
    keywords: timeKeywords,
    value: '',
    expressionMode,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<KeywordOrExpressionPopup {...props} />);
  return props;
}

describe('KeywordOrExpressionPopup', () => {
  it('renders input field', () => {
    renderPopup();
    const input = screen.getByPlaceholderText('a specific time');
    expect(input).toBeDefined();
  });

  it('renders keyword pills when keywords present', () => {
    renderPopup();
    expect(screen.getByText('morning')).toBeDefined();
    expect(screen.getByText('afternoon')).toBeDefined();
    expect(screen.getByText('evening')).toBeDefined();
  });

  it('renders no keyword section when keywords empty', () => {
    renderPopup({ keywords: [] });
    expect(screen.queryByText('morning')).toBeNull();
    // Input should still be present
    expect(screen.getByPlaceholderText('a specific time')).toBeDefined();
  });

  it('selects keyword on click', () => {
    const props = renderPopup();
    fireEvent.click(screen.getByText('morning'));
    expect(props.onSelect).toHaveBeenCalledWith('09:00');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('submits expression on Enter', () => {
    const props = renderPopup();
    const input = screen.getByPlaceholderText('a specific time');
    fireEvent.change(input, { target: { value: '14:30' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith('14:30');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('does not submit empty expression on Enter', () => {
    const props = renderPopup();
    const input = screen.getByPlaceholderText('a specific time');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('does not submit invalid expression on Enter', () => {
    const strictMode: ExpressionMode<string> = {
      ...expressionMode,
      validate: (v) => /^\d{2}:\d{2}$/.test(v),
    };
    const props = renderPopup({ expressionMode: strictMode });
    const input = screen.getByPlaceholderText('a specific time');
    fireEvent.change(input, { target: { value: 'not valid' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('pre-fills input with current value if not a keyword', () => {
    renderPopup({ value: '14:30' });
    const input = screen.getByPlaceholderText('a specific time') as HTMLInputElement;
    expect(input.value).toBe('14:30');
  });

  it('clears input if current value is a keyword', () => {
    renderPopup({ value: '09:00' });
    const input = screen.getByPlaceholderText('a specific time') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('marks selected keyword with selected class', () => {
    renderPopup({ value: '09:00' });
    const morningButton = screen.getByText('morning');
    expect(morningButton.className).toContain('--selected');
  });

  it('trims whitespace from expression before submitting', () => {
    const props = renderPopup();
    const input = screen.getByPlaceholderText('a specific time');
    fireEvent.change(input, { target: { value: '  14:30  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith('14:30');
  });
});
