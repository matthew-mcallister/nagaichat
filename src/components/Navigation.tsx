'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './navigation.module.scss'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href='/' className={styles.logo}>
          VarChat
        </Link>
        <ul className={styles.links}>
          <li>
            <Link href='/' className={pathname === '/' ? styles.active : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link
              href='/integrations'
              className={pathname === '/integrations' ? styles.active : ''}
            >
              Integrations
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
