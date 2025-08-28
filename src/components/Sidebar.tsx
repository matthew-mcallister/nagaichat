'use client'

import SidebarNav from '@/components/SidebarNav'
import styles from './Sidebar.module.scss'

interface Props {
  open?: boolean
  setOpen: (value: boolean) => void
}

export default function Sidebar({ open, setOpen }: Props) {
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
      <nav className={`${styles.sidebar} ${statusClass}`}>
        <SidebarNav open={open} setOpen={setOpen} />
      </nav>
      <div className={`${styles.leftPadding} ${statusClass}`} />
      <div
        className={`${styles.overlay} ${statusClass}`}
        onClick={closeSidebar}
      />
    </>
  )
}
