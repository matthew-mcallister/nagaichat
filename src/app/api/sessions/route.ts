import { NextRequest, NextResponse } from 'next/server'
import { CreateSessionRequest } from '@/lib/frontend/api'
import { handleErrors } from '@/lib/error'
import { Session } from '@/lib/backend/session'

export const GET = handleErrors(async () => {
  const sessions = await Session.getAll()
  const result = sessions.map(session => session.toApiJson())
  return NextResponse.json(result)
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreateSessionRequest = await request.json()
  const session = await Session.doCreate(body)
  return NextResponse.json(session.toApiJson(), { status: 201 })
})
