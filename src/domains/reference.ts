/**
 * Reference domain — external data with navigation/search popup.
 *
 * The fifth archetype. Value is an opaque reference ID (string).
 * The consumer provides a ReferenceSource that fetches items on demand;
 * Chipper provides tree navigation, search, and selection mechanics.
 *
 * Covers priority pickers (hierarchical tree), user pickers (flat search),
 * and any domain where the value space lives outside the palette.
 */

import type { Domain, Keyword, SentenceContext } from '../core/types';
import { createDomain } from './create-domain';

/** A single item in the reference data set. */
export interface ReferenceItem {
  /** Unique ID — becomes the chip value when selected */
  id: string;

  /** Display label */
  label: string;

  /** Whether this item has children (enables drill-in affordance) */
  hasChildren?: boolean;

  /**
   * Whether this item can be selected. Default true.
   * If false, the item is a navigation-only node (category, folder).
   * Items with hasChildren can be both drillable and selectable.
   */
  selectable?: boolean;
}

/** Data source for a reference domain. */
export interface ReferenceSource {
  /**
   * Fetch items at a given path in the hierarchy.
   * - Root level: path is []
   * - One level deep: path is [rootItem]
   * - Flat data: ignore path, return full list
   *
   * Called on popup open and on each drill-in navigation.
   */
  getItems: (path: ReferenceItem[]) => ReferenceItem[] | Promise<ReferenceItem[]>;

  /**
   * Search across the full data set.
   * If omitted, the popup hides the search input.
   */
  search?: (query: string) => ReferenceItem[] | Promise<ReferenceItem[]>;

  /**
   * Resolve an ID to its display string.
   * Called eagerly on chip mount to populate displayValue for saved references.
   * If omitted, the raw ID is shown as the display value.
   */
  resolveDisplay?: (id: string) => string | Promise<string>;
}

/** Configuration for a reference domain. */
export interface ReferenceDomainConfig {
  /** Semantic color key */
  color: string;

  /** Data source — provides items, search, display resolution */
  source: ReferenceSource;

  /**
   * Shortcut keywords. Selected like enum keywords — bypass the popup.
   * Useful for "none" or "any" sentinel values.
   */
  keywords?: Keyword<string>[];

  /** Default value — empty string if omitted (invalid → placeholder) */
  default?: string;

  /** Text shown when value is invalid */
  placeholder?: string;

  /** Context keys this domain reads */
  consumes?: string[];

  /** Context keys this domain writes */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

/**
 * Create a reference domain.
 *
 * @example
 * ```typescript
 * const priorityRef = referenceDomain({
 *   color: 'indigo',
 *   source: {
 *     getItems: (path) => fetchPrioritiesAt(path),
 *     search: (query) => searchPriorities(query),
 *     resolveDisplay: (id) => getPriorityPath(id),
 *   },
 *   placeholder: 'a priority',
 * });
 * ```
 */
export function referenceDomain(config: ReferenceDomainConfig): Domain<string> {
  const keywords = config.keywords ?? [];
  const labelByKeyword = new Map(
    keywords
      .filter((k): k is typeof k & { label: string } => typeof k.label === 'string')
      .map((k) => [k.value, k.label] as const),
  );
  const displayCache = new Map<string, string>();

  return createDomain<string>({
    type: 'reference',
    color: config.color,
    keywords,
    defaultValue: config.default ?? '',
    placeholder: config.placeholder,
    validate: (value) => {
      if (value === '') return false;
      // Keywords are always valid. For reference IDs, trust the source —
      // if the consumer selected it through the popup, it's valid.
      // Stale IDs (deleted entities) are a consumer-level concern.
      return true;
    },
    display: (value) => {
      // Keyword label takes priority
      const label = labelByKeyword.get(value);
      if (label !== undefined) return label;
      // Display cache populated by resolveDisplay and popup selection
      return displayCache.get(value) ?? value;
    },
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: { source: config.source, displayCache },
  });
}
