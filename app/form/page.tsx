// app/form/page.js
import { Suspense } from 'react'
import SafetyObservationForm from '@/components/FormContent'
export const dynamic = 'force-dynamic'

export default function FormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">กำลังโหลด...</h1>
          <p className="text-gray-600">กรุณารอสักครู่...</p>
        </div>
      </div>
    }>
      <SafetyObservationForm />
    </Suspense>
  )
}