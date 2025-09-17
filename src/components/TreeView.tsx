import Api, { Item } from '@/lib/frontend/api'
import { XMarkIcon } from '@heroicons/react/24/outline'
import React from 'react'
import styles from './TreeView.module.scss'

interface TreeViewInnerProps {
  items: Item[]
  onSelect: (item: Item) => void | Promise<void>
}

function TreeViewInner({ items, onSelect }: TreeViewInnerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  return (
    <>
      <canvas
        className={styles.canvas}
        color='#888888'
        width={window.screen.width}
        height={window.screen.height}
        ref={canvasRef}
      />
    </>
  )
}

interface TreeViewProps {
  sessionId: number
  onClose: () => void
  onSelect: (item: Item) => void | Promise<void>
}

export function TreeView({ sessionId, onClose, onSelect }: TreeViewProps) {
  const api = new Api()
  const items = api.useSessionItems(sessionId)

  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose}>
        <XMarkIcon className={styles.icon} />
      </button>

      {items && <TreeViewInner items={items} onSelect={onSelect} />}
    </div>
  )
}
