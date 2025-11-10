import { Suspense } from 'react'
import GuestCancelPage from './guest-cancel-page'

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <GuestCancelPage />
    </Suspense>
  )
}
