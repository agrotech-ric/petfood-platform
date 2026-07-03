import styles from '../styles/PetInfoCard.module.css';
import type { VetRequest } from '../types/vetRecommendation';
import { formatAge } from '../../src/utils/petUtils';



type PetInfoCardProps = {
  request: VetRequest;
};


export const PetInfoCard = ({ request }: PetInfoCardProps) => {
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

        {request.gender === 'female' && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Репродуктивный статус</span>
            <span className={styles.detailValue}>{
             request.reproductiveStatus === 'pregnancy' ? 'Щенность' : request.reproductiveStatus === 'lactation' ? 'Период лактации' : request.reproductiveStatus
            }</span>
          </div>
          )}

       {request.reproductiveStatus === 'pregnancy' && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Срок беременности</span>
            <span className={styles.detailValue}>{
            request.pregnancyPeriod === 'early_4_weeks' ? 'Первые 4 недели беременности' : request.pregnancyPeriod === 'last_5_weeks' ? 'Последние 5 недель беременности' : 'Не указан'
            }</span>
          </div>
          )}
        
             
        {request.reproductiveStatus === 'lactation' && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Лактационный период</span>
                <span className={styles.detailValue}>{
                request.lactationWeek === 'week_1' ? '1 неделя' : 
                request.lactationWeek === 'week_2' ? '2 неделя' : 
                request.lactationWeek === 'week_3' ? '3 неделя' : 
                request.lactationWeek === 'week_4' ? '4 неделя' : 
                'Не указан'
                }</span>
              </div>
          )}
        {request.reproductiveStatus === 'lactation' && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Количество щенков</span>
                <span className={styles.detailValue}>{request.puppyCount}</span>
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