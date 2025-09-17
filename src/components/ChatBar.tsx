import { InlineContent } from '@/lib/frontend/api'
import { ChatBarAction } from '@/lib/frontend/common'
import {
  ArrowPathIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'
import { KeyboardEvent, useRef, useState } from 'react'
import styles from './ChatBar.module.scss'
import ImagePreview from './ImagePreview'

interface ImageThumbnailProps {
  content: InlineContent
  onRemove(): void | Promise<void>
  onClick(): void | Promise<void>
}

function ImageThumbnail({ content, onRemove, onClick }: ImageThumbnailProps) {
  const imageUrl = `data:${content.mimeType};base64,${content.data}`

  return (
    <div className={styles.imageThumbnail}>
      <img
        src={imageUrl}
        alt='Uploaded image'
        className={styles.thumbnailImage}
        onClick={onClick}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      />
      <button
        onClick={onRemove}
        className={styles.removeButton}
        type='button'
        aria-label='Remove image'
        title='Remove image'
      >
        <XMarkIcon className={styles.removeIcon} />
      </button>
    </div>
  )
}

interface ChatBarProps {
  /**
   * Callback handler for chat bar input.
   *
   * @param text Text content.
   * @param images Attached images.
   * @param reset Callback to reset the chat bar input. When not called (if an
   * if an error occurs, for example), the chat bar input will not be cleared.
   */
  onSend: (
    text: string,
    images: InlineContent[],
    reset: () => void,
  ) => void | Promise<void>
  onStop?: () => void
  onRefresh?: () => void
  action: ChatBarAction
  disabled?: boolean
  placeholder?: string
}

export default function ChatBar({
  onSend,
  onStop,
  onRefresh,
  action,
  disabled,
  placeholder = 'Type a message...',
}: ChatBarProps) {
  const [message, setMessage] = useState('')
  const [images, setImages] = useState<InlineContent[]>([])
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(
    null,
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!message.trim()) {
      return
    }

    function reset() {
      setMessage('')
      setImages([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }

    await onSend(message.trim(), images, reset)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        try {
          const base64 = await fileToBase64(file)
          const inlineContent: InlineContent = {
            type: 'inline',
            mimeType: file.type,
            data: base64,
          }
          setImages(prev => [...prev, inlineContent])
        } catch (e) {
          reportError(e)
        }
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    // Close preview if the removed image was being previewed
    if (previewImageIndex === index) {
      setPreviewImageIndex(null)
    } else if (previewImageIndex !== null && previewImageIndex > index) {
      // Adjust preview index if a previous image was removed
      setPreviewImageIndex(previewImageIndex - 1)
    }
  }

  const handlePreviewImage = (index: number) => {
    setPreviewImageIndex(index)
  }

  const handleClosePreview = () => {
    setPreviewImageIndex(null)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    const items = Array.from(clipboardData.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))

    if (imageItems.length > 0) {
      e.preventDefault() // Prevent default paste behavior for images

      for (const item of imageItems) {
        if (item.type === 'image/png' || item.type === 'image/jpeg') {
          const file = item.getAsFile()
          if (file) {
            try {
              const base64 = await fileToBase64(file)
              const inlineContent: InlineContent = {
                type: 'inline',
                mimeType: file.type,
                data: base64,
              }
              setImages(prev => [...prev, inlineContent])
            } catch (e) {
              reportError(e)
            }
          }
        }
      }
    }
  }

  const canSend = message.trim().length > 0

  // TODO: Fix style when input is disabled but button is enabled
  return (
    <>
      {previewImageIndex !== null && (
        <ImagePreview
          imageUri={`data:${images[previewImageIndex].mimeType};base64,${images[previewImageIndex].data}`}
          onClose={handleClosePreview}
        />
      )}
      <div className={styles.chatBar}>
        <div
          className={`${styles.inputContainer} ${disabled || action !== 'send' ? styles.disabled : ''}`}
        >
          <div className={styles.textAndThumbnailsContainer}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled || action !== 'send'}
              className={styles.textarea}
              rows={1}
            />

            {images.length > 0 && (
              <div className={styles.thumbnailsContainer}>
                {images.map((image, index) => (
                  <ImageThumbnail
                    key={index}
                    content={image}
                    onRemove={() => handleRemoveImage(index)}
                    onClick={() => handlePreviewImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/png,image/jpeg'
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            onClick={handleUploadClick}
            className={`${styles.button} ${styles.uploadButton}`}
            type='button'
            aria-label='Upload image'
            title='Upload image'
            disabled={disabled || action !== 'send'}
          >
            <PhotoIcon className={styles.icon} />
          </button>

          {action === 'stop' ? (
            <button
              onClick={onStop}
              className={`${styles.button} ${styles.stopButton}`}
              type='button'
              aria-label='Stop generation'
              title='Stop generation'
              disabled={disabled}
            >
              <StopIcon className={styles.icon} />
            </button>
          ) : action === 'refresh' ? (
            <button
              onClick={onRefresh}
              className={`${styles.button} ${styles.sendButton}`}
              type='button'
              aria-label='Generate response'
              title='Generate response'
              disabled={disabled}
            >
              <ArrowPathIcon className={styles.icon} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className={`${styles.button} ${styles.sendButton} ${canSend ? styles.active : ''}`}
              type='button'
              aria-label='Send message'
              title='Send message'
              disabled={disabled || !canSend}
            >
              <PaperAirplaneIcon className={styles.icon} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
