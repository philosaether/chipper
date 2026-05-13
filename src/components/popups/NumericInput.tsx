/**
 * NumericInput — number stepper with +/- buttons.
 *
 * Renders: [ − ]  value  [ + ]
 * Submits on change (no Enter required — each click/edit is a selection).
 */

export interface NumericInputProps {
  value: string;
  min?: number;
  max?: number;
  step?: number;
  onSelect: (value: string) => void;
}

export function NumericInput({
  value,
  min,
  max,
  step = 1,
  onSelect,
}: NumericInputProps) {
  const numericValue = value === '' ? 0 : Number(value);
  const isValid = !isNaN(numericValue);
  const current = isValid ? numericValue : 0;

  const canDecrement = min === undefined || current - step >= min;
  const canIncrement = max === undefined || current + step <= max;

  const handleDecrement = () => {
    if (canDecrement) {
      onSelect(String(current - step));
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onSelect(String(current + step));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') {
      onSelect(raw);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      onSelect(String(parsed));
    }
  };

  return (
    <div className="chipper-numeric-input">
      <button
        type="button"
        className="chipper-numeric-input__button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        className="chipper-numeric-input__value"
        value={value}
        onChange={handleChange}
        aria-label="Numeric value"
      />
      <button
        type="button"
        className="chipper-numeric-input__button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
