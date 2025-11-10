import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationSettingsClient from './notification-settings-client'

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return <NotificationSettingsClient userId={user.id} />
}
