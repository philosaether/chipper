/**
 * Tests for React hooks: useSentence, useChip, usePopup, SentenceProvider.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SentenceProvider } from '../../src/hooks/SentenceProvider';
import { useSentence } from '../../src/hooks/useSentence';
import { useChip } from '../../src/hooks/useChip';
import { usePopup } from '../../src/hooks/usePopup';
import { sentence, clause } from '../../src/builder';
import { extendPalette } from '../../src/palette';
import { enumDomain } from '../../src/domains/enum';
import { monthKeywords } from '../fixtures/month-keywords';
import type { SentenceDefinition } from '../../src/core/types';

const palette = extendPalette({
  chips: {
    month: enumDomain({
      color: 'month',
      keywords: monthKeywords,
      default: '',
      placeholder: 'a month',
    }),
  },
});

const definition: SentenceDefinition = sentence(palette)
  .clause('when', clause().required().text('Wake me up when').chip('month', 'month').text('ends.'))
  .build();

function createWrapper(def: SentenceDefinition = definition, onChange?: (state: unknown) => void) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SentenceProvider definition={def} onChange={onChange}>
        {children}
      </SentenceProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// useSentence
// ---------------------------------------------------------------------------

describe('useSentence', () => {
  it('provides sentence state from context', () => {
    const { result } = renderHook(() => useSentence(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toBeDefined();
    expect(result.current.dispatch).toBeTypeOf('function');
    expect(result.current.definition).toBe(definition);
    expect(result.current.domains).toBeDefined();
  });

  it('throws when used outside a SentenceProvider', () => {
    expect(() => {
      renderHook(() => useSentence());
    }).toThrow('useSentence must be used within a <SentenceProvider>');
  });

  it('exposes resolved domains keyed by chip ID', () => {
    const { result } = renderHook(() => useSentence(), {
      wrapper: createWrapper(),
    });

    expect(result.current.domains['month']).toBeDefined();
    expect(result.current.domains['month']!.type).toBe('enum');
  });

  it('initializes with correct clause state', () => {
    const { result } = renderHook(() => useSentence(), {
      wrapper: createWrapper(),
    });

    const whenClause = result.current.state.clauses['when'];
    expect(whenClause).toBeDefined();
    expect(whenClause!.active).toBe(true);
    expect(whenClause!.chips['month']).toBeDefined();
    expect(whenClause!.chips['month']!.valid).toBe(false);
    expect(whenClause!.chips['month']!.displayValue).toBe('a month');
  });
});

// ---------------------------------------------------------------------------
// useChip
// ---------------------------------------------------------------------------

describe('useChip', () => {
  it('returns chip state and domain', () => {
    const { result } = renderHook(() => useChip('when', 'month'), {
      wrapper: createWrapper(),
    });

    expect(result.current.value).toBe('');
    expect(result.current.displayValue).toBe('a month');
    expect(result.current.valid).toBe(false);
    expect(result.current.dirty).toBe(false);
    expect(result.current.domain.type).toBe('enum');
    expect(result.current.chipDefinition.id).toBe('month');
    expect(result.current.setValue).toBeTypeOf('function');
  });

  it('setValue dispatches SET_CHIP_VALUE and updates state', () => {
    const { result } = renderHook(() => useChip('when', 'month'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setValue('september');
    });

    expect(result.current.value).toBe('september');
    expect(result.current.displayValue).toBe('September');
    expect(result.current.valid).toBe(true);
    expect(result.current.dirty).toBe(true);
  });

  it('throws for nonexistent chip', () => {
    expect(() => {
      renderHook(() => useChip('when', 'nonexistent'), {
        wrapper: createWrapper(),
      });
    }).toThrow('Chip "nonexistent" not found in clause "when"');
  });

  it('throws for nonexistent clause', () => {
    expect(() => {
      renderHook(() => useChip('nonexistent', 'month'), {
        wrapper: createWrapper(),
      });
    }).toThrow('Chip "month" not found in clause "nonexistent"');
  });
});

// ---------------------------------------------------------------------------
// usePopup
// ---------------------------------------------------------------------------

describe('usePopup', () => {
  it('starts with no popup open', () => {
    const { result } = renderHook(() => usePopup(), {
      wrapper: createWrapper(),
    });

    expect(result.current.popup.chipId).toBeNull();
    expect(result.current.popup.clauseId).toBeNull();
    expect(result.current.popup.anchorElement).toBeNull();
  });

  it('opens a popup for a chip', () => {
    const { result } = renderHook(() => usePopup(), {
      wrapper: createWrapper(),
    });

    const anchor = document.createElement('button');

    act(() => {
      result.current.open('when', 'month', anchor);
    });

    expect(result.current.popup.chipId).toBe('month');
    expect(result.current.popup.clauseId).toBe('when');
    expect(result.current.popup.anchorElement).toBe(anchor);
    expect(result.current.isOpen('month')).toBe(true);
  });

  it('closes the popup', () => {
    const { result } = renderHook(() => usePopup(), {
      wrapper: createWrapper(),
    });

    const anchor = document.createElement('button');

    act(() => {
      result.current.open('when', 'month', anchor);
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.popup.chipId).toBeNull();
    expect(result.current.isOpen('month')).toBe(false);
  });

  it('opening a different chip closes the previous one (singleton)', () => {
    const secondPalette = extendPalette({
      chips: {
        month: enumDomain({
          color: 'month',
          keywords: monthKeywords,
          default: '',
          placeholder: 'a month',
        }),
        year: enumDomain({
          color: 'year',
          keywords: [{ label: '2026', value: '2026' }],
        }),
      },
    });

    const twochipDef = sentence(secondPalette)
      .clause('when', clause().required().text('In').chip('month', 'month').chip('year', 'year'))
      .build();

    const { result } = renderHook(() => usePopup(), {
      wrapper: createWrapper(twochipDef),
    });

    const anchor1 = document.createElement('button');
    const anchor2 = document.createElement('button');

    act(() => {
      result.current.open('when', 'month', anchor1);
    });

    expect(result.current.isOpen('month')).toBe(true);

    act(() => {
      result.current.open('when', 'year', anchor2);
    });

    expect(result.current.isOpen('month')).toBe(false);
    expect(result.current.isOpen('year')).toBe(true);
  });

  it('throws when used outside a SentenceProvider', () => {
    expect(() => {
      renderHook(() => usePopup());
    }).toThrow('usePopup must be used within a <SentenceProvider>');
  });
});

// ---------------------------------------------------------------------------
// SentenceProvider onChange
// ---------------------------------------------------------------------------

describe('SentenceProvider onChange', () => {
  it('fires onChange on initial render', () => {
    const onChange = vi.fn();

    renderHook(() => useSentence(), {
      wrapper: createWrapper(definition, onChange),
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]!.clauses).toBeDefined();
  });

  it('fires onChange when chip value changes', () => {
    const onChange = vi.fn();

    const { result } = renderHook(() => useChip('when', 'month'), {
      wrapper: createWrapper(definition, onChange),
    });

    act(() => {
      result.current.setValue('september');
    });

    expect(onChange).toHaveBeenCalledTimes(2);
    const lastCall = onChange.mock.calls[1]![0]!;
    expect(lastCall.clauses['when']!.chips['month']!.value).toBe('september');
  });
});
