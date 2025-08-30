'use client'

import { ReactNode, useEffect, useState } from 'react'
import styles from './Layout.module.scss'
import Navbar from '@/components/Navbar'
import ExpandButton from '@/components/ExpandButton'
import Sidebar from '@/components/Sidebar'
import SidebarNav from '@/components/SidebarNav'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
}

export default function ManageLayout({ children }: Props) {
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
            Icon={Bars3Icon}
          />
        </Navbar>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  )
}
