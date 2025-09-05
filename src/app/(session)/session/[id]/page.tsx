'use client'

import Chat from '@/components/Chat'
import { useParams, useRouter } from 'next/navigation'

export default function Session() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  if (isNaN(sessionId)) {
    router.push('/')
  }
  return <Chat sessionId={sessionId} />
}
