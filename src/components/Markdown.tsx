import remarkMathMarkup, { MathMarkupOptions } from "@/lib/remark-math-markup"
import { memo } from "react"
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownProps {
  text: string
  render?: boolean
  renderMath?: boolean
  useDollarForMath?: boolean
}

const RenderMarkdown = memo(function RenderMarkdown(props: MarkdownProps) {
  const mathOptions: MathMarkupOptions = {
    inlineParen: true,
    blockBracket: true,
    dollarSign: props.useDollarForMath,
    doubleDollarSign: true,
  }
  const renderMath = props.renderMath !== false
  return <div className='markdown'>
    <ReactMarkdown
      remarkPlugins={renderMath ? [[remarkMathMarkup, mathOptions]] : []}
      rehypePlugins={renderMath ? [rehypeKatex] : []}
    >
      {props.text}
    </ReactMarkdown>
  </div>
})

export default function Markdown(props: MarkdownProps) {
  if (props.render) {
    return <RenderMarkdown {...props}/>
  } else {
    return <div>{props.text}</div>
  }
}
