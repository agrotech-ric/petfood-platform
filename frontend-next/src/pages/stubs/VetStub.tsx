import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ownerService, type PetOwner } from '../../../services/ownerService'
import { useTranslation } from '../../../context/LanguageContext'
import ProfileIcon from '../../assets/icons/profile.svg?react'
import dashboardStyles from '../PetsListPage.module.css'
import styles from './OwnersListPage.module.css'

type OwnerListItem = PetOwner & { avatarUrl?: string }

async function enrichWithAvatars(owners: PetOwner[]): Promise<OwnerListItem[]> {
  return Promise.all(owners.map(async owner => {
    if (!owner.avatarObjectKey) return owner
    try {
      const avatar = await ownerService.avatarDownloadUrl(owner.id)
      return { ...owner, avatarUrl: avatar.url }
    } catch {
      return owner
    }
  }))
}

export function OwnersListPage() {
  const { t } = useTranslation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [owners, setOwners] = useState<OwnerListItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const result = await ownerService.search(query)
        const enriched = await enrichWithAvatars(result)
        if (!cancelled) setOwners(enriched)
      } catch (cause) {
        if (!cancelled) {
          setOwners([])
          setError(cause instanceof Error ? cause.message : t('owner.error.load'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, t])

  return <>
    <div className={dashboardStyles.topBar}>
      <div className={dashboardStyles.headerSpacer} aria-hidden="true" />
      <h1 className={dashboardStyles.pageTitle}>{t('owner.list')}</h1>
      <Link className={`${dashboardStyles.registerBtn} ${styles.createLink}`} to="/owners/create">
        + {t('owner.create')}
      </Link>
    </div>

    <div className={dashboardStyles.contentCard}>
      <div className={dashboardStyles.searchContainer}>
        <div className={dashboardStyles.searchRow}>
          <div className={dashboardStyles.searchInputWrap}>
            <input
              ref={searchRef}
              className={dashboardStyles.searchInput}
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('owner.search')}
            />
            <button
              className={dashboardStyles.searchBtn}
              type="button"
              onClick={() => searchRef.current?.focus()}
              aria-label={t('owner.search')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className={`${dashboardStyles.empty} ${styles.error}`} role="alert">{error}</p>
      ) : loading ? (
        <p className={dashboardStyles.empty} role="status">{t('common.loading')}</p>
      ) : owners.length === 0 ? (
        <p className={dashboardStyles.empty}>{t('owner.search.empty')}</p>
      ) : (
        <div className={dashboardStyles.cardsGrid}>
          {owners.map(owner => <OwnerCard key={owner.id} owner={owner} />)}
        </div>
      )}
    </div>
  </>
}

function OwnerCard({ owner }: { owner: OwnerListItem }) {
  const { t } = useTranslation()
  const contact = owner.phone || owner.email || owner.telegram || t('owner.contacts.empty')

  return <Link className={dashboardStyles.petCard} to={`/owners/${owner.id}`}>
    <div className={dashboardStyles.petImageWrap}>
      {owner.avatarUrl ? (
        <img className={dashboardStyles.petImage} src={owner.avatarUrl} alt={owner.fullName} />
      ) : (
        <div className={`${dashboardStyles.petImagePlaceholder} ${styles.avatarPlaceholder}`}>
          <ProfileIcon aria-hidden="true" />
        </div>
      )}
    </div>
    <div className={dashboardStyles.petMeta}>
      <div className={dashboardStyles.petMetaRow}>
        <span className={dashboardStyles.petName}>{owner.fullName || t('owner.placeholder')}</span>
        <span className={dashboardStyles.petAge}>{t('owner.pet.count')}: {owner.petCount}</span>
      </div>
      <span className={dashboardStyles.petBreed}>{contact}</span>
    </div>
  </Link>
}
