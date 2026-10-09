import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ownerService, type PetOwner, type PetOwnerRecord } from '../../services/ownerService'
import { petService, type PetProfileData } from '../../services/petService'
import { useTranslation } from '../../context/LanguageContext'
import ProfileIcon from '../assets/icons/profile.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import DeleteIcon from '../assets/icons/delete.svg?react'
import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'
import styles from './OwnerProfilePage.module.css'

type Tab = 'pets' | 'records' | 'archive'
type OwnerPet = PetProfileData & { photoUrl?: string }

export function OwnerProfilePage() {
  const { ownerId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [owner, setOwner] = useState<PetOwner | null>(null)
  const [pets, setPets] = useState<OwnerPet[]>([])
  const [unassigned, setUnassigned] = useState<PetProfileData[]>([])
  const [active, setActive] = useState<PetOwnerRecord[]>([])
  const [archive, setArchive] = useState<PetOwnerRecord[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedPet, setSelectedPet] = useState('')
  const [tab, setTab] = useState<Tab>('pets')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tabs: Tab[] = ['pets', 'records', 'archive']
  const selectTab = (next: Tab) => setTab(next)
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    else return
    event.preventDefault()
    selectTab(tabs[nextIndex])
    tabRefs.current[nextIndex]?.focus()
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [ownerData, petData, available, activeRecords, archivedRecords] = await Promise.all([
        ownerService.get(ownerId), ownerService.pets(ownerId), ownerService.unassignedPets(),
        ownerService.records(ownerId, 'active'), ownerService.records(ownerId, 'archived'),
      ])
      const petsWithPhotos = await Promise.all(petData.map(async pet => {
        if (!pet.photoObjectKey) return pet
        try {
          const photo = await petService.getPhotoDownloadUrl(pet.photoObjectKey)
          return { ...pet, photoUrl: photo.url }
        } catch {
          return pet
        }
      }))
      setOwner(ownerData); setPets(petsWithPhotos); setUnassigned(available); setActive(activeRecords); setArchive(archivedRecords)
      if (ownerData.avatarObjectKey) {
        const avatar = await ownerService.avatarDownloadUrl(ownerId)
        setAvatarUrl(avatar.url)
      }
    } catch (e) { setError(e instanceof Error ? e.message : t('owner.error.load')) }
    finally { setLoading(false) }
  }, [ownerId, t])

  useEffect(() => { void load() }, [load])

  const removeOwner = async () => {
    if (!confirm(t('owner.confirm.delete'))) return
    try { await ownerService.delete(ownerId); navigate('/owners') } catch (e) { setError(e instanceof Error ? e.message : t('owner.error.delete')) }
  }

  const attach = async () => {
    if (!selectedPet) return
    await ownerService.attachPet(ownerId, selectedPet); setSelectedPet(''); await load()
  }

  if (loading) return <p className={styles.state} role="status">{t('common.loading')}</p>
  if (!owner) return <p className={styles.state} role="alert">{error || t('owner.error.load')}</p>

  const fields = [
    [t('owner.country'), owner.country], [t('owner.city'), owner.city], [t('owner.address'), owner.address],
    [t('owner.phone'), owner.phone], [t('owner.email'), owner.email], [t('owner.telegram'), owner.telegram],
  ]

  return <div className={styles.page}>
    <header className={styles.header}>
      <button className={styles.primary} onClick={() => navigate(-1)}>‹ {t('common.back')}</button>
      <h1>{t('owner.profile')}</h1>
      <div className={styles.actions}><Link className={styles.primary} to={`/owners/${ownerId}/edit`}><EditIcon width={14} height={14} aria-hidden="true" />{t('common.edit')}</Link><button className={styles.secondary} onClick={() => void removeOwner()}><DeleteIcon width={14} height={14} aria-hidden="true" />{t('common.delete')}</button></div>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.identity}>
      <div className={styles.avatar}>{avatarUrl ? <img src={avatarUrl} alt="" /> : <ProfileIcon className={styles.avatarIcon} aria-hidden="true" />}</div>
      <div className={styles.details}><h2>{owner.fullName}</h2><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></div>
      <span className={styles.id}>ID: {owner.id}</span>
    </section>
    <div className={styles.tabs} role="tablist" aria-label={t('owner.profile')}>
      {tabs.map((value, index) => <button key={value} id={`owner-tab-${value}`} ref={element => { tabRefs.current[index] = element }} type="button" role="tab" aria-selected={tab === value} aria-controls={`owner-panel-${value}`} tabIndex={tab === value ? 0 : -1} className={tab === value ? styles.activeTab : ''} onClick={() => selectTab(value)} onKeyDown={event => handleTabKey(event, index)}>{t(`owner.tab.${value}` as 'owner.tab.pets')}</button>)}
    </div>
    <section className={styles.content} id={`owner-panel-${tab}`} role="tabpanel" aria-labelledby={`owner-tab-${tab}`} tabIndex={0}>
      {tab === 'pets' && <>
        <div className={styles.toolbar}>
          <select value={selectedPet} onChange={e => setSelectedPet(e.target.value)}><option value="">{t('owner.pet.select')}</option>{unassigned.map(pet => <option key={pet.id} value={pet.id}>{pet.name} — {pet.breedName || '—'}</option>)}</select>
          <button className={styles.primary} disabled={!selectedPet} onClick={() => void attach()}>{t('owner.pet.attach')}</button>
          <Link className={styles.primary} to="/register-pet" state={{ petOwnerId: ownerId, returnTo: `/owners/${ownerId}` }}>+ {t('owner.pet.add')}</Link>
        </div>
        <div className={styles.petGrid}>{pets.length === 0 ? <p>{t('owner.pet.empty')}</p> : pets.map(pet => <article className={styles.petCard} key={pet.id}><Link className={styles.petLink} to={`/pet-profile/${pet.id}`}><div className={styles.petImageWrap}>{pet.photoUrl ? <img src={pet.photoUrl} alt={pet.name} /> : <span className={styles.petPlaceholder} aria-hidden="true">🐾</span>}<img className={styles.favoriteIcon} src={pet.favorite ? heartOrange : heartWhite} alt={pet.favorite ? t('owner.pet.favorite') : t('owner.pet.notFavorite')} /></div><div className={styles.petMeta}><div><h3>{pet.name}</h3><span>{formatPetAge(pet.birthDate, t)}</span></div><p>{pet.breedName || '—'}</p></div></Link><button className={styles.linkButton} onClick={async () => { if (confirm(t('owner.pet.detachConfirm'))) { await ownerService.detachPet(ownerId, pet.id); await load() } }}>{t('owner.pet.detach')}</button></article>)}</div>
      </>}
      {tab === 'records' && <RecordTable records={active} ownerId={ownerId} archived={false} reload={load} />}
      {tab === 'archive' && <RecordTable records={archive} ownerId={ownerId} archived reload={load} />}
    </section>
  </div>
}

function formatPetAge(birthDate: string | undefined, t: ReturnType<typeof useTranslation>['t']) {
  if (!birthDate) return '—'
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return '—'
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) years -= 1
  if (years < 1) return t('owner.pet.ageUnderOne')
  const last = years % 10
  const lastTwo = years % 100
  const key = last === 1 && lastTwo !== 11 ? 'owner.pet.ageYear' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'owner.pet.ageYearsFew' : 'owner.pet.ageYearsMany'
  return t(key, { count: years })
}

function RecordTable({ records, ownerId, archived, reload }: { records: PetOwnerRecord[]; ownerId: string; archived: boolean; reload: () => Promise<void> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return <>
    <div className={styles.tableWrap}><table><thead><tr><th>{t('owner.record.date')}</th><th>{t('owner.record.topic')}</th><th>{t('owner.record.message')}</th><th>{t('owner.record.actions')}</th></tr></thead><tbody>
      {records.map(record => <tr key={record.id} tabIndex={0} onClick={() => navigate(`/owners/${ownerId}/records/${record.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/owners/${ownerId}/records/${record.id}`) } }}><td>{record.recordDate} {record.recordTime?.slice(0, 5)}</td><td>{record.topic}</td><td>{record.message}</td><td onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>{archived ? <><button className={styles.linkButton} onClick={async () => { await ownerService.restoreRecord(ownerId, record.id); await reload() }}>{t('owner.record.restore')}</button><button className={styles.linkButton} onClick={async () => { if (confirm(t('owner.record.deleteConfirm'))) { await ownerService.deleteRecord(ownerId, record.id); await reload() } }}>{t('common.delete')}</button></> : <><Link to={`/owners/${ownerId}/records/${record.id}/edit`}>{t('common.edit')}</Link><button className={styles.linkButton} onClick={async () => { await ownerService.archiveRecord(ownerId, record.id); await reload() }}>{t('owner.record.archive')}</button></>}</td></tr>)}
    </tbody></table></div>
    {!archived && <Link className={styles.primary} to={`/owners/${ownerId}/records/new`}>+ {t('owner.record.add')}</Link>}
    {archived && records.length > 0 && <button className={styles.secondary} onClick={async () => { if (confirm(t('owner.archive.clearConfirm'))) { await ownerService.clearArchive(ownerId); await reload() } }}>{t('owner.archive.clear')}</button>}
    {records.length === 0 && <p>{t('owner.record.empty')}</p>}
  </>
}
