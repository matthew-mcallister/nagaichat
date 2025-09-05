'use client'

import ChatBar from '@/components/ChatBar'
import ChatHistory from '@/components/ChatHistory'
import Api from '@/lib/frontend/api'
import { useState } from 'react'
import styles from './Chat.module.scss'

export interface ChatProps {
  sessionId: number
}

export default function Chat({ sessionId }: ChatProps) {
  const api = new Api()
  const items = api.useSessionItems(sessionId)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = (message: string) => {}
  const handleStop = () => {}

  return (
    <div className={styles.chatPage}>
      <ChatHistory
        disabled={isLoading}
        awaitingResponse={isLoading}
        items={items || []}
      />

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
