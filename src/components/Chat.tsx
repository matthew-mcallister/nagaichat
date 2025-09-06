'use client'

import ChatBar from '@/components/ChatBar'
import ChatHistory from '@/components/ChatHistory'
import { useChatContext } from '@/components/context/ChatContext'
import { reportError } from '@/lib/error'
import Api from '@/lib/frontend/api'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './Chat.module.scss'

type LoadingState = null | 'processing' | 'awaitingResponse'

export default function Chat() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  if (isNaN(sessionId)) {
    router.push('/')
  }

  const api = new Api()
  const items = api.useSessionItems(sessionId)
  const [loadingState, setLoadingState] = useState<LoadingState>(null)
  const processing = loadingState !== null
  const awaitingResponse = loadingState === 'awaitingResponse'

  const { preset, options } = useChatContext()

  async function handleSend(message: string) {}
  async function handleStop() {}

  async function getResponse() {
    setLoadingState('awaitingResponse')
    if (!items || !options) return
    const parent = items[items.length - 1]
    try {
      await api.createItem({
        role: 'model',
        sessionId: sessionId,
        parentId: parent.id,
        presetId: preset?.id,
        options,
      })
    } catch (e) {
      reportError(e)
    } finally {
      setLoadingState(null)
    }
  }

  useEffect(() => {
    if (!sessionId || !items || !options) return
    if (String(sessionId) === localStorage.getItem('generate-response-for')) {
      localStorage.removeItem('generate-response-for')
      getResponse()
    }
  }, [items, options, sessionId])

  // TODO: Restore options from session on initial load
  //useEffect(() => {}, [sessionId])

  return (
    <div className={styles.chatPage}>
      <ChatHistory
        disabled={processing}
        awaitingResponse={awaitingResponse}
        items={items || []}
      />

      <div className={styles.chatBarContainer}>
        <ChatBar
          onSend={handleSend}
          onStop={handleStop}
          loading={processing}
          placeholder='Send a message...'
        />
      </div>
    </div>
  )
}
