/**
 * Alternative-coordinate domain — multiple expression modes (tabs) over
 * the same value space.
 *
 * The fourth archetype. Each mode can have one or more "slots" —
 * independent selection dimensions that compose into a single value.
 * Single-slot modes are the simple case (pick one keyword). Multi-slot
 * modes compose N selections (e.g., ordinal × weekday → "first wednesday").
 *
 * Covers day-of-month (date vs weekday), month-in-period (quarter vs year),
 * and any domain where the same value can be specified through different
 * coordinate systems.
 */

import type { Domain, ExpressionMode, Keyword, SentenceContext } from '../core/types';
import type { ExpressionConfig } from './keyword-or-expression';
import { createDomain } from './create-domain';

/** One selection dimension within a mode. */
export interface ModeSlot {
  /** Keywords for this slot */
  keywords: Keyword<string>[];

  /** Prefix text rendered before the keywords (e.g., "the") */
  prefix?: string;
}

/** One coordinate mode — one tab in the popup. */
export interface AlternativeCoordinateMode {
  /** Unique mode identifier */
  id: string;

  /** Tab label */
  label: string;

  /** Independent selection dimensions within this mode */
  slots: ModeSlot[];

  /** Compose slot selections into the domain value */
  compose: (...selections: string[]) => string;

  /** Decompose existing value back into slot selections (for reopening) */
  decompose?: (value: string) => (string | undefined)[];

  /** Validate the composed value (default: non-empty string) */
  validate?: (value: string) => boolean;

  /** Display the composed value */
  display?: (value: string) => string;

  /** Expression input as alternative to slot selection */
  expression?: ExpressionConfig;
}

/** Configuration for an alternative-coordinate domain. */
export interface AlternativeCoordinateDomainConfig {
  /** Semantic color key */
  color: string;

  /** Available coordinate modes — one tab per mode */
  modes: AlternativeCoordinateMode[];

  /** Default value — empty string if omitted (invalid → placeholder) */
  defaultValue?: string;

  /** Text shown when value is invalid */
  placeholder?: string;

  /** Context keys this domain reads from ancestor producers */
  consumes?: string[];

  /** Context keys this domain writes for descendant consumers */
  produces?: string[];

  /** Reconfigure domain when ancestor context changes */
  onContextChange?: (context: SentenceContext) => Partial<Domain<string>>;
}

/**
 * Collect all keyword values across all slots in a mode.
 * For single-slot modes, values are direct. For multi-slot modes,
 * we need compose to map slot values to domain values.
 */
function collectAllKeywordValues(mode: AlternativeCoordinateMode): Set<string> {
  const values = new Set<string>();
  if (mode.slots.length === 1) {
    for (const keyword of mode.slots[0]!.keywords) {
      values.add(keyword.value);
    }
  }
  // Multi-slot keyword values are composed — can't enumerate statically.
  // Validation for multi-slot modes uses decompose instead.
  return values;
}

/**
 * Build a label lookup from slot keywords across all modes.
 * For single-slot modes, maps value → label directly.
 */
function buildLabelByValue(modes: AlternativeCoordinateMode[]): Map<string, string> {
  const labelByValue = new Map<string, string>();
  for (const mode of modes) {
    if (mode.slots.length === 1) {
      const slot = mode.slots[0]!;
      const prefix = slot.prefix ? `${slot.prefix} ` : '';
      for (const keyword of slot.keywords) {
        if (!labelByValue.has(keyword.value)) {
          labelByValue.set(keyword.value, `${prefix}${keyword.label}`);
        }
      }
    }
  }
  return labelByValue;
}

/**
 * Create an alternative-coordinate domain.
 *
 * @example
 * ```typescript
 * const calendarDay = alternativeCoordinateDomain({
 *   color: 'sage',
 *   modes: [
 *     {
 *       id: 'date',
 *       label: 'Date',
 *       slots: [{ prefix: 'the', keywords: [
 *         { label: '1st', value: '1' },
 *         { label: '15th', value: '15' },
 *       ]}],
 *       compose: (day) => day,
 *       decompose: (v) => [v],
 *     },
 *     {
 *       id: 'weekday',
 *       label: 'Weekday',
 *       slots: [
 *         { prefix: 'the', keywords: [
 *           { label: 'first', value: 'first' },
 *           { label: 'last', value: 'last' },
 *         ]},
 *         { keywords: [
 *           { label: 'Mon', value: 'monday' },
 *           { label: 'Tue', value: 'tuesday' },
 *         ]},
 *       ],
 *       compose: (ordinal, day) => `${ordinal} ${day}`,
 *       decompose: (v) => v.split(' '),
 *     },
 *   ],
 *   placeholder: 'which day',
 * });
 * ```
 */
export function alternativeCoordinateDomain(
  config: AlternativeCoordinateDomainConfig,
): Domain<string> {
  const modes = config.modes;
  const labelByValue = buildLabelByValue(modes);

  // Collect single-slot keyword values for fast validation
  const allSingleSlotValues = new Set<string>();
  for (const mode of modes) {
    for (const value of collectAllKeywordValues(mode)) {
      allSingleSlotValues.add(value);
    }
  }

  const validate = (value: string): boolean => {
    if (value === '') return false;

    // Check single-slot keyword match first (fast path)
    if (allSingleSlotValues.has(value)) return true;

    // Check each mode: custom validate, multi-slot decompose, expression
    for (const mode of modes) {
      if (mode.validate) {
        if (mode.validate(value)) return true;
      } else if (mode.slots.length > 1 && mode.decompose) {
        // Only use decompose as a validator for multi-slot modes.
        // Single-slot modes are covered by keyword + expression checks.
        const parts = mode.decompose(value);
        if (parts.every((p) => p !== undefined)) return true;
      }
      if (mode.expression?.validate) {
        if (mode.expression.validate(value)) return true;
      }
    }

    return false;
  };

  const display = (value: string): string => {
    // Check single-slot label lookup
    const label = labelByValue.get(value);
    if (label !== undefined) return label;

    // Check each mode's custom display and expression display
    for (const mode of modes) {
      if (mode.display) {
        const result = mode.display(value);
        if (result !== value) return result;
      }
      if (mode.expression?.display) {
        const result = mode.expression.display(value);
        if (result !== value) return result;
      }
    }

    return value;
  };

  // Build expressionModes from modes that have expression configs
  const expressionModes: ExpressionMode<string>[] = modes
    .filter((m) => m.expression)
    .map((m) => ({
      id: m.id,
      label: m.expression!.placeholder ?? m.label,
      degreesOfFreedom: 1,
      validate: m.expression!.validate ?? ((v: string) => v.length > 0),
      display: m.expression!.display ?? ((v: string) => v),
      maxLength: m.expression!.maxLength,
    }));

  // Flatten all slot keywords into the domain's keywords array
  // (single-slot modes only — multi-slot keywords aren't directly selectable)
  const keywords: Keyword<string>[] = [];
  for (const mode of modes) {
    if (mode.slots.length === 1) {
      keywords.push(...mode.slots[0]!.keywords);
    }
  }

  return createDomain<string>({
    type: 'alternative-coordinate',
    color: config.color,
    keywords,
    expressionModes,
    defaultValue: config.defaultValue ?? '',
    placeholder: config.placeholder,
    validate,
    display,
    consumes: config.consumes,
    produces: config.produces,
    onContextChange: config.onContextChange,
    meta: { modes },
  });
}
