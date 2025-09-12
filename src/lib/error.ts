import { NextRequest, NextResponse } from "next/server"
import toast from "react-hot-toast"

export class BaseError extends Error {
  public statusCode: number

  protected static defaultMessage: string = 'An unexpected error occurred'
  protected static defaultStatusCode: number = 500

  constructor(message?: string | undefined, statusCode?: number | undefined) {
    super(message || BaseError.defaultMessage)
    this.statusCode = statusCode || BaseError.defaultStatusCode
  }

  public toJson(): any {
    return {
      message: this.message,
    }
  }
}

export class ValidationError extends BaseError {
  protected static defaultStatusCode = 400
  protected static defaultMessage = 'Invalid request'
}

export class NoSuchResource extends BaseError {
  protected static defaultStatusCode = 404
  protected static defaultMessage = 'No such resource'
}

export class ApiResponseError extends BaseError {
  protected static defaultStatusCode = 500
  protected static defaultMessage = 'Unexpected response from API'
}

export class AbortError extends BaseError {
  protected static defaultStatusCode = 200
  protected static defaultMessage = 'Request aborted'
}

function mapError(e: any): BaseError {
  if (e instanceof BaseError) {
    return e
  } else if (e instanceof DOMException && e.message === 'AbortError') {
    return new AbortError()
  } else {
    console.error('Original exception:', e)
    return new BaseError('An unexpected error occurred')
  }
}

type NextHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse

/**
 * Backend endpoint wrapper adding error handling.
 */
export function handleErrors(handler: NextHandler): NextHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error: any) {
      const e = mapError(error)
      let response = NextResponse.json(e.toJson(), { status: e.statusCode })
      if (response.status === 500) {
        console.error('Uncaught exception:', e)
      }
      return response
    }
  }
}

export function isAbortRequest(error: any): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Frontend helper to display an error notification.
 */
export function reportError(error: Error | string | any) {
  if (isAbortRequest(error)) return
  const message = (error instanceof Error) ? error.message : String(error)
  console.error(message, error)
  toast.error(message)
}
