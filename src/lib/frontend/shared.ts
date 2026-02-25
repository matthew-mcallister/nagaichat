export const INTERFACES = ['deepseek', 'gemini', 'openai', 'anthropic'] as const
type InterfaceTuple = typeof INTERFACES
export type Interface = InterfaceTuple[number]

export interface Integration {
  id: number
  name: string
  interface: Interface
  baseUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateIntegrationRequest {
  name: string
  interface: Interface
  apiKey: string
  baseUrl?: string
}

export interface UpdateIntegrationRequest {
  name?: string
  interface?: Interface
  apiKey?: string
  baseUrl?: string
}

export interface ModelInfo {
  name: string
  displayName: string | null
}

export interface ModelOptions {
  integration: number
  model: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
  // TODO: Explicit content settings
}

// FIXME: Handle missing options correctly
export interface SessionOptions {
  modelOptions: ModelOptions
  renderMarkdown: boolean
}

export interface Preset {
  id: number
  name: string
  options: SessionOptions
}

export interface CreatePresetRequest {
  name: string
  options: SessionOptions
}

export interface UpdatePresetRequest {
  name?: string
  options?: SessionOptions
}

export type TextContent = {
  type: 'text'
  text: string
}

export type ThoughtContent = {
  type: 'thought'
  text: string
}

export type InlineContent = {
  type: 'inline'
  mimeType: string
  /** base64-encoded data */
  data: string
}

export type StaticContent = {
  type: 'static'
  id: number
  url: string
}

export type ContentObject =
  | TextContent
  | ThoughtContent
  | InlineContent
  | StaticContent
export type Content = ContentObject

export type ImageContent = InlineContent | StaticContent

export type Role = 'user' | 'model'

export interface Session {
  id: number
  name: string
  presetId: number | null
  latestItemId: number | null
  options: SessionOptions
  createdAt: string
  updatedAt: string
}

/// Creates a new session with the given initial message and options.
export interface CreateSessionRequest {
  initialContent: Content | Content[]
  presetId?: number
  options: SessionOptions
}

export interface Item {
  id: number
  sessionId: number
  parentId: number | null
  content: ContentObject[]
  role: Role
  createdAt: string
  updatedAt: string
}

export function getItemText(item: Item): string | undefined {
  for (const content of item.content) {
    if (content.type === 'text') {
      return content.text
    }
  }
}

export function getItemImageContent(item: Item): ImageContent[] {
  const images: ImageContent[] = []
  for (const content of item.content) {
    if (content.type === 'static' || content.type === 'inline') {
      images.push(content)
    }
  }
  return images
}

export function getItemImageUris(item: Item): string[] {
  const uris = []
  for (const content of item.content) {
    switch (content.type) {
      case 'static':
        uris.push(content.url)
        break
      case 'inline':
        uris.push(`data:${content.mimeType};base64,${content.data}`)
    }
  }
  return uris
}

export function getItemThoughts(item: Item): string {
  let thoughts = ''
  for (const content of item.content) {
    if (content.type === 'thought') {
      thoughts += content.text + '\n'
    }
  }
  return thoughts.trim()
}

export interface CreateModelItemRequest {
  role: 'model'
  sessionId: number
  parentId: number | null
  presetId: number | null
  options: SessionOptions
  content: ContentObject[] | null
}

export interface CreateUserItemRequest {
  role: 'user'
  sessionId: number
  parentId: number | null
  presetId: number | null
  options: SessionOptions
  content: ContentObject[]
}

export type CreateItemRequest = CreateModelItemRequest | CreateUserItemRequest

export interface UpdateItemRequest {
  content: ContentObject[]
}

export interface SessionOptionsFields {
  integration?: number
  model?: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
  renderMarkdown: boolean
}

export function validateOptions(
  options: SessionOptionsFields,
): SessionOptions | null {
  if (!options.integration || !options.model) return null
  return {
    modelOptions: {
      integration: options.integration,
      model: options.model,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      thinkingEnabled: options.thinkingEnabled,
    },
    renderMarkdown: options.renderMarkdown,
  }
}

export function fromPreset(options: SessionOptions): SessionOptionsFields {
  return {
    integration: options.modelOptions.integration,
    model: options.modelOptions.model,
    systemPrompt: options.modelOptions.systemPrompt,
    temperature: options.modelOptions.temperature,
    thinkingEnabled: options.modelOptions.thinkingEnabled,
    renderMarkdown: options.renderMarkdown,
  }
}
