import SessionList from '@/components/SessionList'
import {
  ChevronLeftIcon,
  PencilSquareIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './SidebarNav.module.scss'

interface Props {
  open?: boolean
  setOpen: (value: boolean) => void
}

export default function SidebarNav({ setOpen }: Props) {
  const pathname = usePathname()

  const match = pathname.match(/^\/session\/(\d+)/)
  const currentSessionId = match ? Number(match[1]) : undefined

  const closeSidebar = () => {
    setOpen(false)
  }

  return (
    <nav className='sidebar'>
      <div className={styles.sidebarHeader}>
        <span>NagaiChat</span>
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
            <PencilSquareIcon className={styles.linkIcon} />
            New chat
          </Link>
        </li>
        <li>
          <Link
            href='/integrations'
            className={pathname === '/integrations' ? styles.active : ''}
          >
            <PuzzlePieceIcon className={styles.linkIcon} />
            Integrations
          </Link>
        </li>
      </ul>
      <section>
        <h3>Sessions</h3>
        <SessionList currentSessionId={currentSessionId} />
      </section>
    </nav>
  )
}
