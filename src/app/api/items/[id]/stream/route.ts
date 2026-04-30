import { ModelResponse } from '@/lib/backend/integrations/interface'
import { addStreamListener, cancelStream } from '@/lib/backend/stream'
import { handleErrors } from '@/lib/error'
import { parseInteger } from '@/lib/util'
import { NextRequest, NextResponse } from 'next/server'

// Returns an SSE stream of type Content[]
export const GET = handleErrors(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const id = parseInteger(params.id)
    const encoder = new TextEncoder()

    let pendingVersion: ModelResponse | null = null
    let queuedVersion = 0
    let consumedVersion = 0
    let listenerClosed = false
    let responseClosed = false
    let intervalId: ReturnType<typeof setInterval> | undefined

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const closeResponse = () => {
          if (responseClosed) {
            return
          }
          responseClosed = true
          if (intervalId) {
            clearInterval(intervalId)
          }
          controller.enqueue(encoder.encode('event: close\ndata: null\n\n'))
          controller.close()
        }

        const flushPendingUpdate = () => {
          if (
            responseClosed ||
            queuedVersion <= consumedVersion ||
            !pendingVersion
          ) {
            return
          }

          consumedVersion = queuedVersion
          controller.enqueue(
            encoder.encode(
              `event: update\ndata: ${JSON.stringify(pendingVersion.content)}\n\n`,
            ),
          )
        }

        intervalId = setInterval(() => {
          flushPendingUpdate()
          if (listenerClosed && queuedVersion <= consumedVersion) {
            closeResponse()
          }
        }, 20)

        addStreamListener(id, {
          onUpdate(data) {
            pendingVersion = data
            queuedVersion += 1
          },
          onClose() {
            listenerClosed = true
          },
        })
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
      },
    })
  },
)

export const DELETE = handleErrors(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    cancelStream(parseInteger(params.id))
    return new NextResponse(null, { status: 204 })
  },
)
