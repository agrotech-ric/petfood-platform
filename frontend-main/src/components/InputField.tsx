import React from 'react';
import inputStyles from '../styles/InputField.module.css';
import authErrorStyles from '../styles/Auth.module.css';

type Props = {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  children?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
};

const InputField: React.FC<Props> = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  maxLength,
  children,
  disabled = false,
  onKeyDown
}) => {
  return (
    <div className={inputStyles.inputWrapper}>
      <p className={inputStyles.label}>{label}</p>

      <div className={inputStyles.inputWithButton}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={inputStyles.text_input}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
        />
        {children}
      </div>

      {error && <p className={authErrorStyles.error}>{error}</p>}
    </div>
  );
};

export default InputField;