/**
 * Tokenizers that recognize math delimiters and emit mathText or mathDisplay
 * tokens. Supports arbitrary delimiter strings with optional backslash-escape
 * handling so that `\$` never acts as a closing delimiter inside math.
 */

import { markdownLineEnding } from 'micromark-util-character'

export interface MathTokenizerOptions {
  start: string
  end: string
  escape?: string
  display: boolean
}

const BACKSLASH = '\\'.charCodeAt(0)

export const INLINE_TOKENIZER = createMathTokenizer({ start: '\\(', end: '\\)', display: false })
export const DISPLAY_TOKENIZER = createMathTokenizer({ start: '\\[', end: '\\]', display: true })
export const DOLLAR_TOKENIZER = createMathTokenizer({ start: '$', end: '$', escape: '$', display: false })
export const DOUBLE_DOLLAR_TOKENIZER = createMathTokenizer({ start: '$$', end: '$$', escape: '$', display: true })

export function createMathTokenizer(options: MathTokenizerOptions): any {
  const prefix = options.display ? 'mathDisplay' : 'mathText'
  const startSeq = options.start
  const endSeq = options.end
  const endTrigger = endSeq.charCodeAt(0)
  const escapeCode = options.escape ? options.escape.charCodeAt(0) : -1
  const hasEscape = escapeCode !== -1
  const guardEmpty = startSeq === endSeq

  return {
    name: prefix,
    tokenize: tokenizeMath,
  }

  function tokenizeMath(effects: any, ok: any, nok: any) {
    return start

    function start(code: number | null): any {
      if (hasEscape && code === BACKSLASH) {
        return effects.attempt(
          { tokenize: tokenizeBackslashEscape, partial: true },
          ok,
          nok,
        )(code)
      }
      return effects.attempt(
        { tokenize: tokenizeOpen, partial: true },
        afterOpen,
        nok,
      )(code)
    }

    function tokenizeOpen(effects: any, ok: any, nok: any) {
      effects.enter(prefix)
      effects.enter(prefix + 'Sequence')
      let pos = 0
      return step

      function step(code: number | null): any {
        if (code !== startSeq.charCodeAt(pos)) return nok(code)
        effects.consume(code)
        pos++
        if (pos >= startSeq.length) {
          effects.exit(prefix + 'Sequence')
          return ok(code)
        }
        return step
      }
    }

    function afterOpen(code: number | null): any {
      if (guardEmpty && code === endTrigger) return nok(code)
      return between(code)
    }

    function between(code: number | null): any {
      if (code === null) return nok(code)
      if (hasEscape && code === BACKSLASH) {
        return effects.attempt(
          { tokenize: tokenizeEscapeInMath, partial: true },
          between,
          backslashAsData,
        )(code)
      }
      if (code === endTrigger) {
        return effects.attempt(
          { tokenize: tokenizeClose, partial: true },
          ok,
          triggerAsData,
        )(code)
      }
      if (markdownLineEnding(code)) {
        effects.enter('lineEnding')
        effects.consume(code)
        effects.exit('lineEnding')
        return between
      }
      effects.enter(prefix + 'Data')
      return data(code)
    }

    function tokenizeClose(effects: any, ok: any, nok: any) {
      effects.enter(prefix + 'Sequence')
      let pos = 0
      return step

      function step(code: number | null): any {
        if (code !== endSeq.charCodeAt(pos)) return nok(code)
        effects.consume(code)
        pos++
        if (pos >= endSeq.length) {
          effects.exit(prefix + 'Sequence')
          effects.exit(prefix)
          return ok(code)
        }
        return step
      }
    }

    function tokenizeEscapeInMath(effects: any, ok: any, nok: any) {
      return backslash

      function backslash(code: number | null): any {
        if (code !== BACKSLASH) return nok(code)
        effects.enter(prefix + 'Data')
        effects.consume(code)
        return escaped
      }

      function escaped(code: number | null): any {
        if (code !== escapeCode) return nok(code)
        effects.consume(code)
        effects.exit(prefix + 'Data')
        return ok(code)
      }
    }

    function tokenizeBackslashEscape(effects: any, ok: any, nok: any) {
      return backslash

      function backslash(code: number | null): any {
        if (code !== BACKSLASH) return nok(code)
        effects.enter(prefix + 'Escape')
        effects.consume(code)
        return escaped
      }

      function escaped(code: number | null): any {
        if (code !== escapeCode) return nok(code)
        effects.exit(prefix + 'Escape')
        effects.enter(prefix + 'Data')
        effects.consume(code)
        effects.exit(prefix + 'Data')
        return ok(code)
      }
    }

    function backslashAsData(code: number | null): any {
      effects.enter(prefix + 'Data')
      effects.consume(code)
      return data
    }

    function triggerAsData(code: number | null): any {
      effects.enter(prefix + 'Data')
      effects.consume(code)
      return data
    }

    function data(code: number | null): any {
      if (code === null || code === endTrigger || markdownLineEnding(code) || (hasEscape && code === BACKSLASH)) {
        effects.exit(prefix + 'Data')
        return between(code)
      }
      effects.consume(code)
      return data
    }
  }
}
