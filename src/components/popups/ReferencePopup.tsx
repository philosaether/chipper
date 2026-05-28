/**
 * ReferencePopup — navigation/search popup for reference domains.
 *
 * Supports hierarchical tree navigation (breadcrumb + drill-in) and
 * flat list search. Items can be selectable, drillable, or both.
 * Handles sync and async data sources transparently.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Keyword } from '../../core/types';
import { resolveKeywordLabel } from '../../core/resolve-keyword-label';
import type { ReferenceItem, ReferenceSource } from '../../domains/reference';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export interface ReferencePopupProps {
  source: ReferenceSource;
  keywords: Keyword<string>[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** Write-through to the domain's display cache */
  displayCache: Map<string, string>;
}

/** Debounce delay for search input (ms). */
const SEARCH_DEBOUNCE_MS = 300;

export function ReferencePopup({
  source,
  keywords,
  value,
  onSelect,
  onClose,
  displayCache,
}: ReferencePopupProps) {
  const [path, setPath] = useState<ReferenceItem[]>([]);
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReferenceItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fetchGenerationRef = useRef(0);

  // Fetch items at a path, handling sync and async sources.
  // Generation counter discards stale async responses from prior navigations.
  const fetchItems = useCallback(
    (fetchPath: ReferenceItem[]) => {
      const generation = ++fetchGenerationRef.current;
      setLoading(true);
      setError(null);
      try {
        const result = source.getItems(fetchPath);
        if (result instanceof Promise) {
          result
            .then((fetched) => {
              if (generation !== fetchGenerationRef.current) return;
              setItems(fetched);
              setLoading(false);
            })
            .catch((err: unknown) => {
              if (generation !== fetchGenerationRef.current) return;
              setError(err instanceof Error ? err.message : 'Failed to load items');
              setLoading(false);
            });
        } else {
          setItems(result);
          setLoading(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
        setLoading(false);
      }
    },
    [source],
  );

  // Fetch root items on mount
  useEffect(() => {
    fetchItems([]);
  }, [fetchItems]);

  // Drill into a child
  const handleDrill = useCallback(
    (item: ReferenceItem) => {
      const newPath = [...path, item];
      setPath(newPath);
      setSearchQuery('');
      setSearchResults(null);
      fetchItems(newPath);
    },
    [path, fetchItems],
  );

  // Navigate to a breadcrumb level
  const handleBreadcrumbNavigate = useCallback(
    (index: number) => {
      // index -1 = root ("all"), 0 = first path item, etc.
      const newPath = index < 0 ? [] : path.slice(0, index + 1);
      setPath(newPath);
      setSearchQuery('');
      setSearchResults(null);
      fetchItems(newPath);
    },
    [path, fetchItems],
  );

  // Select an item
  const handleSelect = useCallback(
    (item: ReferenceItem) => {
      // Write label to display cache before selecting
      displayCache.set(item.id, item.label);
      onSelect(item.id);
      onClose();
    },
    [onSelect, onClose, displayCache],
  );

  // Search with debounce
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      if (!query.trim() || !source.search) {
        setSearchResults(null);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      searchTimerRef.current = setTimeout(() => {
        try {
          const result = source.search!(query.trim());
          if (result instanceof Promise) {
            result
              .then((results) => {
                setSearchResults(results);
                setSearchLoading(false);
              })
              .catch(() => {
                setSearchResults([]);
                setSearchLoading(false);
              });
          } else {
            setSearchResults(result);
            setSearchLoading(false);
          }
        } catch {
          setSearchResults([]);
          setSearchLoading(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [source],
  );

  // Cleanup search timer
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const isSearching = searchResults !== null;
  const displayItems = isSearching ? searchResults : items;
  const isLoading = isSearching ? searchLoading : loading;

  // Keyboard navigation: keywords + display items in one flat list
  const totalNavItems = keywords.length + (isLoading ? 0 : displayItems.length);
  const keyboard = useKeyboardNavigation({
    itemCount: totalNavItems,
    closeOnSelect: false,
    onSelect: (index) => {
      if (index < keywords.length) {
        onSelect(keywords[index]!.value);
        onClose();
      } else {
        const item = displayItems[index - keywords.length]!;
        const isSelectable = item.selectable !== false;
        const isDrillable = item.hasChildren === true;
        if (isSelectable) {
          handleSelect(item);
        } else if (isDrillable) {
          handleDrill(item);
        }
      }
    },
    onClose,
    idPrefix: 'chipper-ref-option',
  });

  return (
    <div className="chipper-reference-popup">
      {/* Keyword shortcuts */}
      {keywords.length > 0 && (
        <div className="chipper-reference-popup__keywords">
          {keywords.map((keyword, index) => {
            const optionProps = keyboard.getOptionProps(index);
            return (
              <button
                key={keyword.value}
                type="button"
                {...optionProps}
                aria-selected={keyword.value === value}
                className={[
                  optionProps.className,
                  keyword.value === value && 'chipper-popup-option--selected',
                ].filter(Boolean).join(' ')}
              >
                {resolveKeywordLabel(keyword)}
              </button>
            );
          })}
        </div>
      )}

      {/* Breadcrumb trail — hidden during search */}
      {!isSearching && path.length > 0 && (
        <nav className="chipper-reference-popup__breadcrumb">
          <button
            type="button"
            className="chipper-reference-popup__breadcrumb-segment"
            aria-label="all items"
            onClick={() => handleBreadcrumbNavigate(-1)}
          >
            all
          </button>
          {path.map((item, index) => (
            <span key={item.id}>
              <span className="chipper-reference-popup__breadcrumb-separator">
                {'›'}
              </span>
              {index < path.length - 1 ? (
                <button
                  type="button"
                  className="chipper-reference-popup__breadcrumb-segment"
                  onClick={() => handleBreadcrumbNavigate(index)}
                >
                  {item.label}
                </button>
              ) : (
                <span className="chipper-reference-popup__breadcrumb-current">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Item list */}
      <div className="chipper-reference-popup__items">
        {isLoading && (
          <div className="chipper-reference-popup__loading">Loading…</div>
        )}

        {!isLoading && error && (
          <div className="chipper-reference-popup__empty">
            <span>{error}</span>
            <button
              type="button"
              className="chipper-reference-popup__retry"
              onClick={() => fetchItems(path)}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && displayItems.length === 0 && (
          <div className="chipper-reference-popup__empty">
            {isSearching
              ? `No results for '${searchQuery}'`
              : 'No items'}
          </div>
        )}

        {!isLoading &&
          !error &&
          displayItems.map((item, index) => {
            const isSelectable = item.selectable !== false;
            const isDrillable = item.hasChildren === true;
            const optionProps = keyboard.getOptionProps(keywords.length + index);

            if (!isSelectable && isDrillable) {
              // Non-selectable drillable: entire row is a drill target.
              // Override onClick from optionProps — drill, don't close.
              return (
                <button
                  key={item.id}
                  type="button"
                  {...optionProps}
                  onClick={() => handleDrill(item)}
                  className={[
                    'chipper-reference-popup__item chipper-reference-popup__item--non-selectable',
                    optionProps.className,
                  ].filter(Boolean).join(' ')}
                  aria-label={`expand ${item.label}`}
                >
                  <span className="chipper-reference-popup__item-label">
                    {item.label}
                  </span>
                  <span className="chipper-reference-popup__item-drill">▸</span>
                </button>
              );
            }

            return (
              <div key={item.id} className="chipper-reference-popup__item">
                {isSelectable ? (
                  <button
                    type="button"
                    {...optionProps}
                    className={[
                      'chipper-reference-popup__item-label',
                      optionProps.className,
                      item.id === value &&
                        'chipper-reference-popup__item-label--selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="chipper-reference-popup__item-label chipper-reference-popup__item-label--inert">
                    {item.label}
                  </span>
                )}
                {isDrillable && (
                  <button
                    type="button"
                    className="chipper-reference-popup__item-drill"
                    aria-label={`expand ${item.label}`}
                    onClick={() => handleDrill(item)}
                  >
                    ▸
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Search input */}
      {source.search && (
        <div className="chipper-reference-popup__search-row">
          <input
            type="text"
            className="chipper-reference-popup__search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyboard.activeIndex >= 0) {
                keyboard.handleKeyDown(e);
              } else {
                keyboard.handleKeyDown(e);
              }
            }}
            placeholder="Search…"
            aria-label="search items"
            aria-activedescendant={keyboard.activeDescendantId}
            role="combobox"
            aria-expanded={true}
          />
        </div>
      )}
    </div>
  );
}
