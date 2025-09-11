'use client'

import ChatHistoryMessage from '@/components/ChatHistoryMessage'
import Api, { Item } from '@/lib/frontend/api'
import ChatTree from '@/lib/frontend/chat-tree'
import { useState } from 'react'
import styles from './ChatHistory.module.scss'

interface ChatHistoryProps {
  disabled?: boolean
  awaitingResponse?: boolean
  items: Item[] | null
  latestItemId: number | null
  setLatestItemId: (id: number) => void
}

export default function ChatHistory({
  disabled: propDisabled,
  items,
  awaitingResponse,
  latestItemId,
  setLatestItemId,
}: ChatHistoryProps) {
  const [processing, setProcessing] = useState(false)

  if (!items) {
    return <div className={styles.chatHistory} />
  }

  const api = new Api()
  const tree = new ChatTree(items)
  const history = tree.getLinearHistory(latestItemId)

  const disabled = processing || propDisabled

  return (
    <div className={styles.chatHistory}>
      <div className={styles.messagesContainer}>
        {history.map(item => {
          const siblingCount = tree.getChildren(item.parentId).length
          const [index, left, right] = tree.getSiblings(item)
          return (
            <ChatHistoryMessage
              key={item.id}
              item={item}
              siblingCount={siblingCount}
              index={index}
              onMoveLeft={() => {
                if (left) {
                  setLatestItemId(left.id)
                }
              }}
              onMoveRight={() => {
                if (right) {
                  setLatestItemId(right.id)
                }
              }}
              onOverwrite={(newText: string) => {}}
              onFork={(newText: string) => {
                // TODO: implement editing on the backend
              }}
            />
          )
        })}
        {awaitingResponse && (
          // TODO: Better loading visual
          <div className={styles.loadingMessage}>Waiting for response...</div>
        )}
      </div>
    </div>
  )
}
