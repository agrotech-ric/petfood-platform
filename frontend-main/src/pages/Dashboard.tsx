import { useNavigate } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { usePetFilters } from '../hooks/usePetFilters';
import { Layout } from '../../layout/Layout';
import { PetCard } from '../components/PetCard';
import { FilterButtons } from '../components/FilterButtons';
import {
  AGE_SORT_OPTIONS,
  GENDER_FILTER_OPTIONS,
  DASHBOARD_TEXT
} from '../const/dashboard';
import styles from '../styles/Dashboard.module.css';

export const Dashboard = () => {
  const { pets, isLoading } = usePets();
  const { filters, filteredPets, setAgeSortOrder, setGenderFilter } = usePetFilters(pets);
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/register-pet');
  };

  const handlePetClick = (petId: string) => {
    navigate(`/pet-profile/${petId}`);
  };

  if (isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className={styles.main}>
          <div className={styles.loadingContainer}>
            <h2>{DASHBOARD_TEXT.LOADING_MESSAGE}</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>{DASHBOARD_TEXT.PAGE_TITLE}</h1>
          <button className={styles.registerBtn} onClick={handleRegisterClick}>
            {DASHBOARD_TEXT.REGISTER_BUTTON}
          </button>
        </header>

        <section className={styles.filters}>
          <FilterButtons
            label={DASHBOARD_TEXT.FILTER_AGE}
            options={AGE_SORT_OPTIONS}
            selectedValue={filters.ageSortOrder}
            onChange={setAgeSortOrder}
          />

          <FilterButtons
            label={DASHBOARD_TEXT.FILTER_GENDER}
            options={GENDER_FILTER_OPTIONS}
            selectedValue={filters.genderFilter}
            onChange={setGenderFilter}
          />
        </section>

        <section className={styles.petCards}>
          {filteredPets.length === 0 ? (
            <p className={styles.placeholder}>
              {!pets || pets.length === 0
                ? DASHBOARD_TEXT.NO_PETS
                : DASHBOARD_TEXT.NO_FILTERED_PETS
              }
            </p>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredPets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onClick={handlePetClick}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};