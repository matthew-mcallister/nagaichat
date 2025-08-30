'use client'

import { useState } from 'react'
import ChatBar from '@/components/ChatBar'
import styles from './page.module.scss'

export default function NewChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  const handleSend = (message: string) => {
    setMessages(prev => [...prev, message])

    // Simulate loading state
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  const handleStop = () => {
    setIsLoading(false)
  }

  return (
    <div className={styles.chatPage}>
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            {message}
          </div>
        ))}
        {isLoading && (
          <div className={styles.loadingMessage}>AI is thinking...</div>
        )}
      </div>

      <div className={styles.chatBarContainer}>
        <ChatBar
          onSend={handleSend}
          onStop={handleStop}
          loading={isLoading}
          placeholder='Send a message...'
        />
      </div>
    </div>
  )
}
