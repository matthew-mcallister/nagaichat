'use client'

import ChatBar from '@/components/ChatBar'
import ChatHistory, { ChatHistoryPlaceholder } from '@/components/ChatHistory'
import { useChatContext } from '@/components/context/ChatContext'
import TreeView from '@/components/TreeView'
import { reportError } from '@/lib/error'
import Api, { ImageContent, Item, Session } from '@/lib/frontend/api'
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

  const router = useRouter()
  const [loadingState, setLoadingState] = useState<LoadingState>(null)
  const processing = loadingState !== null
  const awaitingResponse = loadingState === 'awaitingResponse'
  const {
    preset,
    setPreset,
    presets,
    options,
    setOptions,
    rawOptions,
    showTreeView,
    setShowTreeView,
  } = useChatContext()
  const controller = useRef(new AbortController())

  const tree = new ChatTree(items)
  const [latestItemId, setLatestItemId] = useState<number | null>(
    session.latestItemId || tree?.getLatestLeaf(null)?.id || null,
  )
  const latestItem = latestItemId ? tree.get(latestItemId) : null

  useEffect(() => {
    // FIXME: This is a race condition between presets and session loading
    if (presets && session.presetId !== null) {
      const ps = presets.find(preset => preset.id === session.presetId)
      if (ps !== undefined) setPreset(ps)
    }
    setOptions(session.options)
  }, [])

  async function handleSend(
    message: string,
    images: ImageContent[],
    reset: () => void,
  ) {
    if (!options) return
    setLoadingState('processing')
    const parent = latestItem
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
            ...images,
          ],
          parentId: parent?.id || null,
          presetId: preset?.id || null,
          options,
        },
        controller.current.signal,
      )
      reset()
      setLatestItemId(userMessage.id)
      setLoadingState('awaitingResponse')
      const modelResponse = await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId: userMessage.id,
          presetId: preset?.id || null,
          options,
          content: null,
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
    if (!options) return
    if (latestItem?.role === 'model') return
    setLoadingState('awaitingResponse')
    try {
      const item = await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId: latestItem?.id || null,
          presetId: preset?.id || null,
          options,
          content: null,
        },
        controller.current.signal,
      )
      setLatestItemId(item.id)
    } catch (e) {
      reportError(e)
    } finally {
      setLoadingState(null)
    }
  }

  async function handleOverwrite(
    item: Item,
    newText: string,
    images: ImageContent[],
  ): Promise<void> {
    setLoadingState('processing')
    try {
      await api.updateItem(item.id, {
        content: [{ type: 'text', text: newText }, ...images],
      })
    } catch (e) {
      reportError(e)
    } finally {
      setLoadingState(null)
    }
  }

  async function handleFork(
    item: Item,
    newText: string,
    images: ImageContent[],
  ): Promise<void> {
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
            ...images,
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
            content: null,
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

  async function handleReroll(item: Item): Promise<void> {
    if (!options) return
    if (item.role === 'user' || !item.parentId) return
    const parentId = item.parentId
    const oldLatestItemId = latestItemId
    setLoadingState('awaitingResponse')
    try {
      setLatestItemId(parentId)
      const newItem = await api.createItem(
        {
          role: 'model',
          sessionId: sessionId,
          parentId,
          presetId: preset?.id || null,
          options,
          content: null,
        },
        controller.current.signal,
      )
      setLatestItemId(newItem.id)
    } catch (e) {
      setLatestItemId(oldLatestItemId)
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
      {showTreeView && (
        <TreeView
          tree={tree}
          onClose={() => setShowTreeView(false)}
          onSelect={(item: Item) => {
            setLatestItemId(tree.getLatestLeaf(item)?.id)
            router.push(`#item-${item.id}`)
            setShowTreeView(false)
          }}
        />
      )}
      <ChatHistory
        disabled={processing}
        forkDisabled={!options}
        awaitingResponse={awaitingResponse}
        tree={tree}
        renderMarkdown={rawOptions?.renderMarkdown}
        latestItemId={latestItemId}
        setLatestItemId={setLatestItemId}
        onOverwrite={handleOverwrite}
        onFork={handleFork}
        onReroll={handleReroll}
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
