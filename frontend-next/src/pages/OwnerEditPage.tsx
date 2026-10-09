import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ownerService, type PetOwnerInput } from '../../services/ownerService'
import { useTranslation } from '../../context/LanguageContext'
import styles from './OwnerFormPage.module.css'

const empty: PetOwnerInput = { fullName: '', country: '', city: '', address: '', phone: '', email: '', telegram: '', avatarObjectKey: '' }

export function OwnerEditPage() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [form, setForm] = useState<PetOwnerInput>(empty)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ownerId) return
    ownerService.get(ownerId).then(owner => {
      setForm({ fullName: owner.fullName, country: owner.country || '', city: owner.city || '', address: owner.address || '', phone: owner.phone || '', email: owner.email || '', telegram: owner.telegram || '', avatarObjectKey: owner.avatarObjectKey || '' })
      if (owner.avatarObjectKey) ownerService.avatarDownloadUrl(ownerId).then(result => setPreview(result.url)).catch(() => undefined)
    }).catch(e => setError(e instanceof Error ? e.message : t('owner.error.load')))
  }, [ownerId, t])

  const update = (key: keyof PetOwnerInput, value: string) => setForm(current => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!form.fullName.trim()) { setError(t('owner.validation.name')); return }
    setSaving(true)
    try {
      let saved = ownerId ? await ownerService.update(ownerId, form) : await ownerService.create(form)
      if (avatar) {
        const upload = await ownerService.avatarUploadUrl(saved.id, avatar)
        await ownerService.uploadAvatar(upload.url, avatar)
        saved = await ownerService.update(saved.id, { ...form, avatarObjectKey: upload.objectKey })
      }
      const state = location.state as { returnTo?: string } | null
      navigate(state?.returnTo || `/owners/${saved.id}`, { state: { newOwnerId: saved.id } })
    } catch (e) { setError(e instanceof Error ? e.message : t('owner.error.save')) }
    finally { setSaving(false) }
  }

  return <div className={styles.page}>
    <header className={styles.header}><button type="button" onClick={() => navigate(-1)}>‹ {t('common.back')}</button><h1>{ownerId ? t('owner.edit') : t('owner.create')}</h1><span /></header>
    <form className={styles.form} onSubmit={submit} aria-busy={saving}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.top}>
        <label className={styles.avatar}>{preview ? <img src={preview} alt="" /> : <span>{t('owner.avatar')}</span>}<input type="file" accept="image/jpeg,image/png" onChange={e => { const file = e.target.files?.[0]; if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)) } }} /></label>
        <div className={styles.stack}>{(['fullName', 'country', 'city'] as const).map(key => <Field key={key} name={key} value={form[key] || ''} label={t(`owner.${key}` as 'owner.fullName')} required={key === 'fullName'} onChange={update} />)}</div>
      </div>
      <div className={styles.grid}>{(['address', 'email', 'phone', 'telegram'] as const).map(key => <Field key={key} name={key} value={form[key] || ''} label={t(`owner.${key}` as 'owner.address')} onChange={update} type={key === 'email' ? 'email' : 'text'} />)}</div>
      <div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => navigate(-1)}>{t('common.cancel')}</button><button type="submit" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</button></div>
    </form>
  </div>
}

function Field({ name, value, label, required, type = 'text', onChange }: { name: keyof PetOwnerInput; value: string; label: string; required?: boolean; type?: string; onChange: (key: keyof PetOwnerInput, value: string) => void }) {
  return <label><span>{label}{required ? ' *' : ''}</span><input type={type} required={required} value={value} onChange={e => onChange(name, e.target.value)} /></label>
}
