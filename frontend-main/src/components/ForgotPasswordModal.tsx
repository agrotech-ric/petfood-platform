import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './InputField';
import styles from '../styles/ForgotPasswordModal.module.css';

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('*Введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('*Неверный адрес электронной почты');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/password/reset/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || '*Учетная запись с данной электронной почтой не найдена');
        return;
      }

      const result = await response.json();
      console.log('Reset start response:', result);

      if (result.status === 'code_sent') {
        onClose();
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setError('*Не удалось отправить код. Попробуйте еще раз');
      }

    } catch (err) {
      console.error('Password reset error:', err);
      setError('*Произошла ошибка. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

    const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Забыли пароль?</h2>
        <p className={styles.subtitle}>На какую почту привязан ваш аккаунт?</p>

        <InputField
          label=""
          type="email"
          placeholder="Электронная почта"
          value={email}
          onChange={setEmail}
          error={error}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleSubmit}
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Отправить код'}
        </button>

        <button onClick={onClose} className={styles.backBtn}>
          Назад
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;