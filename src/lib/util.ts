import { ValidationError } from '@/lib/error'

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