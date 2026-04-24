import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import InputField from './InputField';
import styles from '../styles/ForgotPasswordModal.module.css';

type EmailConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
};

const EmailConfirmationModal = ({ isOpen, onClose, email }: EmailConfirmationModalProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { confirmRegistration, registerAction } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
      setCountdown(0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError('');

    if (!code) {
      setError('*Введите код подтверждения');
      return;
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('*Код должен состоять из 6 цифр');
      return;
    }

    setLoading(true);

    try {
      await confirmRegistration({ email, code });
      onClose();
    } catch (err: any) {
      setError(err.message || '*Неверный код подтверждения');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown === 0) {
      setLoading(true);
      setError('');

      try {
        setCountdown(60);
        alert('Код отправлен повторно на ' + email);
      } catch (err: any) {
        setError('*Ошибка при отправке кода');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Подтвердите email</h2>
        <p className={styles.subtitle}>
          Мы отправили 6-значный код на <strong>{email}</strong>
        </p>

        <InputField
          label=""
          type="text"
          placeholder="Введите код (6 цифр)"
          value={code}
          onChange={setCode}
          error={error}
          maxLength={6}
        />

        <button
          onClick={handleSubmit}
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Проверка...' : 'Подтвердить'}
        </button>

        <p className={styles.linkText}>Не получили код?</p>

        <button
          onClick={handleResend}
          className={styles.submitBtn}
          disabled={countdown > 0 || loading}
          style={{ marginTop: '10px' }}
        >
          {countdown > 0 ? `Отправить снова через ${countdown} сек.` : 'Отправить снова'}
        </button>

        <button onClick={onClose} className={styles.backBtn}>
          Назад
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmationModal;