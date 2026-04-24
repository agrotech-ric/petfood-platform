import { Pet } from '../../context/PetContext';
import { formatAge, formatGender } from '../../src/utils/petUtils';
import styles from '../styles/Dashboard.module.css';

interface PetCardProps {
  pet: Pet;
  onClick: (petId: string) => void;
}

export const PetCard = ({ pet, onClick }: PetCardProps) => {
  return (
    <div
      className={styles.petCard}
      onClick={() => onClick(pet.id)}
    >
      {pet.photo ? (
        <img src={pet.photo} alt={pet.name} className={styles.cardImage} />
      ) : (
        <div className={`${styles.cardImage} ${styles.cardImagePlaceholder}`}>
          Нет фото
        </div>
      )}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{pet.name}</h3>
        <div className={styles.cardInfo}>
          <p className={styles.cardInfoItem}>
            Пол: {formatGender(pet.gender)}
          </p>
          <p className={styles.cardInfoItem}>
            Возраст: {formatAge(pet.birthDate)}
          </p>
          {pet.passportId && (
            <p className={styles.cardInfoItem}>
              ID паспорта: {pet.passportId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};