'use client'

import { ReactNode, useEffect, useState } from 'react'
import styles from './LayoutWrapper.module.scss'
import Navbar from '@/components/Navbar'
import ExpandButton from '@/components/ExpandButton'
import Sidebar from '@/components/Sidebar'
import SidebarNav from '@/components/SidebarNav'

interface LayoutWrapperProps {
  children: ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean | undefined>(
    undefined
  )

  useEffect(() => {
    setLeftSidebarOpen(window.innerWidth >= 769)
  }, [])

  return (
    <div className={styles.layoutContainer}>
      <Sidebar open={leftSidebarOpen} setOpen={setLeftSidebarOpen}>
        <SidebarNav open={leftSidebarOpen} setOpen={setLeftSidebarOpen} />
      </Sidebar>

      <div className={styles.mainArea}>
        <Navbar>
          <ExpandButton
            onClick={() => {
              setLeftSidebarOpen(!leftSidebarOpen)
            }}
          />
        </Navbar>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  )
}
