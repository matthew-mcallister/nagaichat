import SessionList from '@/components/SessionList'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './SidebarNav.module.scss'

interface Props {
  open?: boolean
  setOpen: (value: boolean) => void
}

export default function SidebarNav({ setOpen }: Props) {
  const pathname = usePathname()

  const closeSidebar = () => {
    setOpen(false)
  }

  return (
    <nav className='sidebar'>
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
      <section>
        <h3>Sessions</h3>
        <SessionList />
      </section>
    </nav>
  )
}
