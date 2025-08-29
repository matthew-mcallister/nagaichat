'use client'

import { ReactNode, useEffect, useState } from 'react'
import styles from './Layout.module.scss'
import Navbar from '@/components/Navbar'
import ExpandButton from '@/components/ExpandButton'
import Sidebar from '@/components/Sidebar'
import SidebarNav from '@/components/SidebarNav'
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { Parameters } from '@/lib/chat'
import ParameterSidebar from '@/components/ParameterSidebar'

interface Props {
  children: ReactNode
}

export default function ChatLayout({ children }: Props) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean | undefined>(
    undefined
  )
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean | undefined>(
    undefined
  )

  const [parameters, setParameters] = useState<Parameters>({
    integration: undefined,
    model: undefined,
    systemPrompt: '',
    temperature: 1,
    thinkingEnabled: true,
  })

  useEffect(() => {
    setLeftSidebarOpen(window.innerWidth >= 769)
    setRightSidebarOpen(window.innerWidth >= 769)
  }, [])

  return (
    <div className={styles.layoutContainer}>
      <Sidebar open={leftSidebarOpen} setOpen={setLeftSidebarOpen}>
        <SidebarNav open={leftSidebarOpen} setOpen={setLeftSidebarOpen} />
      </Sidebar>

      <div className={styles.mainArea}>
        <Navbar>
          <ExpandButton
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            label='Toggle navigation sidebar'
            Icon={Bars3Icon}
          />
          <ExpandButton
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            label='Toggle preset sidebar'
            Icon={AdjustmentsHorizontalIcon}
          />
        </Navbar>

        <main className={styles.mainContent}>{children}</main>
      </div>

      <div className={styles.wideSidebar}>
        <Sidebar
          open={rightSidebarOpen}
          setOpen={setRightSidebarOpen}
          side='right'
        >
          <ParameterSidebar
            parameters={parameters}
            setParameters={setParameters}
          />
        </Sidebar>
      </div>
    </div>
  )
}
