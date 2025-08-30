'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Parameters } from '@/lib/session'

interface ChatContextType {
  parameters: Parameters
  setParameters: (parameters: Parameters) => void
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
  parameters: Parameters
  setParameters: (parameters: Parameters) => void
}

export function ChatContextProvider({
  children,
  parameters,
  setParameters,
}: ChatContextProviderProps) {
  return (
    <ChatContext.Provider value={{ parameters, setParameters }}>
      {children}
    </ChatContext.Provider>
  )
}
