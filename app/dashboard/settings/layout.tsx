import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireAuth()

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      {children}
    </DashboardLayout>
  )
}
