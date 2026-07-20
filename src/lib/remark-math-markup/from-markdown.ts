/** 
 * Constructs mdast from tokens. All it does is append the full text of a
 * mathInline/mathDisplay token to the buffer and emits a <code> tag with the
 * buffer contents.
 */

export function mathFromMarkdown(): any {
  return {
    enter: {
      mathText: enterInline,
      mathDisplay: enterDisplay,
    },
    exit: {
      mathText: exitInline,
      mathTextData: exitData,
      mathDisplay: exitDisplay,
      mathDisplayData: exitData,
    },
  }

  function enterInline(this: any, token: any) {
    enter(this, token, 'math-inline')
  }

  function enterDisplay(this: any, token: any) {
    enter(this, token, 'math-display')
  }

  function enter(self: any, token: any, klass: string) {
    self.enter(
      {
        type: 'inlineMath',
        value: '',
        data: {
          hName: 'code',
          hProperties: { className: ['language-math', klass] },
          hChildren: [] as any[],
        },
      },
      token,
    )
    self.buffer()
  }

  function exitInline(this: any, token: any) {
    exit(this, token)
  }

  function exitDisplay(this: any, token: any) {
    exit(this, token)
  }

  function exit(self: any, token: any) {
    const data = self.resume()
    const node = self.stack[self.stack.length - 1]
    self.exit(token)
    node.value = data
    node.data.hChildren.push({ type: 'text', value: data })
  }

  // Emits the text of a mathInlineData/mathDisplayData token to the buffer
  function exitData(this: any, token: any) {
    this.config.enter.data.call(this, token)
    this.config.exit.data.call(this, token)
  }
}
