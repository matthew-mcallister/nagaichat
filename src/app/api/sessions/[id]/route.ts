import { NextRequest, NextResponse } from 'next/server'
import { handleErrors } from '@/lib/error'
import { Session } from '@/lib/backend/session'
import { parseInteger } from '@/lib/util'

export const GET = handleErrors(async (request: NextRequest, { params }: { params: { id: string } }) => {
  params = await params
  const id = parseInteger(params.id)
  const session = await Session.getById(id)
  return NextResponse.json(session.toApiJson())
})

export const DELETE = handleErrors(async (request: NextRequest, { params }: { params: { id: string } }) => {
  params = await params
  const id = parseInteger(params.id)
  const session = await Session.getById(id)
  await session.destroy()
  return new NextResponse(null, { status: 204 })
})
