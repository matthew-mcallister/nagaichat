'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatBar from '@/components/ChatBar'
import { useChatContext } from '@/components/context/ChatContext'
import Api from '@/lib/frontend/api'
import styles from './page.module.scss'

export default function NewChat() {
  const [loading, setLoading] = useState(false)
  const { options } = useChatContext()
  const router = useRouter()
  const api = new Api()

  const handleSend = async (message: string) => {
    if (!message.trim()) return
    if (!options) return

    setLoading(true)
    try {
      const session = await api.createSession(message, options)
      router.push(`/session/${session.id}`)
    } catch (error) {
      reportError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.newChatContainer}>
      <div className={styles.chatBarWrapper}>
        <h1 className={styles.title}>Start chatting</h1>
        <p className={styles.subtitle}>
          Choose a model and start a chat with text or images
        </p>
        <ChatBar
          onSend={handleSend}
          disabled={!options}
          loading={loading}
          placeholder='Send a message...'
        />
      </div>
    </div>
  )
}
