'use client'

import { createContext, useContext, ReactNode } from 'react'
import { SessionOptions } from '@/lib/frontend/api'

interface ChatContextType {
  options: SessionOptions | null
  // TODO: Preset ID
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatContextProvider')
  }
  return context
}

interface ChatContextProviderProps {
  children: ReactNode
  options: SessionOptions | null
}

export function ChatContextProvider({
  children,
  options,
}: ChatContextProviderProps) {
  return (
    <ChatContext.Provider value={{ options }}>{children}</ChatContext.Provider>
  )
}
