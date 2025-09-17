import fs from 'node:fs'
import { UPLOAD_DIR } from "@/lib/backend/static"
import { handleErrors } from "@/lib/error"
import mime from 'mime-types'
import { NextRequest, NextResponse } from "next/server"

// Serve a static file from the `content` directory
export const GET = handleErrors(async (request: NextRequest, { params }: { params: { filename: string } }) => {
  const { filename } = params
  const filepath = `${UPLOAD_DIR}/${filename}`
  const content = fs.readFileSync(filepath)
  const contentType = mime.contentType(filename) || 'application/octet-stream'
  return new NextResponse(new Uint8Array(content), { headers: {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  } })
})
