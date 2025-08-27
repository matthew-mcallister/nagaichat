'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import styles from './navigation.module.scss'

export default function Navigation() {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <nav className={styles.mobileNav}>
        <div className={styles.mobileContainer}>
          <button
            className={styles.menuButton}
            onClick={toggleSidebar}
            aria-label='Toggle navigation menu'
          >
            <span className={styles.menuIcon}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      {/* TODO: Allow sidebar to be collapsed on desktop layout */}
      <nav
        className={`${styles.sidebar} ${
          isSidebarOpen ? styles.sidebarOpen : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h3>Navigation</h3>
        </div>
        <ul className={styles.sidebarLinks}>
          <li>
            <Link
              href='/'
              className={pathname === '/' ? styles.active : ''}
              onClick={closeSidebar}
            >
              <span className={styles.linkIcon}>🏠</span>
              Home
            </Link>
          </li>
          <li>
            <Link
              href='/integrations'
              className={pathname === '/integrations' ? styles.active : ''}
              onClick={closeSidebar}
            >
              <span className={styles.linkIcon}>🔗</span>
              Integrations
            </Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
