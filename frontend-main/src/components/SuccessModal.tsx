import styles from '../styles/SuccessModal.module.css';

type SuccessModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
};

const SuccessModal = ({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  onClose,
}: SuccessModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <button onClick={onClose} className={styles.button}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;