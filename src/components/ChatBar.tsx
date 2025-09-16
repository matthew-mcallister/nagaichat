import { InlineContent } from '@/lib/frontend/api'
import { ChatBarAction } from '@/lib/frontend/common'
import { ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'
import { KeyboardEvent, useRef, useState } from 'react'
import styles from './ChatBar.module.scss'

interface ImageThumbnailProps {
  content: InlineContent
  onRemove(): void | Promise<void>
}

function ImageThumbnail({ content, onRemove }: ImageThumbnailProps) {
  // - Thumbnail is 4rem x 4rem max
  // - Border radius is --radius-md
  // - An "X" icon in the upper right corner calls onRemove
  //   - The icon should be relatively positioned partially outside the icon
  return <></>
}

interface ChatBarProps {
  onSend: (text: string, images: InlineContent[]) => void | Promise<void>
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
  console.log(images)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!message.trim()) {
      return
    }
    try {
      await onSend(message.trim(), images)
    } catch (e) {
      return
    }
    setMessage('')
    setImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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

  const canSend = message.trim().length > 0

  // TODO: Fix style when input is disabled but button is enabled
  return (
    <div className={styles.chatBar}>
      <div
        className={`${styles.inputContainer} ${disabled || action !== 'send' ? styles.disabled : ''}`}
      >
        {/* Pasting an image from the clipboard should add it to the list. */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || action !== 'send'}
          className={styles.textarea}
          rows={1}
        />

        {/* Row of ImageThumbnails goes here, below the text area. */}

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
  )
}
