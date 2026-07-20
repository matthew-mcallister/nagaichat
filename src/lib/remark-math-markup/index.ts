/** 
 * remark-math-markup — adds inline math and equation recognition to remark.
 * 
 * This extension detects math content inside standard TeX delimiters, namely
 * `\[ ... \]` or `$$ ... $$` for display mode math and `\( ... \)` or
 * (when enabled) `$ ... $` for inline math.
 * 
 * remark-math-markup outputs elements of the form
 * ```
 *     <code class="language-math [math-inline or math-display]">...</code>
 * ```
 * Use rehype-katex or similar to render TeX markup inside these <code> tags as
 * actual math notation.
 * 
 * TODO: $ and $$ support
 */

import { mathFromMarkdown } from './from-markdown'
import { DISPLAY_TOKENIZER, INLINE_TOKENIZER } from './tokenizer'

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

function mathExtension(options: MathMarkupOptions = {}): any {
  const textConstructs: any[] = []
  if (options.inlineParen !== false) textConstructs.push(INLINE_TOKENIZER)
  if (options.blockBracket !== false) textConstructs.push(DISPLAY_TOKENIZER)
  const extension: any = {}
  if (textConstructs.length > 0) {
    extension.text = { [BACKSLASH]: textConstructs }
  }
  return extension
}

export default function remarkMathMarkup(this: any, options?: MathMarkupOptions): void {
  const data = this.data()
  data.micromarkExtensions = data.micromarkExtensions || []
  data.fromMarkdownExtensions = data.micromarkExtensions || []
  data.micromarkExtensions.push(mathExtension(options))
  data.fromMarkdownExtensions.push(mathFromMarkdown())
}
