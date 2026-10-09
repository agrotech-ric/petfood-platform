import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ownerService, type PetOwner } from '../../../services/ownerService'
import { useTranslation } from '../../../context/LanguageContext'

export function OwnersListPage() {
  const { t } = useTranslation()
  const [owners, setOwners] = useState<PetOwner[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => ownerService.search(query).then(setOwners).catch(e => setError(e instanceof Error ? e.message : t('owner.error.load'))), 250); return () => clearTimeout(timer) }, [query, t])
  return <div style={{ padding: 24, maxWidth: 1100, margin: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}><h1>{t('owner.list')}</h1><Link className="button" to="/owners/create">+ {t('owner.create')}</Link></div>
    <input style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 24 }} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('owner.search')} />
    {error && <p>{error}</p>}
    <div style={{ display: 'grid', gap: 12 }}>{owners.map(owner => <Link key={owner.id} to={`/owners/${owner.id}`} style={{ padding: 20, border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text)', background: 'var(--color-surface)', textDecoration: 'none' }}><strong>{owner.fullName || t('owner.placeholder')}</strong><div>{owner.phone || owner.email || owner.telegram || '—'} · {t('owner.pet.count')}: {owner.petCount}</div></Link>)}</div>
  </div>
}

