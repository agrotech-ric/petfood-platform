import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import type { OptimizationResult } from '../../context/RequestContext';
import { captureRecommendationCharts } from '../utils/captureRecommendationCharts';
import { exportRecommendationPdf } from '../utils/exportRecommendationPdf';
import type { RecommendationExportMeta } from '../utils/recommendationReport';
import styles from '../styles/RecommendationExportButton.module.css';

type Props = {
  optimizationResult: OptimizationResult;
  meta: RecommendationExportMeta;
  className?: string;
};

export const RecommendationExportButton = ({
  optimizationResult,
  meta,
  className,
}: Props) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const charts = await captureRecommendationCharts();
      exportRecommendationPdf(optimizationResult, meta, charts);
    } catch (err) {
      console.error('PDF export failed:', err);
      window.alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.exportBtn} ${className ?? ''}`}
      onClick={handleExport}
      disabled={isExporting}
      title="Скачать рекомендацию в PDF"
      aria-label="Скачать рекомендацию в PDF"
    >
      <FiDownload className={styles.exportIcon} aria-hidden />
      <span className={styles.exportLabel}>
        {isExporting ? 'Снимаем графики…' : 'Скачать PDF'}
      </span>
    </button>
  );
};
