import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import styles from './SidebarNav.module.scss'
import { usePathname } from 'next/navigation'

interface Props {
  open?: boolean
  setOpen: (value: boolean) => void
}

export default function SidebarNav({ open, setOpen }: Props) {
  const pathname = usePathname()

  const closeSidebar = () => {
    setOpen(false)
  }

  return (
    <nav>
      <div className={styles.sidebarHeader}>
        <span>Nagai</span>
        <button
          className={styles.closeButton}
          onClick={closeSidebar}
          aria-label='Close sidebar'
        >
          <ChevronLeftIcon className={styles.chevronIcon} />
        </button>
      </div>
      <ul className={styles.sidebarLinks}>
        <li>
          <Link href='/' className={pathname === '/' ? styles.active : ''}>
            <span className={styles.linkIcon}>🏠</span>
            Home
          </Link>
        </li>
        <li>
          <Link
            href='/integrations'
            className={pathname === '/integrations' ? styles.active : ''}
          >
            <span className={styles.linkIcon}>🔗</span>
            Integrations
          </Link>
        </li>
      </ul>
    </nav>
  )
}
