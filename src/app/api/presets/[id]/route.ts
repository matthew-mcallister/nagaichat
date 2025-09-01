import { NextRequest, NextResponse } from 'next/server'
import { handleErrors, NoSuchResource } from '@/lib/error'
import { Preset } from '@/lib/backend/preset'
import { parseInteger } from '@/lib/util'

export const DELETE = handleErrors(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessionOptions = await Preset.getById(parseInteger(params.id))
  await sessionOptions.destroy()
  return new NextResponse(null, { status: 204 })
})
