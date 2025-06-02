// app/employeer/page.js
import { Suspense } from 'react'
import EmployeerContent from '@/components/EmployeerContent'
export const dynamic = 'force-dynamic'

export default function EmployeerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeerContent />
    </Suspense>
  )
}