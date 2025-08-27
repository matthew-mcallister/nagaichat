import { NextRequest, NextResponse } from "next/server"

export class BaseError {
  public message: string
  public statusCode: number

  protected static defaultMessage: string = 'An unexpected error occurred'
  protected static defaultStatusCode: number = 500

  constructor(message: string | undefined = undefined, statusCode: number | undefined = undefined) {
    if (message !== undefined) {
      this.message = message
    } else {
      // @ts-ignore
      this.message = this.constructor.defaultMessage
    }
    if (statusCode !== undefined) {
      this.statusCode = statusCode
    } else {
      // @ts-ignore
      this.statusCode = this.constructor.defaultStatusCode
    }
  }

  public toJson(): any {
    return {
      statusCode: this.statusCode,
      message: this.message,
    }
  }
}

export class InvalidRequest extends BaseError {
  protected static defaultStatusCode = 400
  protected static defaultMessage = 'Invalid request'
}

type NextHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse;

export function handleErrors(handler: NextHandler): NextHandler {
  return async request => {
    try {
      return await handler(request)
    } catch (e: any) {
      if ('toJson' in e) {
        return NextResponse.json(e.toJson())
      } else {
        console.error('Uncaught exception:', e)
        return NextResponse.json(
          { message: 'An unexpected error occurred' },
          { status: 500 },
        )
      }
    }
  }
}
