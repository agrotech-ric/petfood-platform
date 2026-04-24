import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, validateIIN, validateName, examplePassword } from '../utils/userFormValidator';

import InputField from '../components/InputField';
import PasswordField from '../components/PasswordInputField';
import EmailConfirmationModal from '../components/EmailConfirmationModal';

import styles from '../styles/Auth.module.css';

type FieldErrors = {
  email?: string;
  firstName?: string;
  lastName?: string;
  iin?: string;
  password?: string;
  general?: string;
};

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [iin, setIIN] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { registerAction } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};

    const emailError = validateEmail(email);
    const firstNameError = validateName(firstName, 'Имя');
    const lastNameError = validateName(lastName, 'Фамилия');
    const iinError = validateIIN(iin);
    const passwordError = validatePassword(password);

    if (emailError) newErrors.email = emailError;
    if (firstNameError) newErrors.firstName = firstNameError;
    if (lastNameError) newErrors.lastName = lastNameError;
    if (iinError) newErrors.iin = iinError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await registerAction({
        email,
        firstName,
        lastName,
        iin,
        password,
      });

      setErrors({});
      setRegisteredEmail(result.email);
      setIsConfirmationOpen(true);
    } catch (err: any) {
      setErrors({
        general: err.message || '*Ошибка регистрации. Попробуйте еще раз'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.authContainer}>
        <div className={styles.authFormContainer}>
          <h2>Регистрация</h2>
          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Email"
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />

            <InputField
              label="Имя"
              type="text"
              placeholder="Введите имя"
              value={firstName}
              onChange={setFirstName}
              error={errors.firstName}
            />

            <InputField
              label="Фамилия"
              type="text"
              placeholder="Введите фамилию"
              value={lastName}
              onChange={setLastName}
              error={errors.lastName}
            />

            <InputField
              label="ИИН"
              type="text"
              placeholder="Введите ИИН"
              value={iin}
              onChange={setIIN}
              error={errors.iin}
              maxLength={12}
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              error={errors.password}
            />

            {errors.password && (
              <p className={styles.passwordHint}>
                Пример пароля, соответствующего требованиям: {examplePassword}
              </p>
            )}

            {errors.general && (
              <p className={styles.error}>
                {errors.general}
              </p>
            )}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className={styles.links}>
            <span>Уже есть аккаунт? </span>
            <button type="button" className={styles.link} onClick={() => navigate('/login')}>
              Войти
            </button>
          </div>
        </div>
      </div>

      <EmailConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        email={registeredEmail}
      />
    </>
  );
};

export default Register;