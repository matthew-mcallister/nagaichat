'use client'

import styles from './Sidebar.module.scss'
import { ReactNode } from 'react'

type Side = 'left' | 'right'

interface Props {
  open?: boolean
  setOpen: (value: boolean) => void
  children?: ReactNode
  side?: Side
}

export default function Sidebar({ open, setOpen, children, side }: Props) {
  side = side || 'left'

  let statusClass: string
  switch (open) {
    case undefined:
      statusClass = ''
      break
    case true:
      statusClass = styles.sidebarOpen
      break
    case false:
      statusClass = styles.sidebarClosed
      break
  }

  function closeSidebar() {
    setOpen(false)
  }

  return (
    <>
      <nav className={`${styles.sidebar} ${statusClass} ${styles[side]}`}>
        {children}
      </nav>
      <div className={`${styles.sidePadding} ${statusClass} ${styles[side]}`} />
      <div
        className={`${styles.overlay} ${statusClass}`}
        onClick={closeSidebar}
      />
    </>
  )
}
