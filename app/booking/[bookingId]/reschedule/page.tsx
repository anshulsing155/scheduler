import { Suspense } from 'react'
import GuestReschedulePage from './guest-reschedule-page'

export default function ReschedulePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <GuestReschedulePage />
    </Suspense>
  )
}
