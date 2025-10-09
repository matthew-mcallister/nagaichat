import { AttachedImages } from '@/components/AttachedImages'
import ImagePreview from '@/components/ImagePreview'
import Markdown from '@/components/Markdown'
import {
  getItemImageContent,
  getItemImageUris,
  getItemText,
  getItemThoughts,
  ImageContent,
  Item,
} from '@/lib/frontend/api'
import { handleImagePaste, handleImageSelection } from '@/lib/frontend/util'
import {
  ArrowPathIcon,
  ArrowUturnRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  PencilIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import styles from './ChatHistoryMessage.module.scss'

async function copyToClipboard(text: string): Promise<void> {
  if (window.isSecureContext && window.navigator.clipboard) {
    await window.navigator.clipboard.writeText(text)
  } else {
    const textArea = window.document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed' // Avoid scrolling to bottom
    textArea.style.opacity = '0'
    window.document.body.appendChild(textArea)

    textArea.focus()
    textArea.select()
    try {
      window.document.execCommand('copy')
    } finally {
      window.document.body.removeChild(textArea)
    }
  }
}

interface ItemThoughtProps {
  text: string
  show: boolean
  onClick: () => void
}

function Thoughts({ text, show, onClick }: ItemThoughtProps) {
  return (
    <div className={styles.thoughtsContainer}>
      <div className={styles.thoughtsHeader} onClick={onClick}>
        <span className={styles.thoughtsLabel}>Thoughts</span>
        <ChevronRightIcon
          className={`${styles.thoughtsChevron} ${show ? styles.thoughtsChevronExpanded : ''}`}
        />
      </div>
      {show && (
        <div className={styles.thoughtsContent}>
          <Markdown text={text} render={true} />
        </div>
      )}
    </div>
  )
}

interface EditUiProps {
  disabled?: boolean
  forkDisabled?: boolean
  initialText: string
  initialImages: ImageContent[]
  onSave(text: string, images: ImageContent[]): void | Promise<void>
  onFork(text: string, images: ImageContent[]): void | Promise<void>
  onCancel(): void
}

function EditUi({
  disabled,
  forkDisabled,
  initialText,
  initialImages,
  onSave,
  onFork,
  onCancel,
}: EditUiProps) {
  const [editText, setEditText] = useState(initialText)
  const [editImages, setEditImages] = useState<ImageContent[]>(initialImages)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleTextEdit(e: ChangeEvent<HTMLTextAreaElement>): void {
    setEditText(e.target.value)
    adjustTextAreaHeight()
  }

  function adjustTextAreaHeight() {
    const textarea = textareaRef.current
    if (textarea) {
      const height = Math.min(textarea.scrollHeight, 24 * 16)
      textarea.style.height = 'auto'
      textarea.style.height = `${height}px`
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    let hasImages
    try {
      hasImages = await handleImagePaste(e.clipboardData, image => {
        setEditImages(prev => [...prev, image])
      })
    } catch (e) {
      reportError(e)
    }

    if (hasImages) {
      e.preventDefault() // Prevent default paste behavior for images
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleImageSelection(e.target.files, image => {
        setEditImages(prev => [...prev, image])
      })
    } catch (e) {
      reportError(e)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => adjustTextAreaHeight(), [editText])

  return (
    <>
      <AttachedImages images={editImages} setImages={setEditImages} />
      <div className={styles.messageBubble}>
        <textarea
          className={styles.editTextarea}
          value={editText}
          onChange={handleTextEdit}
          onPaste={handlePaste}
          disabled={disabled}
          ref={textareaRef}
        />
      </div>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/png,image/jpeg'
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <button
            onClick={handleUploadClick}
            className={styles.controlButton}
            type='button'
            aria-label='Upload image'
            title='Upload image'
            disabled={disabled}
          >
            <PhotoIcon className={styles.icon} />
          </button>
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
            onClick={() => onSave(editText, editImages)}
            disabled={disabled}
            title='Save'
          >
            <CheckIcon className={styles.icon} />
          </button>
          <button
            className={styles.controlButton}
            onClick={() => onFork(editText, editImages)}
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
  onOverwrite(newText: string, images: ImageContent[]): void | Promise<void>
  /** Creates a new sibling item with the updated text. */
  onFork(newText: string, images: ImageContent[]): void | Promise<void>
  /** Generates a new sibling item with the same parent. */
  onReroll(): void | Promise<void>
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
  const [showThoughts, setShowThoughts] = useState<boolean>(false)
  const rawText = getItemText(item)
  const rawThoughts = getItemThoughts(item)
  const imageUris = getItemImageUris(item)
  const imageContent = getItemImageContent(item)
  const router = useRouter()

  async function handleSave(message: string, images: ImageContent[]) {
    if (!message) return
    await onOverwrite(message, images)
    setEditing(false)
  }

  async function handleFork(message: string, images: ImageContent[]) {
    if (!message) return
    await onFork(message, images)
    setEditing(false)
  }

  async function handleCopy() {
    if (!rawText) return
    try {
      await copyToClipboard(rawText)
      toast.success('Copied to clipboard')
    } catch (err) {
      reportError(err)
    }
  }

  function handleEdit() {
    setEditing(true)
    router.push(`#item-${item.id}`)
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
      id={`item-${item.id}`}
      className={styles.message}
      data-role={item.role}
      data-editing={editing}
    >
      {!editing && imageUris.length > 0 && (
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

      {!editing && rawThoughts && (
        // TODO: Is there any reason to ever delete model thoughts?
        <Thoughts
          text={rawThoughts}
          show={showThoughts}
          onClick={() => setShowThoughts(!showThoughts)}
        />
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
          initialImages={imageContent}
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
            <a
              className={styles.controlButton}
              href={`#item-${item.id}`}
              title='Link to this message'
            >
              <LinkIcon className={styles.icon} />
            </a>
            <button
              className={styles.controlButton}
              onClick={handleEdit}
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
