import type React from "react"
import { Toaster } from "@/components/ui/toaster"

export default function ShemanageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* <Sidebar /> */}
        {children}
        <Toaster />
    </div>
  )
}
