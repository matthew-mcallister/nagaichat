export interface Parameters {
  integration?: number
  model?: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
}

export function areParametersComplete(parameters: Parameters): boolean {
  return (
    parameters.integration !== undefined
    && parameters.model !== undefined
  )
}

export type TextContent = {
  type: 'string'
  message: string
}

// TODO eventually: should support some kind of uploads API
export type ImageContent = {
  type: 'image'
  data: string
}

export type Content = string | TextContent | ImageContent

export type HistoryItem = {
  role: 'user' | 'model'
  content: Content
}

export interface Session {
  id: number
  parameters: Parameters
  history: HistoryItem[]
}

/// Creates a new session with the given initial message and parameters.
export interface CreateSessionRequest {
  content: Content[]
  parameters: Parameters
}

/// Adds a message and generated response to the session. The last used
/// parameters will be saved to the session.
export interface CreateResponseRequest {
  content: Content[]
  parameters: Parameters
}
