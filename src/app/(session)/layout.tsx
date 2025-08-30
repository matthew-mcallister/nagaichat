import { Metadata } from 'next'
import { ReactNode } from 'react'
import ChatLayout from '@/components/ChatLayout'

export const metadata: Metadata = {
  title: 'Nagai Chat',
  description: 'Start new session',
}

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return <ChatLayout>{children}</ChatLayout>
}
