/**
 * useKeyboardNavigation — shared keyboard navigation for popup option lists.
 *
 * Manages active-descendant index tracking, arrow/Home/End navigation,
 * Enter/Escape delegation, and mouse hover sync. Used by all popup types.
 *
 * Uses aria-activedescendant pattern (not roving tabindex) so that
 * DOM focus can remain on an input element while arrows navigate options.
 */

import { useCallback, useEffect, useState } from 'react';

export interface KeyboardNavigationOptions {
  /** Total number of navigable options */
  itemCount: number;
  /** Called when the user presses Enter on the active item */
  onSelect: (index: number) => void;
  /** Called when the user presses Escape */
  onClose: () => void;
  /** Initial active index (-1 = nothing active) */
  initialIndex?: number;
  /** Does selecting an item close the popup? (default true) */
  closeOnSelect?: boolean;
  /** Unique prefix for generating option IDs */
  idPrefix?: string;
}

export interface KeyboardNavigationResult {
  /** Currently highlighted option index (-1 = none) */
  activeIndex: number;
  /**
   * How the current highlight was set. Consumers that mix an option list
   * with a text input (KOE) use this to let hover highlights lose to
   * typed-text submission on Enter — only arrow-key highlights signal
   * "I mean that option."
   */
  activeSource: 'init' | 'keyboard' | 'mouse';
  /** Set active index imperatively (e.g., on mouse hover) */
  setActiveIndex: (index: number) => void;
  /** Attach to the popup container's onKeyDown */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Generate props for each option element */
  getOptionProps: (index: number) => {
    id: string;
    role: 'option';
    'aria-selected': boolean;
    className: string;
    onMouseEnter: () => void;
    onClick: () => void;
  };
  /** The ID of the currently active option (for aria-activedescendant) */
  activeDescendantId: string | undefined;
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onClose,
  initialIndex = -1,
  closeOnSelect = true,
  idPrefix = 'chipper-option',
}: KeyboardNavigationOptions): KeyboardNavigationResult {
  const [activeIndex, setActiveIndexState] = useState(initialIndex);
  const [activeSource, setActiveSource] = useState<'init' | 'keyboard' | 'mouse'>('init');

  const setActiveIndex = useCallback((index: number) => {
    setActiveIndexState(index);
    setActiveSource('init');
  }, []);

  // Clamp activeIndex when itemCount shrinks (e.g., drill in reference,
  // trigger pill toggle in KOE, search results update)
  useEffect(() => {
    if (itemCount === 0) {
      setActiveIndex(-1);
    } else if (activeIndex >= itemCount) {
      setActiveIndex(itemCount - 1);
    }
  }, [itemCount, activeIndex]);

  const getOptionId = useCallback(
    (index: number) => `${idPrefix}-${index}`,
    [idPrefix],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (itemCount === 0) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight': {
          event.preventDefault();
          setActiveIndexState((prev) =>
            prev < itemCount - 1 ? prev + 1 : 0,
          );
          setActiveSource('keyboard');
          break;
        }
        case 'ArrowUp':
        case 'ArrowLeft': {
          event.preventDefault();
          setActiveIndexState((prev) =>
            prev > 0 ? prev - 1 : itemCount - 1,
          );
          setActiveSource('keyboard');
          break;
        }
        case 'Home': {
          event.preventDefault();
          setActiveIndexState(0);
          setActiveSource('keyboard');
          break;
        }
        case 'End': {
          event.preventDefault();
          setActiveIndexState(itemCount - 1);
          setActiveSource('keyboard');
          break;
        }
        case 'Enter': {
          if (activeIndex >= 0 && activeIndex < itemCount) {
            event.preventDefault();
            onSelect(activeIndex);
            if (closeOnSelect) onClose();
          }
          break;
        }
        case ' ': {
          // Space toggles in multi-select (closeOnSelect = false)
          if (!closeOnSelect && activeIndex >= 0 && activeIndex < itemCount) {
            event.preventDefault();
            onSelect(activeIndex);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          onClose();
          break;
        }
      }
    },
    [itemCount, activeIndex, onSelect, onClose, closeOnSelect],
  );

  const getOptionProps = useCallback(
    (index: number) => ({
      id: getOptionId(index),
      role: 'option' as const,
      'aria-selected': index === activeIndex,
      className: [
        'chipper-popup-option',
        index === activeIndex && 'chipper-popup-option--active',
      ].filter(Boolean).join(' '),
      onMouseEnter: () => {
        setActiveIndexState(index);
        setActiveSource('mouse');
      },
      onClick: () => {
        onSelect(index);
        if (closeOnSelect) onClose();
      },
    }),
    [getOptionId, activeIndex, onSelect, onClose, closeOnSelect],
  );

  const activeDescendantId =
    activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return {
    activeIndex,
    activeSource,
    setActiveIndex,
    handleKeyDown,
    getOptionProps,
    activeDescendantId,
  };
}
