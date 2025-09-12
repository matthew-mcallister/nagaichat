'use client'

import {
  Preset,
  SessionOptions,
  SessionOptionsFields,
} from '@/lib/frontend/api'
import { createContext, ReactNode, useContext } from 'react'

interface ChatContextType {
  // TODO: Ah, probably this should be
  // options: SessionOptionsFields
  // modelOptions: ModelOptions | null
  options: SessionOptions | null
  setOptions: (options: SessionOptions) => void
  rawOptions: SessionOptionsFields
  presets: Preset[] | null
  preset: Preset | null
  setPreset: (preset: Preset) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatContextProvider')
  }
  return context
}

interface ChatContextProviderProps extends ChatContextType {
  children: ReactNode
}

export function ChatContextProvider({
  children,
  options,
  rawOptions,
  setOptions,
  preset,
  presets,
  setPreset,
}: ChatContextProviderProps) {
  return (
    <ChatContext.Provider value={{ options, setOptions, preset, presets, setPreset, rawOptions }}>
      {children}
    </ChatContext.Provider>
  )
}
