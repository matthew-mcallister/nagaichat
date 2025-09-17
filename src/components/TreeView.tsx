import styles from './TreeView.module.scss'

interface TreeViewProps {
  sessionId: number
  onClose: () => void
}

export function TreeView({ sessionId, onClose }: TreeViewProps) {
  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose}>
        <svg
          className={styles.icon}
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </div>
  )
}
