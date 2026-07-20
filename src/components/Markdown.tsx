import remarkMathMarkup from "@/lib/remark-math-markup"
import { memo } from "react"
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownProps {
  text: string
  render?: boolean
  renderMath?: boolean
}

const RenderMarkdown = memo(function RenderMarkdown(props: MarkdownProps) {
  const renderMath = true
  return <div className='markdown'>
      <ReactMarkdown
      remarkPlugins={renderMath ? [remarkMathMarkup] : []}
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
