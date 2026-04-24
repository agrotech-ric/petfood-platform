import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from '../styles/Dropdown.module.css';

export type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  multiple = false,
  disabled = false,
  error,
  className
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    
    if (multiple) {
      if (selectedValues.length === 1) {
        const option = options.find(o => o.value === selectedValues[0]);
        return option?.label || '';
      }
      return `Выбрано: ${selectedValues.length}`;
    }
    
    const option = options.find(o => o.value === selectedValues[0]);
    return option?.label || '';
  };

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

  return (
    <div className={`${styles.container} ${className || ''}`} ref={dropdownRef}>
      <div
        className={`${styles.select} ${isOpen ? styles.selectOpen : ''} ${
          error ? styles.selectError : ''
        } ${disabled ? styles.selectDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <span className={selectedValues.length === 0 ? styles.placeholder : styles.selectText}>
          {getDisplayText()}
        </span>
        <ChevronDown 
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          size={16}
        />
      </div>

      {isOpen && !disabled && (
        <ul className={styles.dropdown} role="listbox">
          {options.map((option, index) => {
            const selected = isSelected(option.value);
            return (
              <li
                key={option.value}
                className={`${styles.option} ${
                  selected ? styles.optionSelected : ''
                } ${
                  highlightedIndex === index ? styles.optionHighlighted : ''
                }`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={selected}
              >
                <span>{option.label}</span>
                {multiple && selected && (
                  <Check size={16} className={styles.checkIcon} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};