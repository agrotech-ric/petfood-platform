import { useEffect, useState } from 'react'
import { useTranslation } from '../../../context/LanguageContext'
import type { ShareLinkState } from '../../../services/shareTypes'
import { copyText } from '../../utils/copyText'
import styles from './ShareDialog.module.css'

type Props = {
  open: boolean
  resourceName: string
  onClose: () => void
  load: () => Promise<ShareLinkState>
  create: () => Promise<ShareLinkState>
  rotate: () => Promise<ShareLinkState>
  revoke: () => Promise<void>
}

export function ShareDialog({ open, resourceName, onClose, load, create, rotate, revoke }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<ShareLinkState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setState(null)
    setError('')
    setCopied(false)
    load()
      .then(value => { if (!cancelled) setState(value) })
      .catch(value => { if (!cancelled) setError(value instanceof Error ? value.message : t('sharing.error')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [load, open, t])

  if (!open) return null

  const run = async (action: () => Promise<ShareLinkState>) => {
    setLoading(true)
    setError('')
    setCopied(false)
    try { setState(await action()) }
    catch (value) { setError(value instanceof Error ? value.message : t('sharing.error')) }
    finally { setLoading(false) }
  }

  const copy = async () => {
    if (!state?.url) return
    if (await copyText(state.url)) {
      setCopied(true)
      setError('')
    } else {
      setError(t('sharing.copyError'))
    }
  }

  const remove = async () => {
    if (!window.confirm(t('sharing.revokeConfirm'))) return
    setLoading(true)
    setError('')
    try {
      await revoke()
      setState(ShareLinkStateInactive)
    } catch (value) {
      setError(value instanceof Error ? value.message : t('sharing.error'))
    } finally {
      setLoading(false)
    }
  }

  const replace = async () => {
    if (!window.confirm(t('sharing.replaceConfirm'))) return
    await run(rotate)
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={t('sharing.title')}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('sharing.title')}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('sharing.close')}>×</button>
        </div>
        <p className={styles.description}>{t('sharing.liveDescription', { name: resourceName })}</p>
        {state?.active && state.url ? (
          <>
            <div className={styles.linkRow}>
              <input className={styles.link} value={state.url} readOnly aria-label={t('sharing.link')} />
              <button type="button" className={styles.primary} onClick={() => void copy()} disabled={loading}>
                {copied ? t('sharing.copied') : t('sharing.copy')}
              </button>
            </div>
            {!state.available && <p className={styles.error}>{t('sharing.temporarilyUnavailable')}</p>}
            {copied && <p className={styles.status}>{t('sharing.copySuccess')}</p>}
          </>
        ) : !loading && <p className={styles.description}>{t('sharing.notCreated')}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          {state?.active ? (
            <>
              <button type="button" className={styles.secondary} onClick={() => void replace()} disabled={loading}>{t('sharing.replace')}</button>
              <button type="button" className={styles.danger} onClick={() => void remove()} disabled={loading}>{t('sharing.revoke')}</button>
            </>
          ) : (
            <button type="button" className={styles.primary} onClick={() => void run(create)} disabled={loading}>
              {loading ? t('sharing.loading') : t('sharing.create')}
            </button>
          )}
          <button type="button" className={styles.secondary} onClick={onClose}>{t('sharing.close')}</button>
        </div>
      </div>
    </div>
  )
}

const ShareLinkStateInactive: ShareLinkState = { active: false, available: false }
