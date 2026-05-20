/**
 * Mode-switching primitives.
 *
 * A trigger keyword enters expression mode instead of storing a value.
 * The popup sends TRIGGER_SENTINEL via SET_CHIP_VALUE; the reducer
 * detects it and substitutes the expression default.
 */

/** Sentinel value dispatched by the popup when the user clicks a trigger keyword. */
export const TRIGGER_SENTINEL = Symbol('chipper:trigger');
