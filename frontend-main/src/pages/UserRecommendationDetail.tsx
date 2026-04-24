import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { apiClient } from '../utils/apiClient';
import { useRequests } from '../../context/RequestContext';
import type { OptimizationResult } from '../../context/RequestContext';
import styles from '../styles/VetRecommendationView.module.css';

const COLORS = ['#4A90E2', '#7FDB6A', '#FF9F5A', '#E74C3C', '#9B59B6'];

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
  payload: OptimizationResult;
};

export const UserRecommendationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchRequestById } = useRequests();
  const [recommendation, setRecommendation] = useState<SavedRecommendation | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const recommendationData = await apiClient.get<SavedRecommendation>(
        `/api/v1/pets/health-records/${id}/recommendation`
      );
      setRecommendation(recommendationData);

      try {
        const requestData = await fetchRequestById(id);
        setRequest(requestData);
      } catch (err) {
        console.warn('Could not fetch request details:', err);
        setRequest(null);
      }
    } catch (err) {
      console.error('Failed to fetch recommendation:', err);
      setError('Не удалось загрузить рекомендацию');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToProfile = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <button className={styles.backBtn} onClick={handleBackToProfile}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            Назад
          </button>
          <h1 className={styles.title}>Загрузка...</h1>
        </div>
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <button className={styles.backBtn} onClick={handleBackToProfile}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            Назад
          </button>
          <h1 className={styles.title}>Ошибка</h1>
        </div>
        <main className={styles.main}>
          <div className={styles.subtitleSection}>
            <p className={styles.subtitle}>{error || 'Рекомендация не найдена'}</p>
          </div>
        </main>
      </div>
    );
  }

  const { payload: optimizationResult } = recommendation;
  const petName = request?.petName || 'Питомец';

  let formattedDate = '';
  try {
    const date = new Date(recommendation.createdAt);
    if (!isNaN(date.getTime())) {
      formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
    } else {
      formattedDate = new Date().toLocaleDateString('ru-RU');
    }
  } catch {
    formattedDate = new Date().toLocaleDateString('ru-RU');
  }

  const compositionData = optimizationResult.composition
    .filter(item => item.grams_per_100g > 0)
    .map(item => ({
      name: item.ingredient,
      value: parseFloat(item.grams_per_100g.toFixed(2))
    }));

  const compositionTableData = optimizationResult.composition
    .filter(item => item.grams_per_100g > 0)
    .map(item => ({
      ingredient: item.ingredient,
      percentage: item.grams_per_100g,
      grams: parseFloat(((item.grams_per_100g / 100) * optimizationResult.total_feed_grams).toFixed(2))
    }));

  const nutritionData = optimizationResult.nutritional_value_per_100g
    .map(item => ({
      name: item.nutrient,
      value: parseFloat(item.value_per_100g.toFixed(2))
    }));

  const categorizeNutrient = (nutrientName: string): string => {
    const name = nutrientName.toLowerCase();

    if (['кальций', 'фосфор', 'магний', 'калий', 'натрий'].some(m => name.includes(m))) {
      return 'macrominerals';
    }

    if (['железо', 'цинк', 'медь', 'марганец', 'селен', 'йод'].some(m => name.includes(m))) {
      return 'traceMinerals';
    }

    if (name.includes('витамин') || name.includes('холин') ||
        name === 'пантотеновая кислота' || name === 'фолиевая кислота') {
      return 'vitamins';
    }

    if (name.includes('кислота') && !name.includes('пантотеновая') && !name.includes('фолиевая')) {
      return 'fattyAcids';
    }

    return 'other';
  };

  const allNutrients = Object.keys(optimizationResult.nutrient_deficiencies);

  const categorizedNutrients = {
    macrominerals: [] as string[],
    traceMinerals: [] as string[],
    vitamins: [] as string[],
    fattyAcids: [] as string[],
    other: [] as string[]
  };

  allNutrients.forEach(nutrient => {
    const category = categorizeNutrient(nutrient);
    categorizedNutrients[category as keyof typeof categorizedNutrients].push(nutrient);
  });

  const createNutrientData = (nutrientList: string[], nameKey: string) => {
    return nutrientList.map(nutrient => {
      const nutritionItem = optimizationResult.nutritional_value_total.find(
        item => item.nutrient === nutrient
      );

      const current = nutritionItem ? parseFloat(nutritionItem.value_per_100g.toFixed(2)) : 0;
      const deficiencyStr = optimizationResult.nutrient_deficiencies[nutrient];
      const normalValue = deficiencyStr ? parseFloat(deficiencyStr) : 0;
      const percentage = normalValue > 0 ? Math.round((current / normalValue) * 100) : 0;
      const unit = nutritionItem?.unit || 'мг';

      const cleanName = nutrient.replace(/\s*\([^)]*\)/g, '');

      return {
        [nameKey]: cleanName,
        currentPercent: percentage,
        normalPercent: 100,
        currentValue: current,
        normalValue: normalValue,
        percentage: `${percentage}%`,
        unit: unit
      };
    });
  };

  const macroMineralsData = createNutrientData(categorizedNutrients.macrominerals, 'mineral');
  const traceMineralsData = createNutrientData(categorizedNutrients.traceMinerals, 'mineral');
  const vitaminsData = createNutrientData(categorizedNutrients.vitamins, 'vitamin');
  const fattyAcidsData = createNutrientData(categorizedNutrients.fattyAcids, 'acid');

  const targetKcalDisplay = optimizationResult.total_feed_grams * optimizationResult.energy_per_100g / 100;

  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#666"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const currentPercent = data?.currentPercent || 0;
      const currentValue = data?.currentValue || 0;
      const normalValue = data?.normalValue || 0;
      const unit = data?.unit || 'мг';

      const status = currentPercent < 50 ? 'Дефицит' : currentPercent < 80 ? 'Недостаточно' : currentPercent < 120 ? 'Норма' : 'Избыток';
      const statusColor = currentPercent < 50 ? '#E74C3C' : currentPercent < 80 ? '#FF9F5A' : currentPercent < 120 ? '#7FDB6A' : '#F2704C';

      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipTitle}>{label}</p>
          <p className={styles.tooltipCurrent}>
            <strong>Текущее:</strong> {currentValue.toFixed(2)} {unit}
          </p>
          <p className={styles.tooltipNormal}>
            <strong>Норма:</strong> {normalValue.toFixed(2)} {unit}
          </p>
          <p className={styles.tooltipCoverage}>
            <strong>Покрытие:</strong> <span style={{ color: statusColor }}>{currentPercent}%</span>
          </p>
          <p className={styles.tooltipStatus} style={{ color: statusColor }}>
            {status}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <button className={styles.backBtn} onClick={handleBackToProfile}>
          <MdKeyboardArrowLeft className={styles.backIcon} />
          Назад
        </button>
        <h1 className={styles.title}>Рекомендация от {formattedDate}</h1>
      </div>

      <main className={styles.main}>
        <div className={styles.descriptionSection}>
          <p className={styles.description}>
            Ниже представлена <span className={styles.highlightText}>полноценная ранняя оценка</span>, сформированная на основе доступных данных, с <span className={styles.highlightText}>детализированной процентной разбивкой по каждому ингредиенту</span> на {formattedDate}.
          </p>
          <p className={styles.description}>
            Оценка подготовлена индивидуально для питомца по кличке <span className={styles.highlightText}>{petName}</span> и отражает текущий анализ состава с акцентом на баланс минералов, витаминов, а также питательной ценности и вклад каждого компонента в общий рацион.
          </p>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <h2 className={styles.metricValue}>{targetKcalDisplay.toFixed(1)} ккал</h2>
            <p className={styles.metricLabel}>Целевая Энергия (МЭ)</p>
          </div>
          <div className={styles.metricCard}>
            <h2 className={styles.metricValue}>{optimizationResult.total_feed_grams.toFixed(2)} г</h2>
            <p className={styles.metricLabel}>Общая Масса Корма</p>
          </div>
          <div className={styles.metricCard}>
            <h2 className={styles.metricValue}>{optimizationResult.energy_per_100g.toFixed(2)} ккал</h2>
            <p className={styles.metricLabel}>Энерг. Плотность / 100 г</p>
          </div>
        </div>

        <div className={styles.chartsContainer}>
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Состав рациона</h2>
            <div className={styles.chartWithTable}>
              <div className={styles.pieChartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.value}%`}
                    >
                      {compositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.compositionTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ингредиенты</th>
                      <th>%</th>
                      <th>грамм</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compositionTableData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className={styles.colorIndicator}
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></span>
                          {item.ingredient}
                        </td>
                        <td>{item.percentage}%</td>
                        <td>{item.grams} г.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Питательная ценность</h2>
            <div className={styles.nutritionContent}>
              <div className={styles.pieChartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nutritionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.value} г`}
                    >
                      {nutritionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.nutritionDetails}>
                <h3 className={styles.nutritionTitle}>Питательная ценность на 100 г:</h3>
                <ul className={styles.nutritionList}>
                  {optimizationResult.nutritional_value_per_100g.map((item, index) => (
                    <li key={index} className={styles.nutritionItem}>
                      <span
                        className={styles.colorIndicator}
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className={styles.nutrientName}>{item.nutrient}</span>
                      <span className={styles.nutrientValue}>{item.value_per_100g.toFixed(2)} {item.unit}</span>
                    </li>
                  ))}
                </ul>
                <p className={styles.energyValue}>
                  Энергетическая ценность: {optimizationResult.energy_per_100g.toFixed(2)} ккал
                </p>
              </div>
            </div>
          </div>
        </div>

        {macroMineralsData.length > 0 && traceMineralsData.length > 0 && (
          <div className={styles.balanceChartsRow}>
            <div className={styles.balanceChart}>
              <h2 className={styles.sectionTitle}>Баланс макроминералов</h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={macroMineralsData}
                  margin={{ top: 50, right: 30, bottom: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mineral"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ angle: -90, position: 'insideLeft', style: { fontSize: 13 } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '0px' }} />
                  <Bar dataKey="normalPercent" fill="#9E9E9E" name="Норма" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentPercent" fill="#4A90E2" name="Текущее" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.balanceChart}>
              <h2 className={styles.sectionTitle}>Баланс микроэлементов</h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={traceMineralsData}
                  margin={{ top: 50, right: 30, bottom: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mineral"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ angle: -90, position: 'insideLeft', style: { fontSize: 13 } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '0px' }} />
                  <Bar dataKey="normalPercent" fill="#9E9E9E" name="Норма" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentPercent" fill="#7FDB6A" name="Текущее" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {vitaminsData.length > 0 && fattyAcidsData.length > 0 && (
          <div className={styles.balanceChartsRow}>
            <div className={styles.balanceChart}>
              <h2 className={styles.sectionTitle}>Баланс витаминов</h2>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart
                  data={vitaminsData}
                  margin={{ top: 50, right: 30, bottom: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="vitamin"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ angle: -90, position: 'insideLeft', style: { fontSize: 13 } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '0px' }} />
                  <Bar dataKey="normalPercent" fill="#9E9E9E" name="Норма" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentPercent" fill="#9B59B6" name="Текущее" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.balanceChart}>
              <h2 className={styles.sectionTitle}>Баланс жирных кислот</h2>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart
                  data={fattyAcidsData}
                  margin={{ top: 50, right: 30, bottom: 100, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="acid"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    label={{ angle: -90, position: 'insideLeft', style: { fontSize: 13 } }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '0px' }} />
                  <Bar dataKey="normalPercent" fill="#9E9E9E" name="Норма" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentPercent" fill="#FF9F5A" name="Текущее" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};