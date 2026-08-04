import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import styles from '../../styles/DualRangeSlider.module.css'

type Props = {
  label: string
  minValue: number
  maxValue: number
  lowerBound?: number
  upperBound?: number
  step?: number
  onChange: (range: { min: number; max: number }) => void
}

function roundToStep(value: number, step: number) {
  const decimals = Math.max(0, (String(step).split('.')[1] ?? '').length)
  return Number(value.toFixed(decimals))
}

export function DualRangeSlider({
  label,
  minValue,
  maxValue,
  lowerBound = 0,
  upperBound = 100,
  step = 0.01,
  onChange,
}: Props) {
  const [minInput, setMinInput] = useState(String(minValue))
  const [maxInput, setMaxInput] = useState(String(maxValue))
  const span = upperBound - lowerBound || 1
  const minPosition = ((minValue - lowerBound) / span) * 100
  const maxPosition = ((maxValue - lowerBound) / span) * 100

  useEffect(() => setMinInput(String(minValue)), [minValue])
  useEffect(() => setMaxInput(String(maxValue)), [maxValue])

  const commitMin = () => {
    const parsed = Number(minInput.replace(',', '.'))
    const value = roundToStep(
      Math.min(Math.max(Number.isFinite(parsed) ? parsed : lowerBound, lowerBound), maxValue),
      step,
    )
    setMinInput(String(value))
    onChange({ min: value, max: maxValue })
  }

  const commitMax = () => {
    const parsed = Number(maxInput.replace(',', '.'))
    const value = roundToStep(
      Math.max(Math.min(Number.isFinite(parsed) ? parsed : upperBound, upperBound), minValue),
      step,
    )
    setMaxInput(String(value))
    onChange({ min: minValue, max: value })
  }

  const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (event.key === 'Enter') {
      commit()
      event.currentTarget.blur()
    }
  }

  const inputProps = (value: string, onInput: (event: ChangeEvent<HTMLInputElement>) => void) => ({
    type: 'text',
    inputMode: 'decimal' as const,
    value,
    onChange: onInput,
  })

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <input
        {...inputProps(minInput, event => setMinInput(event.target.value))}
        className={styles.numberInput}
        aria-label={`${label}: минимум`}
        onBlur={commitMin}
        onKeyDown={event => commitOnEnter(event, commitMin)}
      />
      <div className={styles.track}>
        <span
          className={styles.activeRange}
          style={{ left: `${minPosition}%`, right: `${100 - maxPosition}%` }}
        />
        <input
          type="range"
          min={lowerBound}
          max={upperBound}
          step={step}
          value={minValue}
          aria-label={`${label}: минимальный ползунок`}
          className={styles.thumb}
          style={{ zIndex: minPosition > 90 ? 4 : 2 }}
          onChange={event => onChange({
            min: Math.min(Number(event.target.value), maxValue),
            max: maxValue,
          })}
        />
        <input
          type="range"
          min={lowerBound}
          max={upperBound}
          step={step}
          value={maxValue}
          aria-label={`${label}: максимальный ползунок`}
          className={styles.thumb}
          style={{ zIndex: 3 }}
          onChange={event => onChange({
            min: minValue,
            max: Math.max(Number(event.target.value), minValue),
          })}
        />
      </div>
      <input
        {...inputProps(maxInput, event => setMaxInput(event.target.value))}
        className={styles.numberInput}
        aria-label={`${label}: максимум`}
        onBlur={commitMax}
        onKeyDown={event => commitOnEnter(event, commitMax)}
      />
    </div>
  )
}
