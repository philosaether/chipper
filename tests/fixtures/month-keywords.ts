/**
 * Shared test fixture: month keywords for enum domain tests.
 */

import type { Keyword } from '../../src/core/types';

/** Subset of months — enough to test with, small enough to read. */
export const monthKeywords: Keyword<string>[] = [
  { label: 'January', value: 'january' },
  { label: 'February', value: 'february' },
  { label: 'September', value: 'september' },
  { label: 'December', value: 'december' },
];

/** All twelve months — used where completeness matters. */
export const allMonthKeywords: Keyword<string>[] = [
  { label: 'January', value: 'january' },
  { label: 'February', value: 'february' },
  { label: 'March', value: 'march' },
  { label: 'April', value: 'april' },
  { label: 'May', value: 'may' },
  { label: 'June', value: 'june' },
  { label: 'July', value: 'july' },
  { label: 'August', value: 'august' },
  { label: 'September', value: 'september' },
  { label: 'October', value: 'october' },
  { label: 'November', value: 'november' },
  { label: 'December', value: 'december' },
];
