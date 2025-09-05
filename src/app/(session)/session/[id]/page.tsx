import Chat from '@/components/Chat'
import { Session } from '@/lib/backend/session'
import { parseInteger } from '@/lib/util'
import { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params
  const session = await Session.getById(parseInteger(id))
  return {
    title: session.name,
  }
}

export default function SessionPage() {
  return <Chat />
}
