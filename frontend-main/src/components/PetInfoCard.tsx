import { usePets } from '../../context/PetContext';
import styles from '../styles/PetInfoCard.module.css';
import type { VetRequest } from '../types/vetRecommendation';
import { formatAge } from '../../src/utils/petUtils';



type PetInfoCardProps = {
  request: VetRequest;
};


export const PetInfoCard = ({ request }: PetInfoCardProps) => {
  const { pets } = usePets();
  
  // Get the pet from context to access reproductive status
  const pet = pets.find(p => p.id === request.id || p.name === request.petName);
  
  const petSpecies = request.petSpecies || request.speciesName || 'Не указано';
  const petBreed = request.petBreed || request.breedName || 'Не указана';

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Основные параметры</h2>
      <div className={styles.detailsGrid}>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Вид животного</span>
          <span className={styles.detailValue}>{petSpecies}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Кличка</span>
          <span className={styles.detailValue}>{request.petName}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Порода</span>
          <span className={styles.detailValue}>{petBreed}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Пол</span>
          <span className={styles.detailValue}>
            {request.gender === 'male' ? 'Самец' : request.gender === 'female' ? 'Самка' : 'Не указан'}
          </span>
        </div>

        {request.birthDate && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Дата рождения</span>
            <span className={styles.detailValue}>
              {new Date(request.birthDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
        )}
  
        {request.birthDate && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Возраст</span>
            <span className={styles.detailValue}>
              {formatAge(request.birthDate)}
            </span>
          </div>
        )}

        {request.colorName && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Окрас</span>
            <span className={styles.detailValue}>{request.colorName}</span>
          </div>
        )}

        {request.passportId && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>ID паспорта</span>
            <span className={styles.detailValue}>{request.passportId}</span>
          </div>
        )}

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Вес (кг)</span>
          <span className={styles.detailValue}>{request.weightKg}</span>
        </div>

        {request.gender === 'female' && pet && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Репродуктивный статус</span>
            <span className={styles.detailValue}>{
             pet.reproductiveStatusName || 'Не указан'
            }</span>
          </div>
          )}

       {pet?.reproductiveStatusName?.toLowerCase().includes('щенность') && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Срок беременности</span>
            <span className={styles.detailValue}>{
            pet.reproductiveSubStatusName || 'Не указан'
            }</span>
          </div>
          )}
        
             
        {pet?.reproductiveStatusName?.toLowerCase().includes('лакт') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Лактационный период</span>
                <span className={styles.detailValue}>{
                pet.reproductiveSubStatusName || 'Не указан'
                }</span>
              </div>
          )}
        {pet?.reproductiveStatusName?.toLowerCase().includes('лакт') && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Количество щенков</span>
                <span className={styles.detailValue}>{pet.puppiesCount || 'Не указано'}</span>
              </div>
        )}


      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Запрос</h2>
      <div className={styles.requestInfo}>
        <div className={styles.requestItem}>
          <span className={styles.requestLabel}>Дата создания:</span>
          <span className={styles.requestValue}>
            {new Date(request.createdAt).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className={styles.requestItem}>
          <span className={styles.requestLabel}>Активность:</span>
          <span className={styles.requestValue}>{request.activityTypeName}</span>
        </div>
        <div className={styles.requestItem}>
          <span className={styles.requestLabel}>Симптомы:</span>
          <span className={styles.requestValue}>{request.symptoms.join(', ')}</span>
        </div>
        {request.comments && (
          <div className={styles.requestItem}>
            <span className={styles.requestLabel}>Комментарий:</span>
            <span className={styles.requestValue}>{request.comments}</span>
          </div>
        )}
      </div>
    </div>
  );
};
