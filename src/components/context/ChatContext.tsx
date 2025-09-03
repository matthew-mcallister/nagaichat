'use client'

import { Preset, SessionOptions } from '@/lib/frontend/api'
import { createContext, ReactNode, useContext } from 'react'

interface ChatContextType {
  options: SessionOptions | null
  preset?: Preset
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
  preset?: Preset
}

export function ChatContextProvider({
  children,
  options,
  preset,
}: ChatContextProviderProps) {
  return (
    <ChatContext.Provider value={{ options, preset }}>
      {children}
    </ChatContext.Provider>
  )
}
