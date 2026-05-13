/**
 * Tests for NumericInput component.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NumericInput } from '../../src/components/popups/NumericInput';

afterEach(cleanup);

function renderInput(overrides: Partial<Parameters<typeof NumericInput>[0]> = {}) {
  const defaults = {
    value: '5',
    onSelect: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<NumericInput {...props} />);
  return props;
}

describe('NumericInput', () => {
  it('renders current value', () => {
    renderInput({ value: '5' });
    const input = screen.getByLabelText('Numeric value') as HTMLInputElement;
    expect(input.value).toBe('5');
  });

  it('increments on + click', () => {
    const props = renderInput({ value: '5' });
    fireEvent.click(screen.getByLabelText('Increase'));
    expect(props.onSelect).toHaveBeenCalledWith('6');
  });

  it('decrements on − click', () => {
    const props = renderInput({ value: '5' });
    fireEvent.click(screen.getByLabelText('Decrease'));
    expect(props.onSelect).toHaveBeenCalledWith('4');
  });

  it('respects step size', () => {
    const props = renderInput({ value: '10', step: 5 });
    fireEvent.click(screen.getByLabelText('Increase'));
    expect(props.onSelect).toHaveBeenCalledWith('15');
  });

  it('disables decrement at min', () => {
    renderInput({ value: '1', min: 1 });
    const button = screen.getByLabelText('Decrease');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('disables increment at max', () => {
    renderInput({ value: '10', max: 10 });
    const button = screen.getByLabelText('Increase');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('allows manual input', () => {
    const props = renderInput({ value: '5' });
    const input = screen.getByLabelText('Numeric value');
    fireEvent.change(input, { target: { value: '42' } });
    expect(props.onSelect).toHaveBeenCalledWith('42');
  });

  it('ignores non-numeric manual input', () => {
    const props = renderInput({ value: '5' });
    const input = screen.getByLabelText('Numeric value');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
