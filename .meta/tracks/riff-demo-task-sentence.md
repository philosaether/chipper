# riff/demo-task-sentence

Riff track for adding the Praxis "create task on cadence" sentence to the
Chipper demo page, plus gaps surfaced along the way.

Started: 2026-05-21

---

## Note 1: dateExpression input type

Added `inputType: 'date'` to ExpressionMode and ExpressionConfig, plus a
`dateExpression()` helper. Native `<input type="date">` in the popup —
submits on change (like numeric stepper), value is YYYY-MM-DD.

Shipped as a general-purpose expression type. Not needed for the cadence
sentence itself (day-of-month is already handled by alt-coordinate, "due"
chip is relative duration via numericExpression), but valid for standalone
date-picking chips. Demo sentence: "Schedule a meeting for [a date]."

## Note 2: day-of-month vs full calendar date

Two distinct problems emerged from the dateExpression work:

1. **Day-of-month** (the cadence sentence's "on [the 15th]") — only the DD
   part matters. Already solved by alternativeCoordinateDomain with keyword
   slots (1st, 5th, 10th, 15th, 20th, 25th, last). No date picker needed.

2. **Full calendar date** (a future "due on [March 15, 2026]" chip) — the
   dateExpression we just built. YYYY-MM-DD native picker, keywords for
   shortcuts like "tomorrow" or "next Monday".

These are different domains with different value types, not config variants
of the same expression mode. No further action needed — the existing
archetype split handles both cases.
