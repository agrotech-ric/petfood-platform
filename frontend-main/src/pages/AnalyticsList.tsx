import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { useRequests } from '../../context/RequestContext';
import { apiClient } from '../utils/apiClient';
import { Sidebar } from '../components/Sidebar';
import styles from '../styles/AnalyticsList.module.css';

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
};

type AnalyticsItem = {
  id: string;
  healthRecordId: string;
  petId: string;
  petName: string;
  createdAt: string;
};

export const AnalyticsList = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { requests, fetchRequestsByPetId } = useRequests();
  const [analyticsItems, setAnalyticsItems] = useState<AnalyticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsFetched, setRequestsFetched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (pets.length > 0 && !requestsFetched) {
      fetchRequestsForAllPets();
    }
  }, [pets.length, requestsFetched]);

  const fetchRequestsForAllPets = async () => {
    try {
      await Promise.all(
        pets.map(pet => fetchRequestsByPetId(pet.id))
      );
      setRequestsFetched(true);
    } catch (error) {
      console.error('Failed to fetch requests for pets:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestsFetched && requests.length > 0) {
      fetchAllAnalytics();
    } else if (requestsFetched && requests.length === 0) {
      setIsLoading(false);
    }
  }, [requestsFetched, requests.length]);

  const fetchAllAnalytics = async () => {
    setIsLoading(true);
    try {
      const allAnalytics: AnalyticsItem[] = [];

      for (const request of requests) {
        try {
          const recommendation = await apiClient.get<SavedRecommendation>(
            `/api/v1/pets/health-records/${request.id}/recommendation`
          );

          const pet = pets.find(p => p.id === request.petId);

          allAnalytics.push({
            id: recommendation.id,
            healthRecordId: recommendation.healthRecordId,
            petId: request.petId,
            petName: pet?.name || request.petName || 'Неизвестный питомец',
            createdAt: recommendation.createdAt,
          });
        } catch (error) {
          // No recommendation/analytics for this request, skipping
        }
      }

      allAnalytics.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAnalyticsItems(allAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalytics = (healthRecordId: string) => {
    navigate(`/analytics/${healthRecordId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className={styles.container}>
      {analyticsItems.length > 0 && (
        <div className={styles.header}>
          <h1 className={styles.title}>Графики</h1>
          <p className={styles.subtitle}>
            Анализ переваривания по модели Михаэлиса-Ментена
          </p>
        </div>
      )}

      {analyticsItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Пока нет графиков</p>
          <p className={styles.emptySubtext}>
            Графики появятся после получения рекомендаций от ветеринара
          </p>
          <button
            className={styles.createButton}
            onClick={() => navigate('/create-request')}
          >
            Создать заявку
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {analyticsItems.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.petName}>{item.petName}</h3>
                <span className={styles.date}>{formatDate(item.createdAt)}</span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.description}>
                  Графики переваривания белков, жиров и углеводов
                </p>
                <div className={styles.features}>
                  <span className={styles.feature}>Белки</span>
                  <span className={styles.feature}>Жиры</span>
                  <span className={styles.feature}>Углеводы</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.viewButton}
                  onClick={() => handleViewAnalytics(item.healthRecordId)}
                >
                  Посмотреть графики
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};