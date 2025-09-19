import getDb from '@/lib/backend/database'
import { ValidationError } from '@/lib/error'
import { Transaction } from 'sequelize'

export function parseInteger(x: string): number {
  const num = parseInt(x)
  if (isNaN(num)) {
    throw new ValidationError(`Invalid integer: ${num}`)
  }
  return num
}

export interface RetryOptions {
  retries: number
  backoffFactor?: number
  jitter?: boolean
  minWait?: number
  maxWait?: number
}

export function retry<F extends (...args: any[]) => Promise<any>>(
  options: RetryOptions,
): ((fn: F) => F) {
  const retries = options.retries
  const backoffFactor = options.backoffFactor || 2
  const jitter = options.jitter || true
  const minWait = options.minWait || 1
  const maxWait = options.maxWait

  function decorator(fn: F): F {
    const wrapped = async function (...args: any[]): Promise<any> {
      for (let i = retries; i >= 0; i--) {
        try {
          return fn(...args)
        } catch (e) {
          if (i == 0) throw e
        }

        const j = retries - i
        let wait = minWait * Math.pow(backoffFactor, j)
        if (jitter) {
          wait = wait * (1 + Math.random())
        }
        if (maxWait) {
          wait = Math.max(wait, maxWait)
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * wait))
      }
      throw new Error('unreachable')
    } as F
    return wrapped
  }
  return decorator
}

export const downloadContent = retry({ retries: 2 })(async (uri: string): Promise<string> => {
  const res = await fetch(uri)
  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer.toString('base64')
})

export async function withTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<T> {
  const db = await getDb()
  const transaction = await db.transaction()
  try {
    const result = await fn(transaction)
    await transaction.commit()
    return result
  } catch (e) {
    await transaction.rollback()
    throw e
  }
}
