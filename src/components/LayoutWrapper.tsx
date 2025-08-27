'use client'

import { ReactNode } from 'react'
import Navigation from './Navigation'
import styles from './layout-wrapper.module.scss'

interface LayoutWrapperProps {
  children: ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className={styles.layoutContainer}>
      <Navigation />
      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}
