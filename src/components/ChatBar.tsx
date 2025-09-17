import { ImageContent, InlineContent } from '@/lib/frontend/api'
import { ChatBarAction } from '@/lib/frontend/common'
import { ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'
import { KeyboardEvent, useRef, useState } from 'react'
import { AttachedImages } from './AttachedImages'
import styles from './ChatBar.module.scss'

interface ChatBarProps {
  /**
   * Callback handler for chat bar input.
   *
   * @param text Text content.
   * @param images Attached images.
   * @param reset Callback to reset the chat bar input. If not called (when an
   * error occurs, for example), the chat bar input will not be cleared.
   */
  onSend: (
    text: string,
    images: ImageContent[],
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
  const [images, setImages] = useState<ImageContent[]>([])
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
      <div className={styles.chatBar}>
        <div
          className={`${styles.inputContainer} ${disabled || action !== 'send' ? styles.disabled : ''}`}
        >
          <div className={styles.textAndThumbnailsContainer}>
            <AttachedImages images={images} setImages={setImages} />

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
