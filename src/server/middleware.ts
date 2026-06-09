import { Request, Response, NextFunction } from 'express'
import { mapError } from '@/lib/error'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const e = mapError(err)
  if (e.statusCode === 500) {
    console.error('Uncaught exception:', e)
  }
  res.status(e.statusCode).json(e.toJson())
}
