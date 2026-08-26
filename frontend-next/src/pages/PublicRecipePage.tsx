import { useEffect, useState } from 'react'
import { recipeService } from '../../services/recipeService'
import type { PublicRecipe } from '../../services/shareTypes'
import { useTranslation } from '../../context/LanguageContext'
import { NutrientBalanceChart } from '../components/recipes/NutrientBalanceChart'
import { RECIPE_CHART_COLORS, RecipeDonutChart } from '../components/recipes/RecipeDonutChart'
import { Fact, PhotoPlaceholder, PublicBadge, PublicFooter, PublicHeader, PublicLineChart, PublicState } from '../components/sharing/PublicShareUi'
import { usePublicMetadata } from '../hooks/usePublicMetadata'
import styles from '../styles/PublicShare.module.css'

type ViewState = 'loading' | 'ready' | 'invalid' | 'rate'
const fragmentToken = () => { const value = window.location.hash.slice(1); return value && !value.includes('&') ? value : null }

export function PublicRecipePage() {
  const { t, locale } = useTranslation()
  const [state, setState] = useState<ViewState>('loading')
  const [recipe, setRecipe] = useState<PublicRecipe | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  usePublicMetadata(recipe ? `${recipe.name} — PetFood` : t('public.recipeTitle'))

  useEffect(() => {
    const token = fragmentToken()
    if (!token) { setState('invalid'); return }
    let cancelled = false
    let objectUrl: string | null = null
    recipeService.getPublicRecipe(token).then(async value => {
      if (cancelled) return
      setRecipe(value)
      setState('ready')
      if (value.linkedPet?.photoAvailable) try {
        const photo = await recipeService.getPublicPetPhoto(token)
        if (!cancelled) { objectUrl = URL.createObjectURL(photo.blob); setPhotoUrl(objectUrl) }
      } catch { /* Linked-pet photography is optional. */ }
    }).catch(error => { if (!cancelled) setState((error as { status?: number }).status === 429 ? 'rate' : 'invalid') })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [])

  const dateLabel = (value?: string | null) => {
    if (!value) return t('public.notSpecified')
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale === 'kz' ? 'kk-KZ' : locale).format(date)
  }

  if (state !== 'ready' || !recipe) return <div className={styles.page}><div className={styles.publicContent}><PublicHeader title={t('public.recipeProfileHeading')} /><PublicState kind={state === 'ready' ? 'invalid' : state} /></div><PublicFooter /></div>

  const result = recipe.calculationResult
  const composition = result.composition ?? []
  const nutrition = result.nutrition ?? []
  const nutrients = result.nutrients ?? []
  const minerals = result.minerals ?? []
  const vitamins = result.vitamins ?? []
  const digestion = result.digestion
  const ageLabel = recipe.ageCategory === 'puppies' ? t('public.age.puppies') : recipe.ageCategory === 'adults' ? t('public.age.adults') : recipe.ageCategory === 'senior' ? t('public.age.senior') : recipe.ageCategory
  const sizeLabel = recipe.breedSize === 'small' ? t('public.size.small') : recipe.breedSize === 'medium' ? t('public.size.medium') : recipe.breedSize === 'large' ? t('public.size.large') : recipe.breedSize === 'all' ? t('public.size.all') : recipe.breedSize

  return (
    <div className={styles.page}>
      <main className={styles.publicContent}>
        <PublicHeader title={t('public.recipeProfileHeading')} />

        <section className={`${styles.recipeCard} ${styles.profileCard}`}>
          <div className={styles.recipeTopRow}>
            <div>
              <PublicBadge label={t('public.readOnly')} />
              <h2 className={styles.recipeName}>{recipe.name}</h2>
            </div>
            <span className={styles.calculatedBadge}>{t('public.calculatedRecipe')}</span>
          </div>
          <div className={styles.recipeMeta}>
            <Fact label={t('public.ageCategory')} value={ageLabel} />
            <Fact label={t('public.breedSize')} value={sizeLabel} />
            <Fact label={t('public.weight')} value={recipe.targetWeightKg != null ? `${recipe.targetWeightKg} ${t('public.kg')}` : null} />
            <Fact label={t('public.calculatedAt')} value={dateLabel(recipe.calculatedAt)} />
          </div>
          <p className={styles.descriptionLabel}>{t('public.description')}</p>
          <p className={styles.descriptionText}>{recipe.description || t('public.noDescription')}</p>
        </section>

        {recipe.linkedPet && <section className={`${styles.recipeCard} ${styles.linkedPetCard}`}>
          {photoUrl ? <img className={styles.linkedPetPhoto} src={photoUrl} alt={t('public.petPhoto', { name: recipe.linkedPet.name })} /> : <PhotoPlaceholder className={styles.linkedPetPlaceholder} name={recipe.linkedPet.name} />}
          <div className={styles.linkedPetInfo}><p className={styles.sectionTitle}>{t('public.linkedPet')}</p><h3 className={styles.linkedPetName}>{recipe.linkedPet.name}</h3><p className={styles.petSubline}>{[recipe.linkedPet.speciesName, recipe.linkedPet.breedName].filter(Boolean).join(' · ')}</p><div className={styles.linkedPetFields}><Fact label={t('public.birthDate')} value={dateLabel(recipe.linkedPet.birthDate)} /><Fact label={t('public.weight')} value={recipe.linkedPet.weightKg != null ? `${recipe.linkedPet.weightKg} ${t('public.kg')}` : null} /></div></div>
        </section>}

        <section className={styles.recipeCard}>
          <p className={styles.sectionTitle}>{t('public.parameters')}</p>
          <div className={styles.parameterGrid}>
            <Fact label={t('public.breed')} value={recipe.targetBreedName} />
            <Fact label={t('public.ageMonths')} value={recipe.targetAgeMonths} />
            <Fact label={t('public.gender')} value={recipe.targetGender} />
            <Fact label={t('public.activity')} value={recipe.targetActivityTypeName} />
            <Fact label={t('public.reproductiveStatus')} value={recipe.targetReproductiveStatusName} />
            <Fact label={t('public.healthCondition')} value={recipe.targetHealthConditionName || recipe.targetDisorder} />
            <Fact label={t('public.energy')} value={recipe.targetEnergyKcal != null ? `${recipe.targetEnergyKcal} kcal` : null} />
            <Fact label={t('public.calculationVersion')} value={recipe.calculationVersion} />
          </div>
          {(recipe.symptoms.length > 0 || recipe.maximizeNutrients.length > 0) && <div className={styles.tagColumns}>{recipe.symptoms.length > 0 && <div><p className={styles.descriptionLabel}>{t('public.symptoms')}</p><div className={styles.chips}>{recipe.symptoms.map(value => <span className={styles.chip} key={value}>{value}</span>)}</div></div>}{recipe.maximizeNutrients.length > 0 && <div><p className={styles.descriptionLabel}>{t('public.maximize')}</p><div className={styles.chips}>{recipe.maximizeNutrients.map(value => <span className={styles.chip} key={value}>{value}</span>)}</div></div>}</div>}
        </section>

        <div className={styles.metricsRow}>
          <Metric value={result.calories} unit="kcal" label={t('public.energyValue')} />
          <Metric value={result.dailyNorm} unit="g" label={t('public.dailyPortion')} />
          <Metric value={result.dailyCaloriesNorm} unit="kcal" label={t('public.dailyCalories')} />
        </div>

        {(composition.length > 0 || nutrition.length > 0) && <div className={styles.chartsRow}>
          {composition.length > 0 && <section className={styles.chartCard}><p className={styles.chartTitle}>{t('public.composition')}</p><div className={styles.donutWrapper}><RecipeDonutChart data={composition.map((item, index) => ({ name: item.label, value: item.percent, color: item.color ?? RECIPE_CHART_COLORS[index % RECIPE_CHART_COLORS.length], label: `${item.percent}%` }))} /></div><table className={styles.table}><thead><tr><th>{t('public.ingredients')}</th><th>%</th><th>{t('public.grams')}</th></tr></thead><tbody>{composition.map((item, index) => { const color = item.color ?? RECIPE_CHART_COLORS[index % RECIPE_CHART_COLORS.length]; return <tr key={`${item.label}-${index}`}><td><span className={styles.legendName}><span className={styles.legendDot} style={{ background: color }} />{item.label}</span></td><td>{item.percent}%</td><td>{item.grams} g</td></tr> })}</tbody></table></section>}
          {nutrition.length > 0 && <section className={styles.chartCard}><p className={styles.chartTitle}>{t('public.nutrition')}</p><div className={styles.donutWrapper}><RecipeDonutChart data={nutrition.map((item, index) => ({ name: item.label, value: item.value, color: item.color ?? RECIPE_CHART_COLORS[index % RECIPE_CHART_COLORS.length], label: `${item.value} ${item.unit}` }))} /></div><p className={styles.legendHeading}>{t('public.per100')}</p><div className={styles.donutLegend}>{nutrition.map((item, index) => <div className={styles.donutLegendRow} key={`${item.label}-${index}`}><span className={styles.legendName}><span className={styles.legendDot} style={{ background: item.color ?? RECIPE_CHART_COLORS[index % RECIPE_CHART_COLORS.length] }} />{item.label}</span><span>{item.value} {item.unit}</span></div>)}</div>{result.nutritionPer100 && <p className={styles.nutritionSummary}>{t('public.energyValue')}: {result.nutritionPer100.calories} kcal</p>}</section>}
        </div>}

        {(nutrients.length > 0 || minerals.length > 0 || vitamins.length > 0) && <section className={`${styles.recipeCard} ${styles.nutrientsCard}`}><p className={styles.sectionTitle}>{t('public.nutrientContent')}</p>{nutrients.length > 0 && <div className={styles.nutrientsGrid}>{nutrients.map((item, index) => <div className={styles.nutrientRow} key={`${item.label}-${index}`}><strong>{item.label}</strong><span>{item.value} {item.unit}</span></div>)}</div>}{(minerals.length > 0 || vitamins.length > 0) && <div className={styles.balanceCharts}>{minerals.length > 0 && <NutrientBalanceChart title={t('public.minerals')} items={minerals} />}{vitamins.length > 0 && <NutrientBalanceChart title={t('public.vitamins')} items={vitamins} />}</div>}</section>}

        <section className={styles.recipeCard}><p className={styles.sectionTitle}>{t('public.ingredients')}</p><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t('public.name')}</th><th>{t('public.category')}</th><th>{t('public.range')}</th><th>{t('public.result')}</th></tr></thead><tbody>{recipe.ingredients.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}{item.subtype ? ` · ${item.subtype}` : ''}</td><td>{item.category}</td><td>{item.minPercent}–{item.maxPercent}%</td><td>{item.resultPercent ?? '—'}% / {item.resultGrams ?? '—'} g</td></tr>)}</tbody></table></div></section>

        {recipe.nutrientConstraints.length > 0 && <section className={styles.recipeCard}><p className={styles.sectionTitle}>{t('public.constraints')}</p><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t('public.name')}</th><th>{t('public.minimum')}</th><th>{t('public.maximum')}</th></tr></thead><tbody>{recipe.nutrientConstraints.map(item => <tr key={item.nutrientKey}><td>{item.nutrientKey}</td><td>{item.minValue}</td><td>{item.maxValue}</td></tr>)}</tbody></table></div></section>}

        {digestion && <section className={`${styles.recipeCard} ${styles.digestionCard}`}><p className={styles.sectionTitle}>{t('public.savedDigestibility')}</p><div className={styles.digestionCharts}>{digestion.protein?.length > 0 && <DigestionChart title={t('public.protein')} data={digestion.protein} color="#f47f4b" />}{digestion.fat?.length > 0 && <DigestionChart title={t('public.fat')} data={digestion.fat} color="#f59e0b" />}{digestion.carbs?.length > 0 && <DigestionChart title={t('public.carbs')} data={digestion.carbs} color="#10b981" />}</div></section>}
      </main>
      <PublicFooter />
    </div>
  )
}

function Metric({ value, unit, label }: { value?: number; unit: string; label: string }) {
  return <div className={styles.metricCard}><p className={styles.metricValue}>{value ?? '—'} {unit}</p><p className={styles.metricLabel}>{label}</p></div>
}

function DigestionChart({ title, data, color }: { title: string; data: Array<{ time: number; remaining: number }>; color?: string }) {
  return <div><p className={styles.chartTitle}>{title}</p><PublicLineChart data={data.map(item => ({ label: String(item.time), value: item.remaining }))} yLabel={title} color={color} /></div>
}
