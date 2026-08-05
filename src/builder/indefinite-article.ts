/**
 * chooseIndefiniteArticle — "a" vs "an" for a following word.
 *
 * First-letter vowel detection plus a prefix list for the common English
 * phonetic exceptions: vowel letters with consonant sounds ("a unique",
 * "a used", "a one-off") and consonant letters with vowel sounds
 * ("an hour", "an honest"). Covers the words that show up in real
 * sentences; genuinely ambiguous cases (herb, historic) follow US usage.
 */

/** Vowel-letter starts that take "a" (consonant sound). */
const A_EXCEPTION_PREFIXES = [
  'uni', // unique, unicorn, union, universal, university, uniform
  'use', // used, useful, user
  'usu', // usual, usurper
  'uti', // utility, utilities
  'u-', // u-turn
  'eu', // european, eulogy, euphemism
  'ewe',
  'one',
  'once',
];

/** Consonant-letter starts that take "an" (vowel sound). */
const AN_EXCEPTION_PREFIXES = [
  'hour', // hour, hourly
  'hones', // honest, honesty
  'hono', // honor, honour, honorary
  'heir', // heir, heirloom
  'herb', // US pronunciation
];

export function chooseIndefiniteArticle(word: string): 'a' | 'an' {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return 'a';

  if (A_EXCEPTION_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return 'a';
  }
  if (AN_EXCEPTION_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return 'an';
  }
  return 'aeiou'.includes(normalized[0]!) ? 'an' : 'a';
}
