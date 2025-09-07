import { ChatBarAction } from '@/lib/frontend/common'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'
import { KeyboardEvent, useRef, useState } from 'react'
import styles from './ChatBar.module.scss'

interface ChatBarProps {
  onSend: (message: string) => void
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!message.trim()) {
      return
    }
    onSend(message.trim())
    setMessage('')
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
    // XXX: Why is this a thing?
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const canSend = message.trim().length > 0

  // TODO: Fix style when input is disabled but button is enabled
  return (
    <div className={styles.chatBar}>
      <div
        className={`${styles.inputContainer} ${disabled || action !== 'send' ? styles.disabled : ''}`}
      >
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

        {action === 'stop' ? (
          <button
            onClick={onStop}
            className={`${styles.button} ${styles.stopButton}`}
            type='button'
            aria-label='Stop generation'
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
            disabled={disabled || !canSend}
          >
            <PaperAirplaneIcon className={styles.icon} />
          </button>
        )}
      </div>
    </div>
  )
}
