import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ownerService, type PetOwner, type PetOwnerRecordInput } from '../../services/ownerService'
import { useTranslation } from '../../context/LanguageContext'
import styles from './OwnerRecordPage.module.css'

const today = new Date().toISOString().slice(0, 10)
const initial: PetOwnerRecordInput = { topic: '', recordDate: today, recordTime: '12:00', message: '', useEmail: false, useSms: false, useTelegram: false }

export function OwnerRecordPage({ mode }: { mode: 'create' | 'edit' | 'view' }) {
  const { ownerId = '', recordId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [owner, setOwner] = useState<PetOwner | null>(null)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const readonly = mode === 'view'

  useEffect(() => {
    Promise.all([ownerService.get(ownerId), recordId ? ownerService.record(ownerId, recordId) : Promise.resolve(null)])
      .then(([ownerData, record]) => { setOwner(ownerData); if (record) setForm({ topic: record.topic, recordDate: record.recordDate, recordTime: record.recordTime.slice(0, 5), message: record.message, useEmail: record.useEmail, useSms: record.useSms, useTelegram: record.useTelegram }) })
      .catch(e => setError(e instanceof Error ? e.message : t('owner.error.load')))
      .finally(() => setLoading(false))
  }, [ownerId, recordId, t])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!form.useEmail && !form.useSms && !form.useTelegram) { setError(t('owner.record.channelRequired')); return }
    setSaving(true)
    try { if (mode === 'edit' && recordId) await ownerService.updateRecord(ownerId, recordId, form); else await ownerService.createRecord(ownerId, form); navigate(`/owners/${ownerId}`) }
    catch (err) { setError(err instanceof Error ? err.message : t('owner.error.save')) }
    finally { setSaving(false) }
  }
  const field = (key: keyof PetOwnerRecordInput, value: string | boolean) => setForm(current => ({ ...current, [key]: value }))

  if (loading) return <p className={styles.state} role="status">{t('common.loading')}</p>

  return <div className={styles.page}><header><button type="button" onClick={() => navigate(-1)}>‹ {t('common.back')}</button><h1>{mode === 'create' ? t('owner.record.create') : mode === 'edit' ? t('owner.record.edit') : t('owner.record.title')}</h1><span /></header>
    <form onSubmit={submit} aria-busy={saving}><fieldset disabled={readonly}><label>{t('owner.record.topic')}<input value={form.topic} required onChange={e => field('topic', e.target.value)} /></label><div className={styles.row}><label>{t('owner.record.date')}<input type="date" value={form.recordDate} required onChange={e => field('recordDate', e.target.value)} /></label><label>{t('owner.record.time')}<input type="time" value={form.recordTime} required onChange={e => field('recordTime', e.target.value)} /></label></div><label>{t('owner.record.recipient')}<input value={owner?.fullName || ''} readOnly /></label><h2>{t('owner.record.channels')}</h2>{([['useEmail', 'email'], ['useSms', 'phone'], ['useTelegram', 'telegram']] as const).map(([key, contact]) => { const inputId = `owner-record-${key}`; return <div className={styles.channel} key={key}><input id={inputId} type="checkbox" checked={form[key]} disabled={readonly || !owner?.[contact]} onChange={e => field(key, e.target.checked)} /><label htmlFor={inputId}>{t(`owner.${contact}` as 'owner.email')}</label><input aria-label={t(`owner.${contact}` as 'owner.email')} value={owner?.[contact] || '—'} readOnly /></div> })}<label>{t('owner.record.message')}<textarea value={form.message} required onChange={e => field('message', e.target.value)} /></label></fieldset>{error && <p className={styles.error} role="alert">{error}</p>}{!readonly && <button type="submit" className={styles.save} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</button>}{readonly && recordId && <button type="button" className={styles.save} onClick={() => navigate(`/owners/${ownerId}/records/${recordId}/edit`)}>{t('common.edit')}</button>}</form>
  </div>
}
