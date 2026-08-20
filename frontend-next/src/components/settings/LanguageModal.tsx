import { useEffect, useMemo, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { useTranslation } from '../../../context/LanguageContext';
import { LANGUAGE_OPTIONS, type Locale } from '../../../i18n';
import styles from '../../styles/SettingsModals.module.css';

type Props = {
  isOpen: boolean;
  currentLanguage: Locale;
  onClose: () => void;
  onSave: (langCode: Locale) => void | Promise<void>;
};

const LanguageModal = ({ isOpen, currentLanguage, onClose, onSave }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Locale>(currentLanguage);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelected(currentLanguage);
      setSearch('');
    }
  }, [isOpen, currentLanguage]);

  const filtered = useMemo(
    () =>
      LANGUAGE_OPTIONS.filter((lang) => {
        const label = t(lang.labelKey).toLowerCase();
        const sublabel = t(lang.sublabelKey).toLowerCase();
        const query = search.toLowerCase();
        return label.includes(query) || sublabel.includes(query);
      }),
    [search, t],
  );

  const handleOk = async () => {
    setIsSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSearch('');
    setSelected(currentLanguage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{t('language.title')}</h2>

        <div className={styles.searchRow}>
          <MdSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.langList}>
          {filtered.map((lang) => (
            <div
              key={lang.code}
              className={styles.langItem}
              onClick={() => setSelected(lang.code)}
            >
              <div
                className={`${styles.langRadio} ${selected === lang.code ? styles.langRadioSelected : ''}`}
              >
                {selected === lang.code && <div className={styles.langRadioDot} />}
              </div>
              <div className={styles.langNames}>
                <span className={styles.langNamePrimary}>{t(lang.labelKey)}</span>
                <span className={styles.langNameSecondary}>{t(lang.sublabelKey)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={handleOk} disabled={isSaving}>
            {t('common.ok')}
          </button>
          <button className={styles.btnSecondary} onClick={handleClose} disabled={isSaving}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
