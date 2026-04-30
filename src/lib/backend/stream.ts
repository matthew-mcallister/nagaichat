import { Integration } from '@/lib/backend/integration'
import {
  ApiConnector,
  ModelResponse,
} from '@/lib/backend/integrations/interface'
import { Item } from '@/lib/backend/item'
import { ModelOptions } from '@/lib/frontend/shared'

export type Listener = {
  onUpdate(data: ModelResponse): void | Promise<void>
  onClose(): void | Promise<void>
}

export class ResponseStream {
  itemId: number
  apiStartStream: (signal: AbortSignal) => AsyncIterable<ModelResponse>
  listeners: Listener[]
  closed: boolean
  controller: AbortController

  constructor(
    itemId: number,
    // Taking this as a callback ensures there is no race condition if session
    // options change between item creation and stream start
    apiStartStream: (signal: AbortSignal) => AsyncIterable<ModelResponse>,
  ) {
    this.itemId = itemId
    this.apiStartStream = apiStartStream
    this.listeners = []
    this.closed = false
    this.controller = new AbortController()
  }

  public async start() {
    if (this.closed) {
      return
    }

    try {
      const stream = this.apiStartStream(this.controller.signal)

      let lastVersion
      let i = 0
      const item = await Item.getById(this.itemId)
      for await (const responseVersion of stream) {
        if (i % 50 === 0) {
          // Batch up updates
          await item.updateContent(responseVersion.content)
        }
        lastVersion = responseVersion
        i += 1
        for (const listener of this.listeners) {
          listener.onUpdate(responseVersion)
        }
      }
      if (lastVersion) {
        await item.updateContent(lastVersion.content)
      }
    } catch (e) {
      if (!this.controller.signal.aborted) {
        console.error('Exception during stream:', e)
      }
    } finally {
      STREAMS.delete(this.itemId)
      this.closed = true
      for (const listener of this.listeners) {
        listener.onClose()
      }
    }
  }

  public abort() {
    this.controller.abort()
  }

  public addListener(listener: Listener) {
    if (this.closed) {
      listener.onClose()
    } else {
      this.listeners.push(listener)
    }
  }
}

// Maps item.id => active stream
// FIXME: Global variables don't work in dev mode. Not really fixable without
// replacing next.js
const STREAMS: Map<number, ResponseStream> = new Map()

export async function startStream(options: ModelOptions, itemId: number) {
  const integration = await Integration.getById(options.integration)
  const api = new ApiConnector(integration)
  const stream = new ResponseStream(itemId, (signal: AbortSignal) =>
    api.generateStreaming(itemId, signal),
  )
  STREAMS.set(itemId, stream)
  stream.start()
}

export function cancelStream(itemId: number): boolean {
  const stream = STREAMS.get(itemId)
  if (!stream) {
    return false
  }

  stream.abort()
  return true
}

export function addStreamListener(id: number, listener: Listener) {
  const stream = STREAMS.get(id)
  if (stream) {
    stream.addListener(listener)
  } else {
    listener.onClose()
  }
}
