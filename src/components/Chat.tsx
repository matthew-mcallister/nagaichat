'use client'

import ChatBar from '@/components/ChatBar'
import ChatHistory from '@/components/ChatHistory'
import { useChatContext } from '@/components/context/ChatContext'
import { reportError } from '@/lib/error'
import Api from '@/lib/frontend/api'
import { ChatBarAction } from '@/lib/frontend/common'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
  const controller = useRef(new AbortController())

  const latestItem = items ? items[items.length - 1] : null

  async function handleSend(message: string) {
    if (!items || !options) return
    setLoadingState('processing')
    const parent = items.length > 0 ? items[items.length - 1] : null
    if (parent?.role === 'user') {
      return
    }
    try {
      const userMessage = await api.createItem(
        {
          role: 'user',
          sessionId: sessionId,
          content: [
            {
              type: 'text',
              text: message,
            },
          ],
          parentId: parent?.id,
          presetId: preset?.id,
          options,
        },
        controller.current.signal,
      )
      setLoadingState('awaitingResponse')
      await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId: userMessage.id,
          presetId: preset?.id,
          options,
        },
        controller.current.signal,
      )
    } catch (e) {
      reportError(e)
    } finally {
      setLoadingState(null)
    }
  }

  async function handleStop() {
    controller.current.abort()
    controller.current = new AbortController()
  }

  async function getResponse() {
    if (!items || !options) return
    setLoadingState('awaitingResponse')
    const parent = items[items.length - 1]
    try {
      await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId: parent.id,
          presetId: preset?.id,
          options,
        },
        controller.current.signal,
      )
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

  // TODO: Restore options and preset from session on initial load
  //useEffect(() => {}, [sessionId])

  let chatBarAction: ChatBarAction
  if (loadingState === 'awaitingResponse') {
    chatBarAction = 'stop'
  } else if (latestItem?.role === 'user') {
    chatBarAction = 'refresh'
  } else {
    chatBarAction = 'send'
  }

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
          onRefresh={getResponse}
          action={chatBarAction}
          disabled={!items || !options || loadingState === 'processing'}
          placeholder='Send a message...'
        />
      </div>
    </div>
  )
}
