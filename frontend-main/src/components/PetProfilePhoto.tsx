import { PET_PROFILE_TEXT } from '../const/petProfile';
import styles from '../styles/PetProfile.module.css';

interface PetProfilePhotoProps {
  photo?: string;
  name: string;
}

export const PetProfilePhoto = ({ photo, name }: PetProfilePhotoProps) => {
  if (photo) {
    return <img src={photo} alt={name} className={styles.petPhoto} />;
  }

  return (
    <div className={`${styles.petPhoto} ${styles.petPhotoPlaceholder}`}>
      {PET_PROFILE_TEXT.NO_PHOTO}
    </div>
  );
};