import React from 'react';

const Counter = ({ value, onChange, min = 0, max = 99 }) => {
  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
        onTouchEnd={handleDecrement}
        disabled={value <= min}
        style={{ touchAction: 'manipulation' }}
      >
        -1
      </button>
      <span className="counter-value">{value}</span>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleIncrement}
        onTouchEnd={handleIncrement}
        disabled={value >= max}
        style={{ touchAction: 'manipulation' }}
      >
        +1
      </button>
    </div>
  );
};

export default Counter;