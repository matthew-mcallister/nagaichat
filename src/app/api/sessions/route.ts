import { NextRequest, NextResponse } from 'next/server'
import { CreateSessionRequest, Session } from '@/lib/frontend/api'
import { handleErrors } from '@/lib/error'

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreateSessionRequest = await request.json()

  // TODO: Implement actual session creation logic
  // For now, return a dummy session with a random ID
  const dummySession: Session = {
    id: Math.floor(Math.random() * 10000) + 1,
    options: body.options,
    history: [
      {
        role: 'user',
        content: Array.isArray(body.content) ? body.content[0] : body.content
      }
    ]
  }

  return NextResponse.json(dummySession)
})
