import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { useRequests } from '../../context/RequestContext';
import { apiClient } from '../utils/apiClient';
import { Sidebar } from '../components/Sidebar';
import styles from '../styles/RecommendationsList.module.css';

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
};

type RecommendationWithPet = {
  id: string;
  healthRecordId: string;
  petId: string;
  petName: string;
  createdAt: string;
};

export const RecommendationsList = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { requests, fetchRequestsByPetId } = useRequests();
  const [recommendations, setRecommendations] = useState<RecommendationWithPet[]>([]);
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
      fetchAllRecommendations();
    } else if (requestsFetched && requests.length === 0) {
      setIsLoading(false);
    }
  }, [requestsFetched, requests.length]);

  const fetchAllRecommendations = async () => {
    setIsLoading(true);
    try {
      const allRecommendations: RecommendationWithPet[] = [];

      for (const request of requests) {
        try {
          const recommendation = await apiClient.get<SavedRecommendation>(
            `/api/v1/pets/health-records/${request.id}/recommendation`
          );

          const pet = pets.find(p => p.id === request.petId);

          allRecommendations.push({
            id: recommendation.id,
            healthRecordId: recommendation.healthRecordId,
            petId: request.petId,
            petName: pet?.name || request.petName || 'Неизвестный питомец',
            createdAt: recommendation.createdAt,
          });
        } catch (error) {
          // No recommendation for this request, skipping
        }
      }

      allRecommendations.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRecommendations(allRecommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecommendation = (healthRecordId: string) => {
    navigate(`/recommendation/${healthRecordId}`);
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
      {recommendations.length > 0 && (
        <div className={styles.header}>
          <h1 className={styles.title}>Рекомендации</h1>
          <p className={styles.subtitle}>
            Все рекомендации ветеринара по питанию
          </p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Пока нет рекомендаций</p>
          <p className={styles.emptySubtext}>
            Создайте заявку на консультацию, и ветеринар подготовит индивидуальные рекомендации
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
          {recommendations.map((rec) => (
            <div key={rec.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.petName}>{rec.petName}</h3>
                <span className={styles.date}>{formatDate(rec.createdAt)}</span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.description}>
                  Индивидуальная рекомендация по питанию с детальным анализом
                </p>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.viewButton}
                  onClick={() => handleViewRecommendation(rec.healthRecordId)}
                >
                  Посмотреть рекомендацию
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