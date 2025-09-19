'use client'

import { ChatContextProvider } from '@/components/context/ChatContext'
import ExpandButton from '@/components/ExpandButton'
import Navbar from '@/components/Navbar'
import OptionSidebar from '@/components/OptionSidebar'
import Sidebar from '@/components/Sidebar'
import SidebarNav from '@/components/SidebarNav'
import { TreeView } from '@/components/TreeView'
import Api, {
  fromPreset,
  Preset,
  SessionOptions,
  SessionOptionsFields,
  validateOptions,
} from '@/lib/frontend/api'
import {
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline'
import { useParams } from 'next/navigation'
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
  const [showTreeView, setShowTreeView] = useState<boolean>(false)

  // TODO: Should rename id to sessionId to disambiguate
  const { id: sessionId } = useParams<{ id?: string }>()

  const [options, setOptions] = useState<SessionOptionsFields>({
    integration: undefined,
    model: undefined,
    systemPrompt: '',
    temperature: 1,
    thinkingEnabled: true,
    renderMarkdown: true,
  })
  const [preset, setPreset] = useState<Preset | undefined>(undefined)

  const api = new Api()
  const presets = api.usePresets()

  useEffect(() => {
    setLeftSidebarOpen(window.innerWidth >= 769)
    setRightSidebarOpen(window.innerWidth >= 769)
  }, [])

  return (
    <ChatContextProvider
      options={validateOptions(options)}
      setOptions={(options: SessionOptions) => setOptions(fromPreset(options))}
      presets={presets}
      preset={preset || null}
      setPreset={setPreset}
      rawOptions={options}
    >
      <div className={styles.layoutContainer}>
        {sessionId && showTreeView && (
          <TreeView
            sessionId={Number(sessionId)}
            onClose={() => setShowTreeView(false)}
            onSelect={item => {
              // TODO
              console.log('Selected item:', item)
            }}
          />
        )}

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
            <div className='hRow'>
              {sessionId && (
                <ExpandButton
                  onClick={() => setShowTreeView(true)}
                  label='Toggle tree view'
                  Icon={RectangleGroupIcon}
                />
              )}
              <ExpandButton
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                label='Toggle preset sidebar'
                Icon={AdjustmentsHorizontalIcon}
              />
            </div>
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
              presets={presets}
              preset={preset}
              setPreset={setPreset}
            />
          </Sidebar>
        </div>
      </div>
    </ChatContextProvider>
  )
}
