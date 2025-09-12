import Markdown from '@/components/Markdown'
import { Item } from '@/lib/frontend/api'
import {
  ArrowPathIcon,
  ArrowUturnRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import styles from './ChatHistoryMessage.module.scss'

export interface ChatHistoryMessageProps {
  item: Item
  disabled?: boolean
  forkDisabled?: boolean
  siblingCount: number
  index: number
  left?: Item | null
  right?: Item | null
  renderMarkdown?: boolean
  onMoveLeft(): void
  onMoveRight(): void
  /** Overwrites the text of this item. */
  onOverwrite(newText: string): void | Promise<void>
  /** Creates a new sibling item with the updated text. */
  onFork(newText: string): void | Promise<void>
  /** Generates a new sibling item with the same parent. */
  onReroll(): void | Promise<void>
}

function itemText(item: Item): string | undefined {
  for (const content of item.content) {
    if (content.type === 'text') {
      return content.text
    }
  }
}

export default function ChatHistoryMessage(props: ChatHistoryMessageProps) {
  const {
    item,
    siblingCount,
    index,
    left,
    right,
    disabled,
    forkDisabled,
    renderMarkdown,
    onMoveLeft,
    onMoveRight,
    onOverwrite,
    onFork,
    onReroll,
  } = props
  const [editText, setEditText] = useState<string | null>(null)
  const editing = editText !== null
  const rawText = itemText(item)

  const handleStartEdit = () => {
    setEditText(rawText || '')
  }

  const handleCancelEdit = () => {
    setEditText(null)
  }

  const handleSave = async () => {
    if (editText === null) return
    await onOverwrite(editText)
    setEditText(null)
  }

  const handleFork = async () => {
    if (editText === null) return
    await onFork(editText)
    setEditText(null)
  }

  const handleCopy = async () => {
    if (!rawText) return
    try {
      await navigator.clipboard.writeText(rawText)
    } catch (err) {
      reportError(err)
    }
  }

  // Below the text should be a row of controls. The buttons should be
  // displayed as plain icons from Hero icons (with hover and focus states).
  //
  // 1. A left arrow to go left. Icon: chevron-left
  // 2. Current message and total messages, formatted as `{index} / {siblingCount}`.
  // 3. A right arrow to go right. Icon: chevron-right
  // 4. A "copy" button that copies the current text to the clipboard. Icon: clipboard-document
  // 5. An "edit" button. Icon: pencil
  //
  // In edit mode, the text area becomes editable. There are three available
  // control buttons.
  // 1. A cancel button. Icon: x-mark
  // 2. A "save" button which overwrites the current text. Icon: check
  // 3. A "fork" button which creates a new sibling from the edited text. Icon: arrow-uturn-right. Also, the text "Fork"
  return (
    <div key={item.id} className={styles.message} data-role={item.role}>
      <div className={styles.messageBubble}>
        {editing ? (
          // TODO: Resize this text area to fit contents
          <textarea
            className={styles.editTextarea}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            disabled={disabled}
          />
        ) : null}
        {
          // This element is rendered but hidden during editing so that the
          // markdown is never re-rendered unless the raw text changes.
        }
        <div className={editing ? styles.hidden : ''}>
          <Markdown text={rawText || ''} render={renderMarkdown} />
        </div>
      </div>

      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          {editing ? (
            <>
              <button
                className={styles.controlButton}
                onClick={handleCancelEdit}
                disabled={disabled}
                title='Cancel'
              >
                <XMarkIcon className={styles.icon} />
              </button>
              <button
                className={styles.controlButton}
                onClick={handleSave}
                disabled={disabled}
                title='Save'
              >
                <CheckIcon className={styles.icon} />
              </button>
              <button
                className={styles.controlButton}
                onClick={handleFork}
                disabled={disabled || forkDisabled}
                title='Fork'
              >
                <ArrowUturnRightIcon className={styles.icon} />
                <span className={styles.buttonText}>Fork</span>
              </button>
            </>
          ) : (
            <>
              {siblingCount > 1 && (
                <>
                  <button
                    className={styles.controlButton}
                    onClick={onMoveLeft}
                    disabled={disabled || !left}
                    title='Previous'
                  >
                    <ChevronLeftIcon className={styles.icon} />
                  </button>
                  <span className={styles.messageCounter}>
                    {index + 1} / {siblingCount}
                  </span>
                  <button
                    className={styles.controlButton}
                    onClick={onMoveRight}
                    disabled={disabled || !right}
                    title='Next'
                  >
                    <ChevronRightIcon className={styles.icon} />
                  </button>
                </>
              )}
              <button
                className={styles.controlButton}
                onClick={handleCopy}
                disabled={disabled}
                title='Copy'
              >
                <ClipboardDocumentIcon className={styles.icon} />
              </button>
              <button
                className={styles.controlButton}
                onClick={handleStartEdit}
                disabled={disabled}
                title='Edit'
              >
                <PencilIcon className={styles.icon} />
              </button>
              {item.role === 'model' && (
                <button
                  className={styles.controlButton}
                  onClick={onReroll}
                  disabled={disabled}
                  title='New response'
                >
                  <ArrowPathIcon className={styles.icon} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
