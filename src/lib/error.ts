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
      statusCode: this.statusCode,
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

type NextHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse

/**
 * Backend endpoint wrapper adding error handling.
 */
export function handleErrors(handler: NextHandler): NextHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (e: any) {
      let response
      if ('toJson' in e) {
        response = NextResponse.json({ error: e.message }, { status: e.statusCode })
      } else {
        response = NextResponse.json(
          { error: 'An unexpected error occurred' },
          { status: 500 },
        )
      }

      if (response.status === 500) {
        console.error('Uncaught exception:', e)
      }

      return response
    }
  }
}

/**
 * Frontend helper to display an error notification.
 */
export function reportError(error: Error | string | any) {
  const message = (error instanceof Error) ? error.message : String(error)
  console.error(message, error)
  toast.error(message)
}
