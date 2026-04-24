import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordForm } from '../hooks/useResetPasswordForm';
import { RESET_PASSWORD_TEXT, RESET_PASSWORD_CONFIG } from '../const/resetPassword';
import { RESET_PASSWORD_ERRORS } from '../utils/resetPasswordValidator';
import InputField from '../components/InputField';
import PasswordInputField from '../components/PasswordInputField';
import styles from '../styles/ResetPassword.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromUrl = searchParams.get('email') || '';
  const codeFromUrl = searchParams.get('code') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    errors,
    email,
    code,
    newPassword,
    confirmPassword,
    updateEmail,
    updateCode,
    updateNewPassword,
    updateConfirmPassword,
    validateForm,
    setGeneralError,
    clearAllErrors,
  } = useResetPasswordForm(emailFromUrl, codeFromUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearAllErrors();

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/password/reset/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || RESET_PASSWORD_ERRORS.RESET_FAILED);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, RESET_PASSWORD_CONFIG.REDIRECT_DELAY_MS);
    } catch (err: any) {
      setGeneralError(err.message || RESET_PASSWORD_ERRORS.GENERAL_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <svg className={styles.successIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className={styles.successTitle}>{RESET_PASSWORD_TEXT.SUCCESS_TITLE}</h1>
          <p className={styles.successSubtitle}>{RESET_PASSWORD_TEXT.SUCCESS_SUBTITLE}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{RESET_PASSWORD_TEXT.TITLE}</h1>
        <p className={styles.subtitle}>{RESET_PASSWORD_TEXT.SUBTITLE}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            label={RESET_PASSWORD_TEXT.EMAIL_LABEL}
            type="email"
            placeholder={RESET_PASSWORD_TEXT.EMAIL_PLACEHOLDER}
            value={email}
            onChange={updateEmail}
            error={errors.email}
            disabled={!!emailFromUrl}
          />

          <InputField
            label={RESET_PASSWORD_TEXT.CODE_LABEL}
            type="text"
            placeholder={RESET_PASSWORD_TEXT.CODE_PLACEHOLDER}
            value={code}
            onChange={updateCode}
            error={errors.code}
            maxLength={RESET_PASSWORD_CONFIG.CODE_LENGTH}
            disabled={!!codeFromUrl}
          />

          <PasswordInputField
            label={RESET_PASSWORD_TEXT.NEW_PASSWORD_LABEL}
            placeholder={RESET_PASSWORD_TEXT.NEW_PASSWORD_PLACEHOLDER}
            value={newPassword}
            onChange={updateNewPassword}
            error={errors.newPassword}
          />

          <PasswordInputField
            label={RESET_PASSWORD_TEXT.CONFIRM_PASSWORD_LABEL}
            placeholder={RESET_PASSWORD_TEXT.CONFIRM_PASSWORD_PLACEHOLDER}
            value={confirmPassword}
            onChange={updateConfirmPassword}
            error={errors.confirmPassword}
          />

          {errors.general && <p className={styles.errorGeneral}>{errors.general}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? RESET_PASSWORD_TEXT.SUBMIT_BUTTON_LOADING : RESET_PASSWORD_TEXT.SUBMIT_BUTTON}
          </button>

          <button type="button" onClick={() => navigate('/login')} className={styles.backBtn}>
            {RESET_PASSWORD_TEXT.BACK_BUTTON}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;