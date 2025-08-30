import { useState, useRef, KeyboardEvent } from 'react'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'
import styles from './ChatBar.module.scss'

interface ChatBarProps {
  onSend?: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

export default function ChatBar({
  onSend,
  onStop,
  disabled = false,
  loading = false,
  placeholder = 'Type a message...',
}: ChatBarProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim() && onSend && !disabled && !loading) {
      onSend(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleStop = () => {
    if (onStop && loading) {
      onStop()
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

  const canSend = message.trim().length > 0 && !disabled && !loading
  const isInputDisabled = disabled || loading

  return (
    <div className={styles.chatBar}>
      <div
        className={`${styles.inputContainer} ${
          isInputDisabled ? styles.disabled : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isInputDisabled}
          className={styles.textarea}
          rows={1}
        />

        {loading ? (
          <button
            onClick={handleStop}
            className={`${styles.button} ${styles.stopButton}`}
            type='button'
            aria-label='Stop generation'
          >
            <StopIcon className={styles.icon} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`${styles.button} ${styles.sendButton} ${
              canSend ? styles.active : ''
            }`}
            type='button'
            aria-label='Send message'
          >
            <PaperAirplaneIcon className={styles.icon} />
          </button>
        )}
      </div>
    </div>
  )
}
