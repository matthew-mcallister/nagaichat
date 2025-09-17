'use client'

import ChatBar from '@/components/ChatBar'
import { useChatContext } from '@/components/context/ChatContext'
import Api, { InlineContent } from '@/lib/frontend/api'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './page.module.scss'

export default function NewChat() {
  const { options, preset } = useChatContext()
  const router = useRouter()
  const api = new Api()

  const [processing, setProcessing] = useState<boolean>(false)

  async function handleSend(
    message: string,
    images: InlineContent[],
    reset: () => void,
  ) {
    if (!message.trim()) return
    if (!options) return

    setProcessing(true)
    try {
      const session = await api.createSession({
        initialContent: [
          {
            type: 'text',
            text: message,
          },
          ...images,
        ],
        options,
        presetId: preset?.id,
      })
      localStorage.setItem('generate-response-for', String(session.id))
      router.push(`/session/${session.id}`)
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
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
          action={'send'}
          disabled={!options || processing}
          placeholder='Send a message...'
        />
      </div>
    </div>
  )
}
