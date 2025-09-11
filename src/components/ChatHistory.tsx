'use client'

import ChatHistoryMessage from '@/components/ChatHistoryMessage'
import { Item } from '@/lib/frontend/api'
import ChatTree from '@/lib/frontend/chat-tree'
import styles from './ChatHistory.module.scss'

interface ChatHistoryProps {
  disabled?: boolean
  forkDisabled?: boolean
  awaitingResponse?: boolean
  items: Item[] | null
  latestItemId: number | null
  setLatestItemId: (id: number) => void
  onOverwrite(item: Item, newText: string): void | Promise<void>
  onFork(item: Item, newText: string): void | Promise<void>
}

export default function ChatHistory({
  disabled,
  forkDisabled,
  items,
  awaitingResponse,
  latestItemId,
  setLatestItemId,
  onOverwrite,
  onFork,
}: ChatHistoryProps) {
  if (!items) {
    return <div className={styles.chatHistory} />
  }

  const tree = new ChatTree(items)
  const history = tree.getLinearHistory(latestItemId)

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
              disabled={disabled}
              forkDisabled={forkDisabled}
              siblingCount={siblingCount}
              index={index}
              left={left}
              right={right}
              onMoveLeft={() => {
                if (left) {
                  const latest = tree.getFirstLeaf(left)
                  setLatestItemId(latest.id)
                }
              }}
              onMoveRight={() => {
                if (right) {
                  const latest = tree.getFirstLeaf(right)
                  setLatestItemId(latest.id)
                }
              }}
              onOverwrite={(newText: string) => onOverwrite(item, newText)}
              onFork={(newText: string) => onFork(item, newText)}
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
