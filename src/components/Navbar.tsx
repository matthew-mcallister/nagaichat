'use client'

import { ReactNode } from 'react'
import styles from './Navbar.module.scss'

interface Props {
  children: ReactNode
}

export default function Navbar({ children }: Props) {
  return (
    <nav className={styles.topNav}>
      <div className={styles.topContainer}>{children}</div>
    </nav>
  )
}
