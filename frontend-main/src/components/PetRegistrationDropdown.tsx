import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/PetRegistrationDropdown.module.css';

type DropdownOption = {
  value: string;
  label: string;
};

type PetRegistrationDropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
};

const PetRegistrationDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите',
  error,
  searchable = false
}: PetRegistrationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  const filteredOptions = searchable && inputValue
    ? options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  useEffect(() => {
    if (searchable && !isOpen) {
      if (value) {
        const matchingOption = options.find(opt => opt.value === value);
        setInputValue(matchingOption?.label || value);
      } else {
        setInputValue('');
      }
    }
  }, [value, options, isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);

        if (searchable && value) {
          const matchingOption = options.find(opt => opt.value === value);
          setInputValue(matchingOption?.label || value);
        } else if (searchable) {
          setInputValue('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value, options, searchable]);

  useEffect(() => {
    if (isOpen) {
      const triggerElement = searchable ? inputRef.current : selectRef.current;
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string, optionLabel: string) => {
    if (searchable) {
      setInputValue(optionLabel);
    }
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.blur(), 50);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIndex = filteredOptions.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!isOpen) {
      setIsOpen(true);
    }
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (filteredOptions.length > 0) {
      setHighlightedIndex(0);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        if (value) {
          const matchingOption = options.find(opt => opt.value === value);
          setInputValue(matchingOption?.label || value);
        } else if (!inputValue) {
          setInputValue('');
        }
      }
    }, 200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(0);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selectedOption = filteredOptions[highlightedIndex];
          handleSelect(selectedOption.value, selectedOption.label);
        } else if (inputValue.trim()) {
          onChange(inputValue.trim());
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          const selectedOption = filteredOptions[highlightedIndex];
          handleSelect(selectedOption.value, selectedOption.label);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {searchable ? (
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${error ? styles.inputError : ''} ${isOpen ? styles.inputOpen : ''}`}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
          />
          <svg
            className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            onClick={() => inputRef.current?.focus()}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      ) : (
        <div
          ref={selectRef}
          className={`${styles.select} ${isOpen ? styles.selectOpen : ''} ${error ? styles.selectError : ''}`}
          onClick={handleToggle}
          onKeyDown={handleSelectKeyDown}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`${styles.selectText} ${!value ? styles.placeholder : ''}`}>
            {displayText}
          </span>
          <svg
            className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}

      {isOpen && filteredOptions.length > 0 && createPortal(
        <ul
          ref={dropdownListRef}
          className={styles.dropdown}
          role="listbox"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={`${styles.option} ${
                option.value === value ? styles.optionSelected : ''
              } ${
                index === highlightedIndex ? styles.optionHighlighted : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option.value, option.label);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </li>
          ))}
        </ul>,
        document.body
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default PetRegistrationDropdown;