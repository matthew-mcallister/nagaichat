/**
 * Configurable tokenizers. These recognize opening and closing delimiters and
 * emit mathInline or mathDisplay tokens containing the text inside. Newlines,
 * text data, and the delimiters themselves are emitted as nested tokens.
 */

import { markdownLineEnding } from 'micromark-util-character'

export interface MathTokenizerOptions {
  startChar: number
  endChar: number
  displayMode: boolean
}

const BACKSLASH = '\\'.charCodeAt(0)

export const INLINE_TOKENIZER = createMathTokenizer({ 
  startChar: '('.charCodeAt(0),
  endChar: ')'.charCodeAt(0),
  displayMode: false,
})
export const DISPLAY_TOKENIZER = createMathTokenizer({ 
  startChar: '['.charCodeAt(0),
  endChar: ']'.charCodeAt(0),
  displayMode: true,
})

export function createMathTokenizer(options: MathTokenizerOptions): any {
  const prefix = options.displayMode ? 'mathDisplay' : 'mathText'

  return {
    name: prefix,
    tokenize: tokenizeMath,
  }

  function tokenizeMath(effects: any, ok: any, nok: any) {
    return start

    function start(code: number | null): any {
      return effects.attempt(
        {
          tokenize: tokenizeOpen,
          partial: true,
        },
        afterOpen,
        nok,
      )(code)
    }

    function tokenizeOpen(effects: any, ok: any, nok: any) {
      return openStart
      function openStart(code: number | null): any {
        if (code !== BACKSLASH) return nok(code)
        effects.enter(prefix)
        effects.enter(prefix + 'Sequence')
        effects.consume(code)
        return openSecond
      }
      function openSecond(code: number | null): any {
        if (code !== options.startChar) return nok(code)
        effects.consume(code)
        effects.exit(prefix + 'Sequence')
        return ok(code)
      }
    }

    function afterOpen(code: number | null): any {
      return between(code)
    }

    function between(code: number | null): any {
      if (code === null) return nok(code)
      if (code === BACKSLASH) {
        return effects.attempt(
          {
            tokenize: tokenizeClose,
            partial: true,
          },
          ok,
          backslashAsData,
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
      return closeStart
      function closeStart(code: number | null): any {
        if (code !== BACKSLASH) return nok(code)
        effects.enter(prefix + 'Sequence')
        effects.consume(code)
        return closeSecond
      }
      function closeSecond(code: number | null): any {
        if (code !== options.endChar) return nok(code)
        effects.consume(code)
        effects.exit(prefix + 'Sequence')
        effects.exit(prefix)
        return ok(code)
      }
    }

    function backslashAsData(code: number | null): any {
      effects.enter(prefix + 'Data')
      effects.consume(code)
      return data
    }

    function data(code: number | null): any {
      if (code === null || code === BACKSLASH || markdownLineEnding(code)) {
        effects.exit(prefix + 'Data')
        return between(code)
      }
      effects.consume(code)
      return data
    }
  }
}
