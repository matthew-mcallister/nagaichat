import { NextRequest, NextResponse } from 'next/server'
import { CreateSessionRequest, Session } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json()

    // TODO: Implement actual session creation logic
    // For now, return a dummy session with a random ID
    const dummySession: Session = {
      id: Math.floor(Math.random() * 10000) + 1,
      parameters: body.parameters,
      history: [
        {
          role: 'user',
          content: Array.isArray(body.content) ? body.content[0] : body.content
        }
      ]
    }

    return NextResponse.json(dummySession)
  } catch {
    return NextResponse.json(
      { message: 'Failed to create session' },
      { status: 500 }
    )
  }
}
