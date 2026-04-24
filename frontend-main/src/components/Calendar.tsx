import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/Calendar.module.css';

type CalendarProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  variant?: 'default' | 'orange';
  mode?: 'single' | 'range';
  rangeValue?: { start: string; end: string };
  onRangeChange?: (range: { start: string; end: string }) => void;
};

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const Calendar = ({
  value,
  onChange,
  error,
  placeholder = 'Выберите дату',
  variant = 'default',
  mode = 'single',
  rangeValue,
  onRangeChange
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0, width: 0 });
  const [showYearPicker, setShowYearPicker] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [rangeStart, setRangeStart] = useState<string | null>(rangeValue?.start || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(rangeValue?.end || null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    setRangeStart(rangeValue?.start || null);
    setRangeEnd(rangeValue?.end || null);
  }, [rangeValue]);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFutureDate = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return date > today;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatRangeDisplay = () => {
    if (!rangeStart && !rangeEnd) return '';
    if (rangeStart && !rangeEnd) return formatDate(rangeStart);
    if (rangeStart && rangeEnd) return `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
    return '';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const calendarWidth = 240;
      const calendarHeight = 280;
      const gap = 8;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= calendarHeight + gap) {
        top = rect.bottom + window.scrollY + gap;
      } else if (spaceAbove >= calendarHeight + gap) {
        top = rect.top + window.scrollY - calendarHeight - gap;
      } else {
        top = rect.top + window.scrollY - calendarHeight;
      }

      let left = rect.right + window.scrollX - calendarWidth;
      if (left < 10) left = 10;

      setCalendarPosition({ top, left, width: rect.width });
    }
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const daysInMonth = lastDay.getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  };

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth()));
    setShowYearPicker(false);
  };

  const createDateString = (day: number) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const handleDateSelect = (day: number) => {
    if (mode === 'single' && isFutureDate(day)) return;

    const isoString = createDateString(day);

    if (mode === 'single') {
      onChange(isoString);
      setIsOpen(false);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(isoString);
        setRangeEnd(null);
        setHoverDate(null);
      } else {
        const start = new Date(rangeStart);
        const end = new Date(isoString);
        if (end >= start) {
          setRangeEnd(isoString);
          onRangeChange?.({ start: rangeStart, end: isoString });
        } else {
          setRangeStart(isoString);
          setRangeEnd(rangeStart);
          onRangeChange?.({ start: isoString, end: rangeStart });
        }
        setIsOpen(false);
      }
    }
  };

  const handleDayHover = (day: number) => {
    if (mode === 'range' && rangeStart && !rangeEnd) {
      setHoverDate(createDateString(day));
    }
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (mode === 'single') {
      if (!selectedDate) return false;
      return (
        day === selectedDate.getDate() &&
        viewDate.getMonth() === selectedDate.getMonth() &&
        viewDate.getFullYear() === selectedDate.getFullYear()
      );
    } else {
      const dateStr = createDateString(day);
      return dateStr === rangeStart || dateStr === rangeEnd;
    }
  };

  const isInRange = (day: number) => {
    if (mode !== 'range') return false;
    const dateStr = createDateString(day);
    const date = new Date(dateStr);
    if (rangeStart && rangeEnd) {
      return date > new Date(rangeStart) && date < new Date(rangeEnd);
    }
    if (rangeStart && hoverDate && !rangeEnd) {
      const start = new Date(rangeStart);
      const hover = new Date(hoverDate);
      return hover >= start ? date > start && date < hover : date < start && date > hover;
    }
    return false;
  };

  const isRangeStart = (day: number) => mode === 'range' && !!rangeStart && createDateString(day) === rangeStart;

  const isRangeEnd = (day: number) => {
    if (mode !== 'range') return false;
    if (rangeEnd) return createDateString(day) === rangeEnd;
    if (hoverDate && rangeStart && !rangeEnd) return createDateString(day) === hoverDate;
    return false;
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) years.push(i);
    return years;
  };

  const days = getDaysInMonth(viewDate);
  const years = getYearRange();
  const displayValue = mode === 'range' ? formatRangeDisplay() : (value ? formatDate(value) : '');

  return (
    <div className={styles.container}>
      <div
        ref={inputRef}
        className={`${styles.input} ${isOpen ? styles.inputOpen : ''} ${error ? styles.inputError : ''} ${variant === 'orange' ? styles.inputOrange : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={!displayValue ? styles.placeholder : ''}>
          {displayValue || placeholder}
        </span>
        <svg className={styles.calendarIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>

      {isOpen && createPortal(
        <div
          ref={calendarRef}
          className={styles.calendar}
          style={{ position: 'absolute', top: `${calendarPosition.top}px`, left: `${calendarPosition.left}px` }}
        >
          {!showYearPicker ? (
            <>
              <div className={styles.header}>
                <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button type="button" className={styles.monthYearButton} onClick={() => setShowYearPicker(true)}>
                  {MONTHS_RU[viewDate.getMonth()]} {viewDate.getFullYear()}
                </button>
                <button type="button" className={styles.navButton} onClick={handleNextMonth}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              <div className={styles.daysHeader}>
                {DAYS_SHORT.map(day => <div key={day} className={styles.dayName}>{day}</div>)}
              </div>

              <div className={styles.daysGrid}>
                {days.map((day, index) => (
                  <div key={index} className={styles.dayCell}>
                    {day && (
                      <button
                        type="button"
                        className={`${styles.day}
                          ${isToday(day) ? styles.dayToday : ''}
                          ${isSelected(day) ? styles.daySelected : ''}
                          ${isInRange(day) ? styles.dayInRange : ''}
                          ${isRangeStart(day) ? styles.dayRangeStart : ''}
                          ${isRangeEnd(day) ? styles.dayRangeEnd : ''}
                          ${mode === 'single' && isFutureDate(day) ? styles.dayDisabled : ''}
                        `}
                        onClick={() => handleDateSelect(day)}
                        onMouseEnter={() => handleDayHover(day)}
                        disabled={mode === 'single' && isFutureDate(day)}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {mode === 'range' && rangeStart && !rangeEnd && (
                <div className={styles.rangeHint}>Выберите конечную дату</div>
              )}
            </>
          ) : (
            <div className={styles.yearPicker}>
              <div className={styles.yearPickerHeader}>
                <button type="button" className={styles.backButton} onClick={() => setShowYearPicker(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Назад
                </button>
              </div>
              <div className={styles.yearGrid}>
                {years.map(year => (
                  <button
                    key={year}
                    type="button"
                    className={`${styles.yearOption} ${year === viewDate.getFullYear() ? styles.yearSelected : ''}`}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default Calendar;