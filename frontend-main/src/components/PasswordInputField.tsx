import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import InputField from './InputField';
import styles from '../styles/InputField.module.css';

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

const PasswordInputField: React.FC<Props> = ({
  label = "Пароль",
  placeholder = "Введите пароль",
  value,
  onChange,
  error,
  disabled = false
}) => {
  const [show, setShow] = useState(false);

  return (
    <InputField
      label={label}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
    >
      <button
        type="button"
        onClick={() => setShow(!show)}
        className={styles.toggleButton}
        disabled={disabled}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </InputField>
  );
};

export default PasswordInputField;