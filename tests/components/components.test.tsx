/**
 * Tests for interactive components: Chipper, Sentence, Clause, Chip, ChipPopup.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Chipper } from '../../src/components/Chipper';
import { sentence, builder } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { keywordDomain } from '../../src/domains/facades';
import { monthKeywords } from '../fixtures/month-keywords';
import type { SentenceDefinition } from '../../src/core/types';

const palette = extendPalette({
  chips: {
    month: keywordDomain({
      color: 'month',
      keywords: monthKeywords,
      default: '',
      placeholder: 'a month',
    }),
  },
});

afterEach(cleanup);

const definition: SentenceDefinition = sentence(palette)
  .clause('when', builder().required().text('Wake me up when').chip('month', 'month').text('ends.'))
  .build();

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Chipper auto-render', () => {
  it('renders sentence with clause lead text', () => {
    render(<Chipper sentence={definition} />);

    expect(screen.getByText('Wake me up when')).toBeDefined();
    expect(screen.getByText('ends.')).toBeDefined();
    // Both text segments rendered in the same clause
    const clauses = document.querySelectorAll('.chipper-clause');
    expect(clauses.length).toBe(1);
  });

  it('renders chip trigger with placeholder', () => {
    render(<Chipper sentence={definition} />);

    const trigger = screen.getByRole('button', { name: 'a month' });
    expect(trigger).toBeDefined();
    expect(trigger.className).toContain('chipper-chip-trigger--placeholder');
  });

  it('sets aria-expanded to false initially', () => {
    render(<Chipper sentence={definition} />);

    const trigger = screen.getByRole('button', { name: 'a month' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders custom children instead of auto-render when provided', () => {
    render(
      <Chipper sentence={definition}>
        <div data-testid="custom">Custom layout</div>
      </Chipper>,
    );

    expect(screen.getByTestId('custom')).toBeDefined();
    expect(screen.queryByText('Wake me up when')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Popup interaction
// ---------------------------------------------------------------------------

describe('Chip popup', () => {
  it('opens popup on click', () => {
    render(<Chipper sentence={definition} />);

    const trigger = screen.getByRole('button', { name: 'a month' });
    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox')).toBeDefined();
  });

  it('shows keyword options in popup', () => {
    render(<Chipper sentence={definition} />);

    fireEvent.click(screen.getByRole('button', { name: 'a month' }));

    expect(screen.getByRole('option', { name: 'January' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'February' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'September' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'December' })).toBeDefined();
  });

  it('selects a keyword and closes popup', () => {
    render(<Chipper sentence={definition} />);

    fireEvent.click(screen.getByRole('button', { name: 'a month' }));
    fireEvent.click(screen.getByRole('option', { name: 'September' }));

    // Popup should be closed
    expect(screen.queryByRole('listbox')).toBeNull();

    // Trigger should show selected value
    const trigger = screen.getByRole('button', { name: 'September' });
    expect(trigger).toBeDefined();
    expect(trigger.className).not.toContain('chipper-chip-trigger--placeholder');
  });

  it('closes popup on Escape', () => {
    render(<Chipper sentence={definition} />);

    fireEvent.click(screen.getByRole('button', { name: 'a month' }));
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('toggles popup on second click', () => {
    render(<Chipper sentence={definition} />);

    const trigger = screen.getByRole('button', { name: 'a month' });

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('highlights selected option', () => {
    render(<Chipper sentence={definition} />);

    // Select September
    fireEvent.click(screen.getByRole('button', { name: 'a month' }));
    fireEvent.click(screen.getByRole('option', { name: 'September' }));

    // Reopen and check
    fireEvent.click(screen.getByRole('button', { name: 'September' }));
    const option = screen.getByRole('option', { name: 'September' });
    expect(option.getAttribute('aria-selected')).toBe('true');
    expect(option.className).toContain('chipper-popup-option--selected');
  });
});

// ---------------------------------------------------------------------------
// onChange
// ---------------------------------------------------------------------------

describe('Chipper onChange', () => {
  it('fires onChange when a value is selected', () => {
    const onChange = vi.fn();
    render(<Chipper sentence={definition} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'a month' }));
    fireEvent.click(screen.getByRole('option', { name: 'September' }));

    // Initial render + selection
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastState = onChange.mock.calls[onChange.mock.calls.length - 1]![0]!;
    expect(lastState.clauses['when']!.chips['month']!.value).toBe('september');
    expect(lastState.valid).toBe(true);
  });
});
