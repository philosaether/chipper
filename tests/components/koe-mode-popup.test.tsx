/**
 * Tests for KeywordOrExpressionPopup mode-switching layout.
 *
 * Three cases: always-on expression, trigger-gated keyword mode,
 * trigger-gated expression mode.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KeywordOrExpressionPopup } from '../../src/components/popups/KeywordOrExpressionPopup';
import { TRIGGER_SENTINEL } from '../../src/core/mode-switching';
import type { ExpressionMode, Keyword } from '../../src/core/types';

afterEach(cleanup);

const cadenceKeywords: Keyword<string>[] = [
  { label: 'day', value: 'daily' },
  { label: 'week on...', value: 'weekly' },
  { label: 'weekday', value: 'weekday' },
];

const numericExpression: ExpressionMode<string> = {
  id: 'number',
  label: 'custom interval',
  degreesOfFreedom: 1,
  validate: (v) => { const n = Number(v); return !isNaN(n) && isFinite(n); },
  display: (v) => v,
  inputType: 'number',
  min: 2,
  max: 365,
  step: 1,
};

const textExpression: ExpressionMode<string> = {
  id: 'text',
  label: 'custom surface',
  degreesOfFreedom: 1,
  validate: (v) => v.length > 0,
  display: (v) => v,
  inputType: 'text',
};

function renderPopup(overrides: Partial<Parameters<typeof KeywordOrExpressionPopup>[0]> = {}) {
  const defaults = {
    keywords: cadenceKeywords,
    value: 'weekly',
    expressionMode: numericExpression,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<KeywordOrExpressionPopup {...props} />);
  return props;
}

// -- Always-on expression (no trigger) ---------------------------------------

describe('KOE popup — always-on expression (no trigger)', () => {
  it('shows keywords and expression input simultaneously', () => {
    renderPopup();
    expect(screen.getByText('day')).toBeDefined();
    expect(screen.getByText('week on...')).toBeDefined();
    expect(screen.getByLabelText('Numeric value')).toBeDefined();
  });

  it('does not show a trigger pill', () => {
    renderPopup();
    expect(screen.queryByText('custom interval')).toBeNull();
  });

  it('highlights selected keyword', () => {
    renderPopup({ value: 'weekly' });
    const weekButton = screen.getByText('week on...');
    expect(weekButton.className).toContain('--selected');
  });
});

// -- Trigger-gated, keyword mode ---------------------------------------------

describe('KOE popup — trigger-gated, keyword mode', () => {
  const triggerProps = {
    triggerLabel: 'custom interval',
    expressionActive: false,
  };

  it('shows keywords and trigger pill', () => {
    renderPopup(triggerProps);
    expect(screen.getByText('day')).toBeDefined();
    expect(screen.getByText('week on...')).toBeDefined();
    expect(screen.getByText('custom interval')).toBeDefined();
  });

  it('does not show expression input', () => {
    renderPopup(triggerProps);
    expect(screen.queryByLabelText('Numeric value')).toBeNull();
  });

  it('highlights selected keyword', () => {
    renderPopup({ ...triggerProps, value: 'weekly' });
    const weekButton = screen.getByText('week on...');
    expect(weekButton.className).toContain('--selected');
  });

  it('dispatches TRIGGER_SENTINEL on trigger pill click', () => {
    const props = renderPopup(triggerProps);
    fireEvent.click(screen.getByText('custom interval'));
    expect(props.onSelect).toHaveBeenCalledWith(TRIGGER_SENTINEL);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('dispatches keyword value on keyword click', () => {
    const props = renderPopup(triggerProps);
    fireEvent.click(screen.getByText('day'));
    expect(props.onSelect).toHaveBeenCalledWith('daily');
    expect(props.onClose).toHaveBeenCalled();
  });
});

// -- Trigger-gated, expression mode ------------------------------------------

describe('KOE popup — trigger-gated, expression mode', () => {
  const expressionProps = {
    triggerLabel: 'custom interval',
    expressionActive: true,
    value: '2',
  };

  it('shows keywords as escape hatches', () => {
    renderPopup(expressionProps);
    expect(screen.getByText('day')).toBeDefined();
    expect(screen.getByText('week on...')).toBeDefined();
  });

  it('shows expression input', () => {
    renderPopup(expressionProps);
    expect(screen.getByLabelText('Numeric value')).toBeDefined();
  });

  it('hides the trigger pill', () => {
    renderPopup(expressionProps);
    // "custom interval" is the triggerLabel — should not appear as a pill
    // (the stepper label also says "custom interval" but it's the expressionMode.label,
    // not a button. Check specifically for a button with that text.)
    const buttons = screen.getAllByRole('option');
    const triggerButton = buttons.find((b) => b.textContent === 'custom interval');
    expect(triggerButton).toBeUndefined();
  });

  it('does not highlight any keyword when in expression mode', () => {
    // Even if value matches a keyword, expression mode suppresses --selected
    renderPopup({ ...expressionProps, value: 'weekly' });
    const weekButton = screen.getByText('week on...');
    expect(weekButton.className).not.toContain('--selected');
  });

  it('dispatches keyword value on escape-hatch click', () => {
    const props = renderPopup(expressionProps);
    fireEvent.click(screen.getByText('day'));
    expect(props.onSelect).toHaveBeenCalledWith('daily');
    expect(props.onClose).toHaveBeenCalled();
  });
});

// -- Text expression with trigger --------------------------------------------

describe('KOE popup — text expression with trigger', () => {
  const textTriggerKeywordMode = {
    keywords: [
      { label: 'floor', value: 'floor' },
      { label: 'counter', value: 'counter' },
    ] as Keyword<string>[],
    expressionMode: textExpression,
    triggerLabel: 'other...',
    expressionActive: false,
    value: 'floor',
  };

  it('shows keywords and trigger pill in keyword mode', () => {
    renderPopup(textTriggerKeywordMode);
    expect(screen.getByText('floor')).toBeDefined();
    expect(screen.getByText('counter')).toBeDefined();
    expect(screen.getByText('other...')).toBeDefined();
    expect(screen.queryByPlaceholderText('custom surface')).toBeNull();
  });

  it('shows text input in expression mode', () => {
    renderPopup({ ...textTriggerKeywordMode, expressionActive: true, value: '' });
    expect(screen.getByPlaceholderText('custom surface')).toBeDefined();
    expect(screen.queryByText('other...')).toBeNull();
  });

  it('submits text expression on Enter', () => {
    const props = renderPopup({ ...textTriggerKeywordMode, expressionActive: true, value: '' });
    const input = screen.getByPlaceholderText('custom surface');
    fireEvent.change(input, { target: { value: 'bathtub' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.onSelect).toHaveBeenCalledWith('bathtub');
    expect(props.onClose).toHaveBeenCalled();
  });
});
