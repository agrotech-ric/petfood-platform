import styles from './Sidebar.module.css'
import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from '../../../context/LanguageContext'

// ── SVG Components ──────────────────────────────────────────────

const IconProfile = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
)

const IconSettings = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path></svg>
)

const IconLogout = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="m17 7-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path></svg>
)

const IconPaw = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><circle cx="4.5" cy="9.5" r="2.5"></circle><circle cx="9" cy="5.5" r="2.5"></circle><circle cx="15" cy="5.5" r="2.5"></circle><circle cx="19.5" cy="9.5" r="2.5"></circle><path d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8z"></path></svg>
)

const IconIngredients = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 366.16 366.16" className={className} xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M89.114,0C70.453,0,52.613,10.11,40.169,27.737C28.849,43.773,22.614,64.788,22.614,86.91
        c0,22.122,6.234,43.137,17.555,59.173c8.464,11.99,19.427,20.498,31.445,24.716V310.66v18v20c0,9.665,7.835,17.5,17.5,17.5
        c9.665,0,17.5-7.835,17.5-17.5v-20v-18V170.799c12.018-4.218,22.98-12.725,31.445-24.716
        c11.321-16.036,17.555-37.051,17.555-59.173c0-22.122-6.234-43.137-17.555-59.173C125.615,10.11,107.775,0,89.114,0z"/>
      <path d="M308.546,17.5v98.754l-19,16.185V17.5h-35v114.939l-19-16.185V17.5h-35v106.836l6.152,13.322
        l47.848,40.759V310.66v18v20c0,9.665,7.835,17.5,17.5,17.5c9.665,0,17.5-7.835,17.5-17.5v-20v-18V178.417l47.848-40.759
        l6.152-13.322V17.5H308.546z"/>
    </g>
  </svg>
)

const IconRecipe = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 196.979 196.979" className={className} xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M43.48,0C28.1,0.003,15.588,12.517,15.588,27.896v141.188c0,15.38,12.512,27.894,27.893,27.896h131.66
        c3.452,0,6.25-2.798,6.25-6.25v-21.646v-21.646V49.542V6.25c0-3.452-2.798-6.25-6.25-6.25H43.48z M43.481,12.5h125.41v37.042
        v91.645H43.48c-5.687,0.001-10.978,1.716-15.392,4.649V27.896C28.088,19.408,34.994,12.501,43.481,12.5z M168.891,184.479H43.482
        c-8.488-0.001-15.394-6.908-15.394-15.396c0-8.488,6.905-15.395,15.393-15.396h125.41v9.146h-98.41c-3.452,0-6.25,2.798-6.25,6.25
        c0,3.452,2.798,6.25,6.25,6.25h98.41V184.479z"/>
      <path d="M73.496,87.7v23.664c0,3.452,2.798,6.25,6.25,6.25h37.486c3.452,0,6.25-2.798,6.25-6.25V87.701
        c8.258-3.315,13.982-11.413,13.982-20.669c0-11.935-9.437-21.706-21.24-22.244c-4.161-5.506-10.644-8.791-17.734-8.791
        c-7.093,0-13.575,3.285-17.735,8.791c-11.804,0.538-21.241,10.31-21.241,22.244C59.514,76.289,65.239,84.386,73.496,87.7z
         M81.782,57.265c0.473,0,0.954,0.035,1.433,0.105c2.686,0.397,5.313-0.986,6.512-3.418c1.661-3.364,5.02-5.455,8.765-5.455
        c3.744,0,7.103,2.091,8.766,5.457c1.2,2.432,3.839,3.811,6.513,3.416c0.476-0.07,0.956-0.105,1.429-0.105
        c5.386,0,9.768,4.382,9.768,9.768c0,4.905-3.663,9.069-8.52,9.685c-3.122,0.396-5.463,3.053-5.463,6.2v22.196H85.996V83.331
        c0-0.007,0.001-0.015,0.001-0.021c0.207-3.293-2.182-6.18-5.455-6.593c-4.862-0.613-8.528-4.776-8.528-9.685
        C72.014,61.646,76.396,57.265,81.782,57.265z"/>
    </g>
  </svg>
)

// ── Main Component ──────────────────────────────────────────────

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const { logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => {
      setExpanded(false)
      closeTimer.current = null
    }, 150)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {expanded && <div className={styles.backdrop} aria-hidden="true" />}

      <aside
        className={`${styles.sidebar} ${expanded ? styles.sidebarExpanded : ''}`}
        onMouseEnter={() => { cancelClose(); setExpanded(true) }}
        onMouseLeave={scheduleClose}
      >
        {/* Top nav items */}
        <nav className={styles.navTop}>
          <button
            className={`${styles.navItem} ${isActive('/dashboard') ? styles.navItemActive : ''}`}
            onClick={() => navigate('/dashboard')}
            type="button"
          >
            <div className={styles.iconWrap}>
              <IconPaw className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.pets')}</span>}
          </button>

          <button
            className={`${styles.navItem} ${isActive('/ingredients') ? styles.navItemActive : ''}`}
            onClick={() => navigate('/ingredients')}
            type="button"
          >
            <div className={styles.iconWrap}>
              <IconIngredients className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.ingredients')}</span>}
          </button>

          <button
            className={`${styles.navItem} ${isActive('/recipes') ? styles.navItemActive : ''}`}
            onClick={() => {}}
            type="button"
          >
            <div className={styles.iconWrap}>
              <IconRecipe className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.recipes')}</span>}
          </button>
        </nav>

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* Separator line */}
        <div className={styles.separator} />

        {/* Bottom nav items */}
        <nav className={styles.navBottom}>
          <button className={styles.navItem} onClick={() => navigate('/profile')} type="button">
            <div className={styles.iconWrap}>
              <IconProfile className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.profile')}</span>}
          </button>
          
          <button className={styles.navItem} onClick={() => navigate('/settings')} type="button">
            <div className={styles.iconWrap}>
              <IconSettings className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.settings')}</span>}
          </button>
          
          <button className={styles.navItem} onClick={logout} type="button">
            <div className={styles.iconWrap}>
              <IconLogout className={styles.navIcon} />
            </div>
            {expanded && <span className={styles.navLabel}>{t('sidebar.logout')}</span>}
          </button>
        </nav>
      </aside>
    </>
  )
}
