import ChatLayout from '@/components/ChatLayout'
import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Nagai Chat',
  description: 'Chat session',
}

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return <ChatLayout>{children}</ChatLayout>
}
