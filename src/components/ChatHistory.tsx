'use client'

import { Item } from '@/lib/frontend/api'
import { useState } from 'react'
import styles from './ChatHistory.module.scss'

export interface ChatHistoryProps {
  disabled?: boolean
  awaitingResponse?: boolean
  items: Item[]
}

export function itemText(item: Item): string | undefined {
  for (const content of item.content) {
    if (content.type === 'text') {
      return content.text
    }
  }
}

export default function ChatHistory(props: ChatHistoryProps) {
  const [processing, setProcessing] = useState(false)

  const { items, awaitingResponse } = props
  const disabled = processing || props.disabled

  return (
    <div className={styles.messagesContainer}>
      {items.map(item => {
        const text = itemText(item)
        if (text) {
          return (
            <div key={item.id} className={styles.message}>
              {text}
            </div>
          )
        } else {
          return null
        }
      })}
      {awaitingResponse && (
        // TODO: Better loading visual
        <div className={styles.loadingMessage}>Waiting for response...</div>
      )}
    </div>
  )
}
