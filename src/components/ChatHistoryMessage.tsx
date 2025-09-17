import ImagePreview from '@/components/ImagePreview'
import Markdown from '@/components/Markdown'
import { InlineContent, Item, StaticContent } from '@/lib/frontend/api'
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

type ImageData = InlineContent | StaticContent

interface EditUiProps {
  disabled?: boolean
  forkDisabled?: boolean
  initialText: string
  onSave(text: string, images: ImageData[]): void | Promise<void>
  onFork(text: string, images: ImageData[]): void | Promise<void>
  onCancel(): void
}

function EditUi({
  disabled,
  forkDisabled,
  initialText,
  onSave,
  onFork,
  onCancel,
}: EditUiProps) {
  const [editText, setEditText] = useState(initialText)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  function handleTextEdit(e: ChangeEvent<HTMLTextAreaElement>): void {
    setEditText(e.target.value)
    adjustTextAreaHeight()
  }

  function adjustTextAreaHeight() {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  useEffect(() => adjustTextAreaHeight(), [editText])

  return (
    <>
      <div className={styles.messageBubble}>
        <textarea
          className={styles.editTextarea}
          value={editText}
          onChange={handleTextEdit}
          disabled={disabled}
          ref={textareaRef}
        />
      </div>
      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
            onClick={onCancel}
            disabled={disabled}
            title='Cancel'
          >
            <XMarkIcon className={styles.icon} />
          </button>
          <button
            className={styles.controlButton}
            onClick={() => onSave(editText, [])}
            disabled={disabled}
            title='Save'
          >
            <CheckIcon className={styles.icon} />
          </button>
          <button
            className={styles.controlButton}
            onClick={() => onFork(editText, [])}
            disabled={disabled || forkDisabled}
            title='Fork'
          >
            <ArrowUturnRightIcon className={styles.icon} />
            <span className={styles.buttonText}>Fork</span>
          </button>
        </div>
      </div>
    </>
  )
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
  const [editing, setEditing] = useState<boolean>(false)
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null)
  const rawText = itemText(item)
  const imageUris = itemImageUris(item)

  async function handleSave(message: string, images: ImageData[]) {
    if (!message) return
    await onOverwrite(message)
    setEditing(false)
  }

  async function handleFork(message: string, images: ImageData[]) {
    if (!message) return
    await onFork(message)
    setEditing(false)
  }

  async function handleCopy() {
    if (!rawText) return
    try {
      await navigator.clipboard.writeText(rawText)
      toast.success('Copied to clipboard')
    } catch (err) {
      reportError(err)
    }
  }

  async function handleImageClick(imageUri: string) {
    setPreviewImageUri(imageUri)
  }

  async function handleClosePreview() {
    setPreviewImageUri(null)
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
              onClick={() => handleImageClick(uri)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      )}

      {
        // This element is rendered but hidden during editing so that the
        // markdown is never re-rendered unless the raw text changes.
      }
      <div
        className={`${styles.messageBubble} ${editing ? styles.hidden : ''}`}
      >
        <Markdown text={rawText || ''} render={renderMarkdown} />
      </div>

      {editing ? (
        <EditUi
          disabled={disabled}
          forkDisabled={forkDisabled}
          initialText={rawText || ''}
          onSave={handleSave}
          onFork={handleFork}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className={styles.controlsContainer}>
          <div className={styles.controls}>
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
              onClick={() => setEditing(true)}
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
          </div>
        </div>
      )}

      {previewImageUri && (
        <ImagePreview imageUri={previewImageUri} onClose={handleClosePreview} />
      )}
    </div>
  )
}
