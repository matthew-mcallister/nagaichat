'use client'

import {
  Preset,
  SessionOptions,
  SessionOptionsFields,
} from '@/lib/frontend/api'
import { createContext, ReactNode, useContext } from 'react'

interface ChatContextType {
  options: SessionOptions | null
  rawOptions: SessionOptionsFields
  preset: Preset | null
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatContextProvider')
  }
  return context
}

interface ChatContextProviderProps {
  children: ReactNode
  // TODO: Ah, probably just the modelOptions should be nullable instead
  options: SessionOptions | null
  rawOptions: SessionOptionsFields
  preset: Preset | null
}

export function ChatContextProvider({
  children,
  options,
  rawOptions,
  preset,
}: ChatContextProviderProps) {
  return (
    <ChatContext.Provider value={{ options, preset, rawOptions }}>
      {children}
    </ChatContext.Provider>
  )
}
