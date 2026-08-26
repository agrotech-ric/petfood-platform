import { useEffect, useMemo, useState } from 'react'
import { petService } from '../../services/petService'
import type { PublicPetProfile } from '../../services/shareTypes'
import { useTranslation } from '../../context/LanguageContext'
import { Fact, PhotoPlaceholder, PublicBadge, PublicFooter, PublicHeader, PublicLineChart, PublicState } from '../components/sharing/PublicShareUi'
import { usePublicMetadata } from '../hooks/usePublicMetadata'
import styles from '../styles/PublicShare.module.css'

type ViewState = 'loading' | 'ready' | 'invalid' | 'rate'
type Tab = 'food' | 'condition' | 'history' | 'contra' | 'weight' | 'activity'
const fragmentToken = () => {
  const value = window.location.hash.slice(1)
  return value && !value.includes('&') ? value : null
}

export function PublicPetPage() {
  const { t, locale } = useTranslation()
  const [state, setState] = useState<ViewState>('loading')
  const [profile, setProfile] = useState<PublicPetProfile | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('food')
  usePublicMetadata(profile ? `${profile.pet.name} — PetFood` : t('public.petTitle'))

  useEffect(() => {
    const token = fragmentToken()
    if (!token) {
      setState('invalid')
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    petService
      .getPublicProfile(token)
      .then(async (value) => {
        if (cancelled) return
        setProfile(value)
        setState('ready')
        if (value.pet.photoAvailable) {
          try {
            const photo = await petService.getPublicPhoto(token)
            if (!cancelled) {
              objectUrl = URL.createObjectURL(photo.blob)
              setPhotoUrl(objectUrl)
            }
          } catch {
            /* A profile remains readable when its optional photo is unavailable. */
          }
        }
      })
      .catch((error) => {
        if (!cancelled) setState((error as { status?: number }).status === 429 ? 'rate' : 'invalid')
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  const dateLabel = (value?: string | null) => {
    if (!value) return t('public.notSpecified')
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(locale === 'kz' ? 'kk-KZ' : locale).format(date)
  }

  const genderLabel = (value?: string | null) => {
    if (!value) return t('public.notSpecified')
    const normalized = value.toLowerCase()
    if (normalized === 'male') return t('public.gender.male')
    if (normalized === 'female') return t('public.gender.female')
    return value
  }

  const allRecordsAsc = useMemo(
    () =>
      [...(profile?.healthRecords ?? [])].sort((a, b) =>
        String(a.recordDate ?? '').localeCompare(String(b.recordDate ?? ''))
      ),
    [profile]
  )

  const allRecordsDesc = useMemo(
    () =>
      [...(profile?.healthRecords ?? [])].sort((a, b) =>
        String(b.recordDate ?? '').localeCompare(String(a.recordDate ?? ''))
      ),
    [profile]
  )

  const currentCondition = useMemo(() => {
    return (
      allRecordsDesc.find((r) => r.conditionStatus !== 'history' && r.conditionName) ||
      allRecordsDesc[0] ||
      null
    )
  }, [allRecordsDesc])

  const diseaseHistory = useMemo(() => {
    const historyOnly = allRecordsDesc.filter((r) => r.conditionStatus === 'history' && r.conditionName)
    if (historyOnly.length > 0) return historyOnly
    return allRecordsDesc.filter((r) => r !== currentCondition && r.conditionName)
  }, [allRecordsDesc, currentCondition])

  const weightData = allRecordsAsc
    .filter((item) => item.weightKg != null)
    .map((item) => ({ label: dateLabel(item.recordDate), value: Number(item.weightKg) }))

  const activityData = allRecordsAsc
    .filter((item) => item.activityHours != null)
    .map((item) => ({ label: dateLabel(item.recordDate), value: Number(item.activityHours) }))

  if (state !== 'ready' || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.publicContent}>
          <PublicHeader title={t('public.petProfileHeading')} />
          <PublicState kind={state === 'ready' ? 'invalid' : state} />
        </div>
        <PublicFooter />
      </div>
    )
  }

  const pet = profile.pet
  const isFemale = pet.gender?.toLowerCase() === 'female'

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'food', label: t('public.tabs.food') },
    { id: 'condition', label: t('public.currentCondition') },
    { id: 'history', label: t('public.healthHistory') },
    { id: 'contra', label: t('public.contraindications') },
    { id: 'weight', label: t('public.weightChart') },
    { id: 'activity', label: t('public.activityChart') },
  ]

  const ageLabel = (value: string) =>
    value === 'puppies'
      ? t('public.age.puppies')
      : value === 'adults'
      ? t('public.age.adults')
      : value === 'senior'
      ? t('public.age.senior')
      : value

  const sizeLabel = (value: string) =>
    value === 'small'
      ? t('public.size.small')
      : value === 'medium'
      ? t('public.size.medium')
      : value === 'large'
      ? t('public.size.large')
      : value === 'all'
      ? t('public.size.all')
      : value

  return (
    <div className={styles.page}>
      <main className={styles.publicContent}>
        <PublicHeader title={t('public.petProfileHeading')} />
        <section className={styles.petCard}>
          {photoUrl ? (
            <img
              className={styles.petPhoto}
              src={photoUrl}
              alt={t('public.petPhoto', { name: pet.name })}
            />
          ) : (
            <PhotoPlaceholder name={pet.name} />
          )}
          <div className={styles.petInfoMain}>
            <div className={styles.petInfoLeft}>
              <PublicBadge label={t('public.readOnly')} />
              <h2 className={styles.petName}>{pet.name}</h2>
              <p className={styles.petSubline}>
                {[pet.speciesName, pet.breedName].filter(Boolean).join(' · ') ||
                  t('public.notSpecified')}
              </p>
              <div className={styles.petFields}>
                <Fact label={t('public.gender')} value={genderLabel(pet.gender)} />
                <Fact label={t('public.birthDate')} value={dateLabel(pet.birthDate)} />
                <Fact
                  label={t('public.weight')}
                  value={pet.weightKg != null ? `${pet.weightKg} ${t('public.kg')}` : null}
                />
                <Fact label={t('public.color')} value={pet.colorName} />
                {isFemale && (
                  <>
                    <Fact
                      label={t('public.reproductiveStatus')}
                      value={
                        [pet.reproductiveStatusName, pet.reproductiveSubStatusName]
                          .filter(Boolean)
                          .join(' · ') || null
                      }
                    />
                    {pet.puppiesCount != null && pet.puppiesCount > 0 && (
                      <Fact label={t('public.puppies')} value={pet.puppiesCount} />
                    )}
                  </>
                )}
              </div>
            </div>
            <div className={styles.petInfoRight}>
              <p className={styles.descriptionLabel}>{t('public.description')}</p>
              <p className={styles.descriptionText}>
                {pet.comments || t('public.noDescription')}
              </p>
              <p className={styles.updatedText}>
                {t('public.updatedAt')}: {dateLabel(pet.updatedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.tabsCard}>
          <div className={styles.tabsRow} role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.tabContent} role="tabpanel">
            {activeTab === 'food' &&
              (profile.recipes.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('public.name')}</th>
                        <th>{t('public.ageCategory')}</th>
                        <th>{t('public.breedSize')}</th>
                        <th>{t('public.calories')}</th>
                        <th>{t('public.calculatedAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.recipes.map((recipe, index) => (
                        <tr key={`${recipe.name}-${index}`}>
                          <td>
                            <strong>{recipe.name}</strong>
                            <span className={styles.tableDescription}>
                              {recipe.description || t('public.noDescription')}
                            </span>
                          </td>
                          <td>{ageLabel(recipe.ageCategory)}</td>
                          <td>{sizeLabel(recipe.breedSize)}</td>
                          <td>{recipe.calories != null ? `${recipe.calories} kcal` : '—'}</td>
                          <td>{dateLabel(recipe.calculatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.emptyText}>{t('public.noRecipes')}</p>
              ))}

            {activeTab === 'condition' &&
              (currentCondition ? (
                <div className={styles.conditionGrid}>
                  <div>
                    <p className={styles.sectionTitle}>{t('public.currentCondition')}</p>
                    <Fact label={t('public.date')} value={dateLabel(currentCondition.recordDate)} />
                    <Fact
                      label={t('public.disease')}
                      value={currentCondition.conditionName || t('public.notSpecified')}
                    />
                    <Fact label={t('public.activity')} value={currentCondition.activityTypeName} />
                  </div>
                  <div>
                    <p className={styles.descriptionLabel}>{t('public.symptoms')}</p>
                    {currentCondition.symptoms && currentCondition.symptoms.length > 0 ? (
                      <div className={styles.chips}>
                        {currentCondition.symptoms.map((value) => (
                          <span className={styles.chip} key={value}>
                            {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyText}>{t('public.none')}</p>
                    )}
                    <p className={styles.descriptionLabel}>{t('public.notes')}</p>
                    <p className={styles.descriptionText}>
                      {currentCondition.notes || t('public.none')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyText}>{t('public.noHealth')}</p>
              ))}

            {activeTab === 'history' &&
              (diseaseHistory.length ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('public.date')}</th>
                        <th>{t('public.disease')}</th>
                        <th>{t('public.activity')}</th>
                        <th>{t('public.symptoms')}</th>
                        <th>{t('public.notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diseaseHistory.map((item, index) => (
                        <tr key={`${item.recordDate}-${index}`}>
                          <td>{dateLabel(item.recordDate)}</td>
                          <td>{item.conditionName || '—'}</td>
                          <td>{item.activityTypeName || '—'}</td>
                          <td>
                            {item.symptoms && item.symptoms.length > 0
                              ? item.symptoms.join(', ')
                              : '—'}
                          </td>
                          <td>{item.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.emptyText}>{t('public.noHealth')}</p>
              ))}

            {activeTab === 'contra' && (
              <div>
                <p className={styles.sectionTitle}>{t('public.contraindications')}</p>
                {profile.contraindications.ingredients.length ? (
                  <div className={styles.chips}>
                    {profile.contraindications.ingredients.map((value) => (
                      <span className={styles.chip} key={value}>
                        {value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyText}>{t('public.none')}</p>
                )}
                {profile.contraindications.description && (
                  <p className={styles.descriptionText}>
                    {profile.contraindications.description}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'weight' &&
              (weightData.length ? (
                <div className={styles.chartLayout}>
                  <div>
                    <p className={styles.chartSectionTitle}>{t('public.weightChart')}</p>
                    <PublicLineChart
                      data={weightData}
                      yLabel={`${t('public.weight')}, ${t('public.kg')}`}
                    />
                  </div>
                  <HistoryTable
                    points={weightData}
                    valueLabel={`${t('public.weight')}, ${t('public.kg')}`}
                    dateLabel={t('public.date')}
                  />
                </div>
              ) : (
                <p className={styles.emptyText}>{t('public.noHistory')}</p>
              ))}

            {activeTab === 'activity' &&
              (activityData.length ? (
                <div className={styles.chartLayout}>
                  <div>
                    <p className={styles.chartSectionTitle}>{t('public.activityChart')}</p>
                    <PublicLineChart data={activityData} yLabel={t('public.hours')} />
                  </div>
                  <HistoryTable
                    points={activityData}
                    valueLabel={t('public.hours')}
                    dateLabel={t('public.date')}
                  />
                </div>
              ) : (
                <p className={styles.emptyText}>{t('public.noHistory')}</p>
              ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function HistoryTable({
  points,
  valueLabel,
  dateLabel,
}: {
  points: Array<{ label: string; value: number }>
  valueLabel: string
  dateLabel: string
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{dateLabel}</th>
            <th>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points
            .slice()
            .reverse()
            .map((item, index) => (
              <tr key={`${item.label}-${index}`}>
                <td>{item.label}</td>
                <td>{item.value}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
