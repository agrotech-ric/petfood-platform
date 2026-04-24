import { useNavigate } from 'react-router-dom';
import { Pet } from '../../context/PetContext';
import styles from '../styles/PetRequestForm.module.css';

type PetSelectorProps = {
  pets: Pet[];
  selectedPetId: string;
  onSelect: (petId: string) => void;
  error?: string;
};

export const PetSelector = ({ pets, selectedPetId, onSelect, error }: PetSelectorProps) => {
  const navigate = useNavigate();

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    return years > 0
      ? `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
      : 'Меньше 1 года';
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Выберите питомца</h2>

      {error && <p className={styles.error}>{error}</p>}

      {pets.length === 0 ? (
        <p className={styles.noPets}>
          У вас нет зарегистрированных питомцев.
          <button
            className={styles.registerLink}
            onClick={() => navigate('/register-pet')}
          >
            Зарегистрировать питомца
          </button>
        </p>
      ) : (
        <div className={styles.petGrid}>
          {pets.map((pet) => (
            <div
              key={pet.id}
              className={`${styles.petCard} ${selectedPetId === pet.id ? styles.petCardSelected : ''}`}
              onClick={() => onSelect(pet.id)}
            >
              <img src={pet.photo} alt={pet.name} className={styles.petImage} />
              <div className={styles.petInfo}>
                <h3 className={styles.petName}>{pet.name}</h3>
                <p className={styles.petDetail}>Возраст: {calculateAge(pet.birthDate)}</p>
                <p className={styles.petDetail}>Пол: {pet.gender === 'male' ? 'Самец' : 'Самка'}</p>
                <p className={styles.petDetail}>ID паспорта: {pet.passportId || 'Не указан'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};