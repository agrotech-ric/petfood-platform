import { useState } from 'react';
import styles from '../styles/PetRegistration.module.css';

type PhotoUploadProps = {
  photoPreview: string | null;
  onPhotoChange: (file: File) => void;
  onPhotoDelete: () => void;
  error?: string;
};

const PhotoUpload = ({ photoPreview, error, onPhotoChange, onPhotoDelete }: PhotoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      onPhotoChange(file);
    }
  };

  return (
    <div className={styles.photoWrapper}>
      <label
        className={`${styles.photoUpload} ${isDragging ? styles.photoUploadDragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleChange}
          className={styles.fileInput}
        />
        {photoPreview ? (
          <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
        ) : (
          <div className={styles.photoPlaceholder}>
            <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p>Нажмите или перетащите изображение</p>
          </div>
        )}
      </label>
      {photoPreview && (
        <button
          type="button"
          onClick={onPhotoDelete}
          className={styles.deletePhotoBtn}
          title="Удалить фото"
        >
          ×
        </button>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default PhotoUpload;