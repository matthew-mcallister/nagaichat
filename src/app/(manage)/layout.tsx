import ManageLayout from '@/components/ManageLayout'
import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Nagai Chat - API integrations',
  description: 'Manage API integrations',
}

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return <ManageLayout>{children}</ManageLayout>
}
