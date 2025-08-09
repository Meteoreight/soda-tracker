import React from 'react';

const Counter = ({ value, onChange, min = 0, max = 99 }) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  return (
    <div className="counter">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        -1
      </button>
      <span className="counter-value">{value}</span>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        +1
      </button>
    </div>
  );
};

export default Counter;