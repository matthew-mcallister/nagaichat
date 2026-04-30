import { Session } from '@/lib/backend/session'
import { handleErrors } from '@/lib/error'
import { CreateSessionRequest } from '@/lib/frontend/shared'
import { withTransaction } from '@/lib/util'
import { NextRequest, NextResponse } from 'next/server'

export const GET = handleErrors(async () => {
  const sessions = await Session.getAll()
  const result = sessions.map(session => session.toApiJson())
  return NextResponse.json(result)
})

export const POST = handleErrors(async (request: NextRequest) => {
  const body: CreateSessionRequest = await request.json()
  const session = await withTransaction(transaction =>
    Session.doCreate(body, transaction),
  )
  return NextResponse.json(session.toApiJson(), { status: 201 })
})
