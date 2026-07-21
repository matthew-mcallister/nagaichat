import { describe, expect, it } from 'vitest'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import remarkMathMarkup, { MathMarkupOptions } from './index'

async function render(input: string, options?: MathMarkupOptions): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMathMarkup, options)
    .use(remarkRehype)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(input)
  return String(result).trimEnd()
}

describe('remark-math-markup', () => {
  describe('inline \\( ... \\)', () => {
    it('renders inline math in a sentence', async () => {
      const html = await render('The formula \\(E = mc^2\\) is famous.')
      expect(html).toBe('<p>The formula <code class="language-math math-inline">E = mc^2</code> is famous.</p>')
    })

    it('renders inline math with LaTeX commands', async () => {
      const html = await render('\\(\\sin(x) + \\cos(y)\\)')
      expect(html).toBe('<p><code class="language-math math-inline">\\sin(x) + \\cos(y)</code></p>')
    })

    it('renders two inline maths in a row', async () => {
      const html = await render('\\(a\\) and \\(b\\)')
      expect(html).toBe('<p><code class="language-math math-inline">a</code> and <code class="language-math math-inline">b</code></p>')
    })

    it('renders empty inline math', async () => {
      const html = await render('a\\(\\)b')
      expect(html).toBe('<p>a<code class="language-math math-inline"></code>b</p>')
    })
  })

  describe('display \\[ ... \\]', () => {
    it('renders display math in a sentence', async () => {
      const html = await render('Text \\[x = y\\] more text.')
      expect(html).toBe('<p>Text <code class="language-math math-display">x = y</code> more text.</p>')
    })

    it('renders display math alone', async () => {
      const html = await render('Alone: \\[E = mc^2\\] here.')
      expect(html).toBe('<p>Alone: <code class="language-math math-display">E = mc^2</code> here.</p>')
    })

    it('renders display math with LaTeX commands', async () => {
      const html = await render('\\[\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\\]')
      expect(html).toBe('<p><code class="language-math math-display">\\sum_{i=1}^n i = \\frac{n(n+1)}{2}</code></p>')
    })

    it('preserves multi-line content verbatim', async () => {
      const html = await render('\\[\nx = 1\n  y = 2\n\\]')
      expect(html).toBe('<p><code class="language-math math-display">\nx = 1\n  y = 2\n</code></p>')
    })

    it('renders display math in a list item', async () => {
      const html = await render('- \\[x = 1\\]')
      expect(html).toBe('<ul>\n<li><code class="language-math math-display">x = 1</code></li>\n</ul>')
    })
  })

  describe('mixed', () => {
    it('renders inline then display', async () => {
      const html = await render('\\(a\\) then \\[b\\]')
      expect(html).toBe('<p><code class="language-math math-inline">a</code> then <code class="language-math math-display">b</code></p>')
    })
  })

  describe('edge cases', () => {
    it('treats unterminated inline as literal text', async () => {
      const html = await render('no math here \\(x')
      expect(html).toBe('<p>no math here (x</p>')
    })

    it('treats unterminated display as literal text', async () => {
      const html = await render('no math \\[x here')
      expect(html).toBe('<p>no math [x here</p>')
    })

    it('treats escaped open as not inline math', async () => {
      const html = await render('escaped \\\\( not math')
      expect(html).toBe('<p>escaped \\( not math</p>')
    })

    it('treats escaped open bracket as not display math', async () => {
      const html = await render('escaped \\\\[ not display')
      expect(html).toBe('<p>escaped \\[ not display</p>')
    })

    it('handles escaped backslash before math', async () => {
      const html = await render('literal \\\\ then \\(x\\)')
      expect(html).toBe('<p>literal \\ then <code class="language-math math-inline">x</code></p>')
    })

    it('retains leading space inside display math', async () => {
      const html = await render('\\[ x \\]')
      expect(html).toBe('<p><code class="language-math math-display"> x </code></p>')
    })
  })

  describe('$$ ... $$', () => {
    it('renders display math with $$ delimiters', async () => {
      const html = await render('Text $$x = y$$ more.')
      expect(html).toBe('<p>Text <code class="language-math math-display">x = y</code> more.</p>')
    })

    it('renders display math alone', async () => {
      const html = await render('$$E = mc^2$$')
      expect(html).toBe('<p><code class="language-math math-display">E = mc^2</code></p>')
    })

    it('preserves multi-line content', async () => {
      const html = await render('$$\nx = 1\n  y = 2\n$$')
      expect(html).toBe('<p><code class="language-math math-display">\nx = 1\n  y = 2\n</code></p>')
    })

    it('treats unterminated $$ as literal text', async () => {
      const html = await render('no math $$x here')
      expect(html).toBe('<p>no math $$x here</p>')
    })

    it('disables $$ when doubleDollarSign is false', async () => {
      const html = await render('$$x$$', { doubleDollarSign: false })
      expect(html).toBe('<p>$$x$$</p>')
    })
  })

  describe('$ ... $', () => {
    it('renders inline math with $ when enabled', async () => {
      const html = await render('$E = mc^2$ is a formula.', { dollarSign: true })
      expect(html).toBe('<p><code class="language-math math-inline">E = mc^2</code> is a formula.</p>')
    })

    it('renders two inline dollar maths in a row', async () => {
      const html = await render('$a$ and $b$', { dollarSign: true })
      expect(html).toBe('<p><code class="language-math math-inline">a</code> and <code class="language-math math-inline">b</code></p>')
    })

    it('treats $ as literal text when dollarSign is disabled', async () => {
      const html = await render('Price $5 and $10')
      expect(html).toBe('<p>Price $5 and $10</p>')
    })

    it('treats unterminated $ as literal text', async () => {
      const html = await render('no math $x', { dollarSign: true })
      expect(html).toBe('<p>no math $x</p>')
    })
  })

  describe('\\$ escape', () => {
    it('\\$ outside math emits a literal $', async () => {
      const html = await render('a \\$ b')
      expect(html).toBe('<p>a $ b</p>')
    })

    it('\\$ inside dollar inline math is preserved as \\$', async () => {
      const html = await render('$a\\$b$', { dollarSign: true })
      expect(html).toBe('<p><code class="language-math math-inline">a\\$b</code></p>')
    })

    it('\\$ inside dollar display math is preserved as \\$', async () => {
      const html = await render('$$a\\$b$$')
      expect(html).toBe('<p><code class="language-math math-display">a\\$b</code></p>')
    })

    it('\\$ inside dollar math does not close early', async () => {
      const html = await render('$x\\$ y$', { dollarSign: true })
      expect(html).toBe('<p><code class="language-math math-inline">x\\$ y</code></p>')
    })

    it('\\$ then $ starts a new inline math', async () => {
      const html = await render('a \\$ $x$', { dollarSign: true })
      expect(html).toBe('<p>a $ <code class="language-math math-inline">x</code></p>')
    })
  })

  describe('$$ / $ precedence', () => {
    it('$$x$$ parsed as one display math when both enabled', async () => {
      const html = await render('a $$x$$ b', { dollarSign: true })
      expect(html).toBe('<p>a <code class="language-math math-display">x</code> b</p>')
    })

    it('$x$ $$y$$ parsed as inline then display', async () => {
      const html = await render('a $x$ $$y$$ b', { dollarSign: true })
      expect(html).toBe('<p>a <code class="language-math math-inline">x</code> <code class="language-math math-display">y</code> b</p>')
    })
  })
})
