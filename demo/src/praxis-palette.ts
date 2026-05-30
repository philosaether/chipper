import {
  extendPalette,
  keywordDomain,
  numberDomain,
  textDomain,
  keywordOrExpressionDomain,
  numericExpression,
  multiSelectDomain,
  alternativeCoordinateDomain,
} from 'chipper';

/** Format a number as an ordinal string: 1→"1st", 2→"2nd", 3→"3rd", 11→"11th", etc. */
function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffix = n > 3 && n < 21 ? 'th' : (suffixes[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

export const praxisPalette = extendPalette({
  chips: {
    cadenceMeasure: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'daily', label: 'day' },
        { value: 'weekly', label: 'week' },
        { value: 'monthly', label: 'month' },
        { value: 'weekday' },
        { value: 'weekend', label: 'weekend day' },
      ],
      expression: numericExpression({
        min: 1,
        max: 365,
        trigger: { label: 'custom interval', default: '2' },
      }),
      default: 'weekly',
    }),
    timeUnit: keywordDomain({
      color: 'copper',
      keywords: [
        { value: 'day', label: 'days' },
        { value: 'week', label: 'weeks' },
        { value: 'month', label: 'months' },
        { value: 'quarter', label: 'quarters' },
        { value: 'year', label: 'years' },
      ],
    }),
    cadenceOffset: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: '0', label: 'immediately' },
        { value: '1', label: (ctx) => `next ${ctx.cadenceUnit ?? 'month'}` },
      ],
      expression: numericExpression({
        min: 0,
        max: 52,
        prefix: 'in',
        suffix: (ctx) => String(ctx.cadenceUnit ?? 'month') + 's',
      }),
    }),
    dayOfWeek: multiSelectDomain({
      color: 'sage',
      options: [
        { label: 'Mon', value: 'mon' },
        { label: 'Tue', value: 'tue' },
        { label: 'Wed', value: 'wed' },
        { label: 'Thu', value: 'thu' },
        { label: 'Fri', value: 'fri' },
        { label: 'Sat', value: 'sat' },
        { label: 'Sun', value: 'sun' },
      ],
      keywords: [
        { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] }
      ],
      placeholder: 'one or more days',
      countLabel: 'days',
    }),
    dayOfMonth: alternativeCoordinateDomain({
      color: 'sage',
      modes: [
        {
          id: 'date',
          label: 'Date',
          slots: [{
            prefix: 'the',
            keywords: [
              { label: 'first', value: '1' },
              { label: '15th', value: '15' },
              { label: 'last', value: 'last', display: 'last day' },
              {
                label: 'date',
                layout: 'grid',
                columns: 7,
                keywords: Array.from({ length: 31 }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                  display: `${ordinal(i + 1)}`,
                })),
              },
            ],
          }],
          compose: (day) => day,
          decompose: (v) => [v],
          display: (v) => {
            if (v === 'last') return 'the last day';
            const s = ['th', 'st', 'nd', 'rd'];
            const n = Number(v);
            const suffix = n > 3 && n < 21 ? 'th' : (s[n % 10] ?? 'th');
            return `the ${n}${suffix}`;
          },
        },
        {
          id: 'weekday',
          label: 'Weekday',
          slots: [
            {
              prefix: 'the',
              keywords: [
                { label: 'first', value: 'first' },
                { label: 'second', value: 'second' },
                { label: 'third', value: 'third' },
                { label: 'fourth', value: 'fourth' },
                { label: 'last', value: 'last' },
              ],
            },
            {
              keywords: [
                { label: 'Mon', value: 'monday' },
                { label: 'Tue', value: 'tuesday' },
                { label: 'Wed', value: 'wednesday' },
                { label: 'Thu', value: 'thursday' },
                { label: 'Fri', value: 'friday' },
                { label: 'Sat', value: 'saturday' },
                { label: 'Sun', value: 'sunday' },
              ],
            },
          ],
          compose: (ordinal, day) => `${ordinal} ${day}`,
          decompose: (v) => {
            const parts = v.split(' ');
            return parts.length === 2 ? parts : [undefined, undefined];
          },
          display: (v) => {
            const [ordinal, day] = v.split(' ');
            if (!ordinal || !day) return v;
            return `the ${ordinal} ${day.charAt(0).toUpperCase() + day.slice(1)}`;
          },
        },
      ],
      placeholder: 'a day',
    }),
    monthOfQuarter: keywordDomain({
      color: 'sage',
      keywords: [
        { label: 'first', value: '1' },
        { label: 'second', value: '2' },
        { label: 'last', value: '3' },
      ],
    }),
    monthOfYear: keywordDomain({
      color: 'sage',
      keywords: [
        { label: 'Jan', value: 'jan' },
        { label: 'Feb', value: 'feb' },
        { label: 'Mar', value: 'mar' },
        { label: 'Apr', value: 'apr' },
        { label: 'May', value: 'may' },
        { label: 'Jun', value: 'jun' },
        { label: 'Jul', value: 'jul' },
        { label: 'Aug', value: 'aug' },
        { label: 'Sep', value: 'sep' },
        { label: 'Oct', value: 'oct' },
        { label: 'Nov', value: 'nov' },
        { label: 'Dec', value: 'dec' },
      ],
    }),
    timeOfDay: numberDomain({
      color: 'slate',
      keywords: [
        { value: '6', label: 'dawn' },
        { value: '12', label: 'noon' },
        { value: '18', label: 'dusk' },
        { value: '24', label: 'midnight' },
      ],
      min: 0,
      max: 24,
      suffix: ':00',
      placeholder: 'a specific time of day',
    }),
    taskName: textDomain({
      color: 'rose',
      placeholder: 'New Task',
    }),
    project: keywordDomain({
      color: 'slate',
      keywords: [{ value: 'praxis', label: 'Praxis' }],
      default: 'praxis',
    }),
    dueMeasure: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'end-of-day', label: 'end of day' },
        { value: 'tomorrow' },
        { value: 'end-of-week', label: 'end of week' },
        { value: 'next-week', label: 'next week' },
        { value: 'never' },
      ],
      expression: numericExpression({
        prefix: 'in',
        min: 1,
        max: 365,
        trigger: { label: 'custom due date', default: '5' },
      }),
    }),
  },
});
