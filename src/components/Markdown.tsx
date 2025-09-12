import DOMPurify from 'dompurify'
import { marked } from 'marked'

interface MarkdownProps {
  text: string
  render?: boolean
}

export default function Markdown({ text, render }: MarkdownProps) {
  if (render) {
    const html = marked.parse(text, { async: false })
    const body = DOMPurify.sanitize(html)
    return (
      <div className='markdown' dangerouslySetInnerHTML={{ __html: body }} />
    )
  } else {
    return <div className='markdown'>{text}</div>
  }
}
