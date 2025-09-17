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
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
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

function itemImageUris(item: Item): string[] {
  const uris = []
  for (const content of item.content) {
    switch (content.type) {
      case 'static':
        uris.push(content.url)
        break
      case 'inline':
        uris.push(`data:${content.mimeType};base64,${content.data}`)
    }
  }
  return uris
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
  const imageUris = itemImageUris(item)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

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
      toast.success('Copied to clipboard')
    } catch (err) {
      reportError(err)
    }
  }

  function adjustTextAreaHeight() {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => adjustTextAreaHeight(), [editing])

  function handleTextEdit(e: ChangeEvent<HTMLTextAreaElement>): void {
    setEditText(e.target.value)
    adjustTextAreaHeight()
  }

  return (
    <div
      key={item.id}
      className={styles.message}
      data-role={item.role}
      data-editing={editing}
    >
      {imageUris.length > 0 && (
        <div className={styles.imageContainer}>
          {imageUris.map((uri, index) => (
            <img
              key={index}
              src={uri}
              alt={`Image ${index + 1}`}
              className={styles.messageImage}
            />
          ))}
        </div>
      )}

      <div className={styles.messageBubble}>
        {editing ? (
          <textarea
            className={styles.editTextarea}
            value={editText}
            onChange={handleTextEdit}
            disabled={disabled}
            ref={textareaRef}
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
