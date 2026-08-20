import html2canvas from 'html2canvas';

export type RecommendationChartKey =
  | 'composition'
  | 'nutrition'
  | 'macro-minerals'
  | 'trace-minerals'
  | 'vitamins'
  | 'fatty-acids';

export type RecommendationChartImages = Partial<Record<RecommendationChartKey, string>>;

const waitForPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const captureElement = async (element: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
  });
  return canvas.toDataURL('image/png');
};

/** Captures on-screen Recharts blocks marked with data-pdf-chart */
export const captureRecommendationCharts = async (): Promise<RecommendationChartImages> => {
  await waitForPaint();

  const nodes = document.querySelectorAll<HTMLElement>('[data-pdf-chart]');
  const images: RecommendationChartImages = {};

  for (const node of nodes) {
    const key = node.dataset.pdfChart as RecommendationChartKey | undefined;
    if (!key) continue;

    try {
      node.scrollIntoView({ block: 'center', behavior: 'instant' });
      await waitForPaint();
      await new Promise((resolve) => setTimeout(resolve, 200));
      images[key] = await captureElement(node);
    } catch (err) {
      console.warn(`PDF chart capture failed for "${key}":`, err);
    }
  }

  return images;
};
