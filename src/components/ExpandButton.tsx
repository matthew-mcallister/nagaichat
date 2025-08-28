import { Bars3Icon } from '@heroicons/react/24/outline'
import styles from './ExpandButton.module.scss'

interface Props {
  onClick: () => void
}

export default function ExpandButton({ onClick }: Props) {
  return (
    <button
      className={styles.expandButton}
      onClick={onClick}
      aria-label='Toggle sidebar'
    >
      <Bars3Icon className={styles.expandIcon} />
    </button>
  )
}
