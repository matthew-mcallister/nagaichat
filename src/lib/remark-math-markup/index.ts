/**
 * remark-math-markup — adds inline math and equation recognition to remark.
 *
 * This extension detects math content inside standard TeX delimiters, namely
 * `\[ ... \]` or `$$ ... $$` for display mode math and `\( ... \)` or
 * (when enabled) `$ ... $` for inline math. When '$' or '$$' are enabled, use
 * '\$' to escape a literal dollar sign, both in and out of math mode.
 *
 * remark-math-markup outputs elements of the form
 * ```
 *     <code class="language-math [math-inline or math-display]">...</code>
 * ```
 * Use rehype-katex or similar to render TeX markup inside these <code> tags as
 * actual math notation.
 */

import { mathFromMarkdown } from './from-markdown'
import { DISPLAY_TOKENIZER, DOLLAR_TOKENIZER, DOUBLE_DOLLAR_TOKENIZER, INLINE_TOKENIZER } from './tokenizer'

export interface MathMarkupOptions {
  /**
   * Enable inline math with \( ... \) delimiters. Default: true.
   */
  inlineParen?: boolean
  /**
   * Enable display math with \[ ... \] delimiters. Default: true.
   */
  blockBracket?: boolean
  /**
   * Enable inline math with $ ... $ delimiters. Default: false.
   */
  dollarSign?: boolean
  /**
   * Enable display math with $$ ... $$ delimiters. Default: true.
   */
  doubleDollarSign?: boolean
}

const BACKSLASH = '\\'.charCodeAt(0)
const DOLLAR = '$'.charCodeAt(0)

function mathExtension(options: MathMarkupOptions = {}): any {
  const textConstructs: Record<number, any[]> = {}
  const backslashList: any[] = []
  const dollarList: any[] = []

  if (options.inlineParen !== false) backslashList.push(INLINE_TOKENIZER)
  if (options.blockBracket !== false) backslashList.push(DISPLAY_TOKENIZER)
  if (options.doubleDollarSign !== false) {
    backslashList.push(DOUBLE_DOLLAR_TOKENIZER)
    dollarList.push(DOUBLE_DOLLAR_TOKENIZER)
  }
  if (options.dollarSign) {
    backslashList.push(DOLLAR_TOKENIZER)
    dollarList.push(DOLLAR_TOKENIZER)
  }

  if (dollarList.length > 0) textConstructs[DOLLAR] = dollarList
  if (backslashList.length > 0) textConstructs[BACKSLASH] = backslashList

  if (Object.keys(textConstructs).length > 0) {
    return { text: textConstructs }
  } else {
    return {}
  }
}

export default function remarkMathMarkup(this: any, options?: MathMarkupOptions): void {
  const data = this.data()
  data.micromarkExtensions = data.micromarkExtensions || []
  data.fromMarkdownExtensions = data.fromMarkdownExtensions || []
  data.micromarkExtensions.push(mathExtension(options))
  data.fromMarkdownExtensions.push(mathFromMarkdown())
}
