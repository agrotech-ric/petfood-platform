import { useState, useEffect } from 'react';
import styles from '../styles/DualRangeSlider.module.css';

type DualRangeSliderProps = {
  label: string;
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

const roundValue = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const DualRangeSlider = ({
  label,
  min,
  max,
  onMinChange,
  onMaxChange
}: DualRangeSliderProps) => {
  const [minInput, setMinInput] = useState(roundValue(min).toString());
  const [maxInput, setMaxInput] = useState(roundValue(max).toString());

  useEffect(() => {
    setMinInput(roundValue(min).toString());
  }, [min]);

  useEffect(() => {
    setMaxInput(roundValue(max).toString());
  }, [max]);

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInput(e.target.value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInput(e.target.value);
  };

  const handleMinInputBlur = () => {
    let value = parseFloat(minInput);

    if (isNaN(value) || value < 0) {
      value = 0;
    } else if (value > 100) {
      value = 100;
    } else if (value >= max) {
      value = max - 0.01;
    }

    value = roundValue(value);
    setMinInput(value.toString());
    onMinChange(value);
  };

  const handleMaxInputBlur = () => {
    let value = parseFloat(maxInput);

    if (isNaN(value) || value < 0) {
      value = 0;
    } else if (value > 100) {
      value = 100;
    } else if (value <= min) {
      value = min + 0.01;
    }

    value = roundValue(value);
    setMaxInput(value.toString());
    onMaxChange(value);
  };

  const handleMinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMinInputBlur();
      e.currentTarget.blur();
    }
  };

  const handleMaxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMaxInputBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div className={styles.sliderContainer}>
      <label className={styles.sliderLabel}>{label}</label>
      <div className={styles.dualSliderWrapper}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={minInput}
          onChange={handleMinInputChange}
          onBlur={handleMinInputBlur}
          onKeyDown={handleMinKeyDown}
          className={styles.numberInput}
        />

        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderRange}
            style={{
              left: `${roundValue(min)}%`,
              right: `${100 - roundValue(max)}%`
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={roundValue(min)}
            onChange={(e) => {
              const value = Math.min(Number(e.target.value), max - 0.01);
              const rounded = roundValue(value);
              onMinChange(rounded);
              setMinInput(rounded.toString());
            }}
            className={styles.sliderThumb}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={roundValue(max)}
            onChange={(e) => {
              const value = Math.max(Number(e.target.value), min + 0.01);
              const rounded = roundValue(value);
              onMaxChange(rounded);
              setMaxInput(rounded.toString());
            }}
            className={styles.sliderThumb}
          />
        </div>

        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={maxInput}
          onChange={handleMaxInputChange}
          onBlur={handleMaxInputBlur}
          onKeyDown={handleMaxKeyDown}
          className={styles.numberInput}
        />
      </div>
    </div>
  );
};