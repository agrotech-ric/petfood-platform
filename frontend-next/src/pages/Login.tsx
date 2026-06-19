import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import InputField from '../components/InputField';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import styles from '../styles/Auth.module.css';

const Login = () => {
  const { loginAction } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError(`*${t('auth.fillAllFields')}`);
      return;
    }

    setIsLoading(true);

    try {
      await loginAction({ email, password });
    } catch (err: any) {
      const errorMessage = ['Invalid credentials', 'Validation failed'].includes(err.message)
        ? `*${t('auth.invalidCredentials')}`
        : (err.message || `*${t('auth.invalidCredentials')}`);

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authFormContainer}>
          <h2>{t('auth.loginTitle')}</h2>

          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label={t('common.email')}
              type="email"
              placeholder={t('auth.enter')}
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (loginError) setLoginError('');
              }}
            />

            <InputField
              label={t('common.password')}
              type="password"
              placeholder={t('auth.enter')}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (loginError) setLoginError('');
              }}
              error={loginError}
            />

            <div className={styles.forgotPassword}>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className={styles.forgotPasswordLink}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              className={styles.btn}
              disabled={isLoading}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.login')}
            </button>

            <div className={styles.links}>
              <span>{t('auth.noAccount')}</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className={styles.link}
              >
                {t('auth.register')}
              </button>
            </div>
          </form>

          <ForgotPasswordModal
            isOpen={isForgotPasswordOpen}
            onClose={() => setIsForgotPasswordOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
