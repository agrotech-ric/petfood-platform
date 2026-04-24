import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { useRequests } from '../../context/RequestContext';
import { Layout } from '../../layout/Layout';
import { formatAge, formatGender, formatDate } from '../utils/petUtils';
import styles from '../styles/Requests.module.css';

export const Requests = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { requests, fetchRequestsByPetId, isLoading } = useRequests();
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      if (pets.length === 0) return;

      setIsFetching(true);
      try {
        await Promise.all(
          pets.map(pet => fetchRequestsByPetId(pet.id).catch(err => {
            console.error(`Failed to fetch requests for pet ${pet.id}:`, err);
          }))
        );
      } finally {
        setIsFetching(false);
      }
    };

    loadRequests();
  }, [pets.length]);

  const handleCreateRequest = () => {
    navigate('/create-request');
  };

  const handleRequestClick = (requestId: string) => {
    navigate(`/request/${requestId}`);
  };

  const getPetById = (petId: string) => {
    return pets.find(pet => pet.id === petId);
  };

  if (isFetching || isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className={styles.contentWrapper}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <div>Загрузка запросов...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>История запросов</h1>
          {requests.length > 0 && (
            <button className={styles.createBtn} onClick={handleCreateRequest}>
              Создать новый запрос +
            </button>
          )}
        </header>

        <section className={styles.requestsSection}>
          {requests.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>У вас пока нет запросов</p>
              <button className={styles.createFirstBtn} onClick={handleCreateRequest}>
                Создать запрос
              </button>
            </div>
          ) : (
            <div className={styles.requestsList}>
              {[...requests]
               .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
               .map((request) => {
                const pet = getPetById(request.petId);
                if (!pet) return null;

                return (
                  <div
                    key={request.id}
                    className={styles.requestCard}
                    onClick={() => handleRequestClick(request.id)}
                  >
                    <div className={styles.petInfo}>
                      <img
                        src={pet.photo}
                        alt={pet.name}
                        className={styles.petImage}
                      />
                      <div className={styles.petDetails}>
                        <h3 className={styles.petName}>{pet.name}</h3>
                        <p className={styles.petDetail}>
                          Возраст: {formatAge(pet.birthDate)}
                        </p>
                        <p className={styles.petDetail}>
                          Пол: {formatGender(pet.gender)}
                        </p>
                        <p className={styles.petDetail}>
                          ID паспорта: {pet.passportId || 'Не указан'}
                        </p>
                      </div>
                    </div>

                    <div className={styles.requestStatus}>
                      <span className={styles.statusText}>Рекомендации</span>
                    </div>

                    <div className={styles.requestDate}>
                      <span className={styles.dateText}>
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};