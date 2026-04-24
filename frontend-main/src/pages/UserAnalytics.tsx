import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { apiClient } from '../utils/apiClient';
import DigestionAnalysis from '../components/DigestionAnalysis';
import styles from '../styles/UserAnalytics.module.css';

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
};

export const UserAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecommendationDate();
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchRecommendationDate = async () => {
    if (!id) return;

    try {
      const recommendation = await apiClient.get<SavedRecommendation>(
        `/api/v1/pets/health-records/${id}/recommendation`
      );

      const date = new Date(recommendation.createdAt);
      if (!isNaN(date.getTime())) {
        const formatted = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        setFormattedDate(formatted);
      } else {
        setFormattedDate(new Date().toLocaleDateString('ru-RU'));
      }
    } catch (error) {
      console.error('Failed to fetch recommendation date:', error);
      setFormattedDate(new Date().toLocaleDateString('ru-RU'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  if (!id) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <button className={styles.backBtn} onClick={handleBack}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            Назад
          </button>
          <h1 className={styles.title}>Ошибка</h1>
        </div>
        <main className={styles.main}>
          <p className={styles.errorText}>Не указан ID записи</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <button className={styles.backBtn} onClick={handleBack}>
          <MdKeyboardArrowLeft className={styles.backIcon} />
          Назад
        </button>
        <h1 className={styles.title}>
          {isLoading ? 'Аналитика' : `Аналитика ${formattedDate}`}
        </h1>
      </div>

      <main className={styles.main}>
        <div className={styles.descriptionSection}>
          <p className={styles.description}>
            Ниже представлен <span className={styles.highlightText}>детализированный анализ процессов переваривания</span> и усвоения жиров, белков и углеводов, выполненный на основе <span className={styles.highlightText}>кинетической модели Михаэлиса-Ментен.</span>
          </p>
          <p className={styles.description}>
            В анализе отражён процентный вклад каждого ингредиента в общий процесс усвоения, а также приведён почасовой прогноз переваривания каждого компонента, что позволяет наглядно оценить динамику и эффективность метаболических процессов.
          </p>
        </div>

        <DigestionAnalysis healthRecordId={id} />
      </main>
    </div>
  );
};