import styles from './ExpandButton.module.scss'

interface Props {
  onClick: () => void
  label?: string
  Icon: any
}

export default function ExpandButton({ onClick, label, Icon }: Props) {
  return (
    <button
      className={styles.expandButton}
      onClick={onClick}
      aria-label={label || 'Toggle sidebar'}
    >
      <Icon className={styles.expandIcon} />
    </button>
  )
}
