import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../context/LanguageContext'
import type { Locale } from '../../../i18n'
import styles from '../../styles/PublicShare.module.css'

export function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="4.5" cy="9.5" r="2.5" />
      <circle cx="9" cy="5.5" r="2.5" />
      <circle cx="15" cy="5.5" r="2.5" />
      <circle cx="19.5" cy="9.5" r="2.5" />
      <path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.36-.13-.74-.14-1.11-.14s-.76.02-1.12.15c-.7.24-1.28.78-1.75 1.32l-2.48 2.91c-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8Z" />
    </svg>
  )
}

export function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  )
}

export function PublicHeader({ title }: { title: string }) {
  const { locale, setLanguage, t } = useTranslation()
  return (
    <header className={styles.pageHeader}>
      <Link to="/login" className={styles.brand} title="PetFood">
        <span className={styles.brandMark}><PawIcon /></span>
        <span>PetFood</span>
      </Link>
      <h1 className={styles.headerTitle}>{title}</h1>
      <div className={styles.headerRight}>
        <div className={styles.languages} aria-label={t('public.language')}>
          {(['ru', 'en', 'kz'] as Locale[]).map(code => (
            <button
              key={code}
              type="button"
              className={`${styles.language} ${locale === code ? styles.languageActive : ''}`}
              onClick={() => void setLanguage(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <Link to="/login" className={styles.loginBtn}>
          {t('public.login')}
        </Link>
      </div>
    </header>
  )
}

export function PublicFooter() {
  const { t } = useTranslation()
  return (
    <footer className={styles.publicFooter}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <span className={styles.footerBrandMark}><PawIcon /></span>
          <span className={styles.footerBrandText}>PetFood</span>
        </div>
        <p className={styles.footerNote}>{t('public.footerText')}</p>
        <div className={styles.footerActions}>
          <Link to="/login" className={styles.footerBtnPrimary}>
            {t('public.login')}
          </Link>
        </div>
      </div>
    </footer>
  )
}

export function PublicState({ kind }: { kind: 'loading' | 'invalid' | 'rate' }) {
  const { t } = useTranslation()
  return (
    <main className={styles.stateCard}>
      <span className={styles.stateIcon}><PawIcon /></span>
      <h1>{kind === 'loading' ? t('public.loading') : kind === 'rate' ? t('public.rateTitle') : t('public.invalidTitle')}</h1>
      <p>{kind === 'loading' ? t('public.loadingDescription') : kind === 'rate' ? t('public.rateDescription') : t('public.invalidDescription')}</p>
      {kind !== 'loading' && (
        <Link to="/login" className={styles.stateBackBtn}>
          {t('public.login')}
        </Link>
      )}
    </main>
  )
}

export function Fact({ label, value }: { label: string; value?: string | number | null }) {
  const { t } = useTranslation()
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value ?? t('public.notSpecified')}</span>
    </div>
  )
}

export function PublicBadge({ label }: { label: string }) {
  return (
    <span className={styles.publicBadge}>
      <EyeIcon className={styles.badgeIcon} />
      {label}
    </span>
  )
}

export function PhotoPlaceholder({ className, name }: { className?: string; name?: string }) {
  return (
    <div className={className || styles.petPhotoPlaceholder} aria-label={name}>
      <PawIcon className={styles.placeholderIcon} />
    </div>
  )
}

export type HistoryPoint = { label: string; value: number }

export function PublicLineChart({
  data,
  yLabel,
  color = '#f47f4b',
}: {
  data: HistoryPoint[]
  yLabel: string
  color?: string
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  if (!data.length) return null

  const width = 360
  const height = 200
  const padLeft = 40
  const padBottom = 34
  const padTop = 20
  const padRight = 20
  const maxY = Math.max(1, ...data.map(item => item.value)) * 1.25
  const stepCount = Math.max(data.length - 1, 1)

  const toX = (index: number) => padLeft + (index / stepCount) * (width - padLeft - padRight)
  const toY = (value: number) => padTop + (1 - value / maxY) * (height - padTop - padBottom)
  const points = data.map((item, index) => `${toX(index)},${toY(item.value)}`).join(' ')
  const areaPoints = `${toX(0)},${height - padBottom} ` + points + ` ${toX(data.length - 1)},${height - padBottom}`

  const xLabels = Array.from(new Set([0, Math.floor(data.length / 2), data.length - 1]))
  const ticks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]
  const gradId = `areaGrad-${Math.abs(color.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`

  return (
    <div className={styles.lineChartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.lineChart} role="img" aria-label={yLabel}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {ticks.map((value, index) => (
          <g key={index}>
            <line
              x1={padLeft}
              y1={toY(value)}
              x2={width - padRight}
              y2={toY(value)}
              className={styles.gridLine}
            />
            <text x={padLeft - 6} y={toY(value) + 3} className={styles.axisText} textAnchor="end">
              {Math.round(value * 10) / 10}
            </text>
          </g>
        ))}
        {xLabels.map(index => (
          <text key={index} x={toX(index)} y={height - 8} className={styles.axisText} textAnchor="middle">
            {data[index]?.label}
          </text>
        ))}
        <text
          x={12}
          y={height / 2}
          className={styles.axisText}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${height / 2})`}
        >
          {yLabel}
        </text>
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => (
          <circle
            key={`${item.label}-${index}`}
            cx={toX(index)}
            cy={toY(item.value)}
            r="4.5"
            fill="var(--color-surface)"
            stroke={color}
            strokeWidth="2.5"
            className={styles.historyPoint}
            onMouseEnter={() => setTooltip({ x: toX(index), y: toY(item.value) - 12, text: `${item.value} • ${item.label}` })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <span className={styles.chartTooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </span>
      )}
    </div>
  )
}
