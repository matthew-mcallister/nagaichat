'use client'

import ChatHistoryMessage from '@/components/ChatHistoryMessage'
import { ImageContent, Item } from '@/lib/frontend/api'
import ChatTree from '@/lib/frontend/chat-tree'
import styles from './ChatHistory.module.scss'

interface ChatHistoryProps {
  disabled?: boolean
  forkDisabled?: boolean
  tree: ChatTree
  renderMarkdown?: boolean
  latestItemId: number | null
  setLatestItemId(id: number): void
  onOverwrite(
    item: Item,
    newText: string,
    images: ImageContent[],
  ): void | Promise<void>
  onFork(
    item: Item,
    newText: string,
    images: ImageContent[],
  ): void | Promise<void>
  onReroll(item: Item): void | Promise<void>
}

export function ChatHistoryPlaceholder() {
  return (
    <div className={styles.chatHistory}>
      <div className={styles.messagesContainer}>
        <div className={`${styles.placeholder} ${styles.small}`} />
        <div className={`${styles.placeholder} ${styles.large}`} />
      </div>
    </div>
  )
}

export default function ChatHistory({
  disabled,
  forkDisabled,
  tree,
  renderMarkdown,
  latestItemId,
  setLatestItemId,
  onOverwrite,
  onFork,
  onReroll,
}: ChatHistoryProps) {
  const history = tree.getLinearHistory(latestItemId)

  return (
    <div className={styles.chatHistory}>
      <div className={styles.messagesContainer}>
        {history.length > 2 && (
          <div className={styles.bottomLink}>
            <a href={`#item-${latestItemId}`}>↓ Latest</a>
          </div>
        )}
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
              renderMarkdown={renderMarkdown}
              index={index}
              left={left}
              right={right}
              onMoveLeft={() => {
                if (left) {
                  const latest = tree.getLatestLeaf(left)
                  setLatestItemId(latest.id)
                }
              }}
              onMoveRight={() => {
                if (right) {
                  const latest = tree.getLatestLeaf(right)
                  setLatestItemId(latest.id)
                }
              }}
              onOverwrite={(newText: string, images: ImageContent[]) =>
                onOverwrite(item, newText, images)
              }
              onFork={(newText: string, images: ImageContent[]) =>
                onFork(item, newText, images)
              }
              onReroll={() => onReroll(item)}
            />
          )
        })}
      </div>
    </div>
  )
}
