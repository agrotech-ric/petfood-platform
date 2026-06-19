import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import { useTranslation } from '../../context/LanguageContext';
import styles from '../styles/Help.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const Help = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    let valid = true;

    if (!title.trim()) {
      setTitleError(t('help.titleRequired'));
      valid = false;
    } else {
      setTitleError('');
    }

    if (!description.trim()) {
      setDescError(t('help.descRequired'));
      valid = false;
    } else {
      setDescError('');
    }

    if (!valid) return;

    setLoading(true);
    setSubmitError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/support/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || t('help.sendError'));
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || t('help.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnother = () => {
    setTitle('');
    setDescription('');
    setTitleError('');
    setDescError('');
    setSubmitted(false);
  };

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>
            <MdChevronLeft size={16} />
            {t('common.back')}
          </button>
          <h1 className={styles.headerTitle}>{t('help.title')}</h1>
        </header>

        <div className={styles.card}>
          {submitted ? (
            <>
              <p className={styles.successTitle}>{t('help.requestSent')}</p>
              <p className={styles.successSubtitle}>{t('help.successSubtitle')}</p>
              <button className={styles.submitBtn} onClick={handleAnother}>
                {t('help.sendAnother')}
              </button>
            </>
          ) : (
            <>
              <p className={styles.formTitle}>{t('help.formTitle')}</p>
              <p className={styles.formSubtitle}>{t('help.formDesc')}</p>

              <input
                className={`${styles.inputField} ${titleError ? styles.inputError : ''}`}
                placeholder={t('help.problemTitle')}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError('');
                }}
              />
              {titleError && <p className={styles.errorText}>{titleError}</p>}

              <textarea
                className={`${styles.textarea} ${descError ? styles.inputError : ''}`}
                placeholder={t('help.problemDescription')}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDescError('');
                }}
              />
              {descError && <p className={styles.errorText}>{descError}</p>}
              {submitError && <p className={styles.errorText}>{submitError}</p>}

              <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? t('common.sending') : t('common.send')}
              </button>
            </>
          )}
        </div>
      </div>
  );
};
