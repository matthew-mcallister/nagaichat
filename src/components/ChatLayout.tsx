'use client'

import { ChatContextProvider } from '@/components/context/ChatContext'
import ExpandButton from '@/components/ExpandButton'
import Navbar from '@/components/Navbar'
import OptionSidebar from '@/components/OptionSidebar'
import Sidebar from '@/components/Sidebar'
import SidebarNav from '@/components/SidebarNav'
import {
  Preset,
  SessionOptionsFields,
  validateOptions,
} from '@/lib/frontend/api'
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { ReactNode, useEffect, useState } from 'react'
import styles from './Layout.module.scss'

interface Props {
  children: ReactNode
}

export default function ChatLayout({ children }: Props) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean | undefined>(
    undefined,
  )
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean | undefined>(
    undefined,
  )

  const [options, setOptions] = useState<SessionOptionsFields>({
    integration: undefined,
    model: undefined,
    systemPrompt: '',
    temperature: 1,
    thinkingEnabled: true,
    renderMarkdown: true,
  })
  const [preset, setPreset] = useState<Preset | undefined>(undefined)

  useEffect(() => {
    setLeftSidebarOpen(window.innerWidth >= 769)
    setRightSidebarOpen(window.innerWidth >= 769)
  }, [])

  return (
    <ChatContextProvider
      options={validateOptions(options)}
      preset={preset || null}
      rawOptions={options}
    >
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
            <OptionSidebar
              options={options}
              setOptions={setOptions}
              preset={preset}
              setPreset={setPreset}
            />
          </Sidebar>
        </div>
      </div>
    </ChatContextProvider>
  )
}
