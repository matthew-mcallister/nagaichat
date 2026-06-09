import { mapError } from '@/lib/error'
import { NextFunction, Request, Response } from 'express'

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const e = mapError(err)
  if (e.statusCode === 500) {
    console.error('Uncaught exception:', e)
  }
  res.status(e.statusCode).json(e.toJson())
}
