'use client'

import ChatBar from '@/components/ChatBar'
import ChatHistory, { ChatHistoryPlaceholder } from '@/components/ChatHistory'
import { useChatContext } from '@/components/context/ChatContext'
import { reportError } from '@/lib/error'
import Api, { Item, Session } from '@/lib/frontend/api'
import ChatTree from '@/lib/frontend/chat-tree'
import { ChatBarAction } from '@/lib/frontend/common'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import styles from './Chat.module.scss'

type LoadingState = null | 'processing' | 'awaitingResponse'

interface ChatInnerProps {
  session: Session
  items: Item[]
}

export function ChatInner({ session, items }: ChatInnerProps) {
  const api = new Api()
  const sessionId = session.id

  const [loadingState, setLoadingState] = useState<LoadingState>(null)
  const processing = loadingState !== null
  const awaitingResponse = loadingState === 'awaitingResponse'
  const { preset, options, rawOptions } = useChatContext()
  const controller = useRef(new AbortController())

  let tree = new ChatTree(items)
  const [latestItemId, setLatestItemId] = useState<number | null>(
    session.latestItemId || tree?.getFirstLeaf(null)?.id || null,
  )
  const latestItem = latestItemId ? tree.get(latestItemId) : null

  useEffect(() => {
    // FIXME: Update options and preset from session
  }, [])

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
          parentId: parent?.id || null,
          presetId: preset?.id || null,
          options,
        },
        controller.current.signal,
      )
      setLatestItemId(userMessage.id)
      setLoadingState('awaitingResponse')
      const modelResponse = await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId: userMessage.id,
          presetId: preset?.id || null,
          options,
        },
        controller.current.signal,
      )
      setLatestItemId(modelResponse.id)
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
          presetId: preset?.id || null,
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

  async function handleOverwrite(item: Item, newText: string): Promise<void> {
    setLoadingState('processing')
    try {
      await api.updateItem(item.id, {
        content: [{ type: 'text', text: newText }],
      })
    } catch (e) {
      reportError(e)
    } finally {
      setLoadingState(null)
    }
  }

  async function handleFork(item: Item, newText: string): Promise<void> {
    if (!options) return
    setLoadingState('processing')
    try {
      const newItem = await api.createItem(
        {
          role: item.role,
          sessionId: sessionId,
          content: [
            {
              type: 'text',
              text: newText,
            },
          ],
          parentId: item.parentId,
          presetId: preset?.id || null,
          options,
        },
        controller.current.signal,
      )
      setLatestItemId(newItem.id)
      if (item.role === 'user') {
        // Immediately generate a response when forking a user message
        setLoadingState('awaitingResponse')
        const modelResponse = await api.createItem(
          {
            role: 'model',
            sessionId: sessionId,
            parentId: newItem.id,
            presetId: preset?.id || null,
            options,
          },
          controller.current.signal,
        )
        setLatestItemId(modelResponse.id)
      }
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

  // TODO: Restore session options, preset, and latest item ID from session after initial load
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
        forkDisabled={!options}
        awaitingResponse={awaitingResponse}
        items={items}
        renderMarkdown={rawOptions?.renderMarkdown}
        latestItemId={latestItemId}
        setLatestItemId={setLatestItemId}
        onOverwrite={handleOverwrite}
        onFork={handleFork}
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

export default function Chat() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  if (isNaN(sessionId)) {
    router.push('/')
  }

  const api = new Api()
  const items = api.useSessionItems(sessionId)
  const session = api.useSession(sessionId)

  if (!items || !session) {
    return (
      <div className={styles.chatPage}>
        <ChatHistoryPlaceholder />
        <div className={styles.chatBarContainer}>
          <ChatBar onSend={() => {}} action={'send'} disabled={true} />
        </div>
      </div>
    )
  }

  return <ChatInner session={session} items={items} />
}
