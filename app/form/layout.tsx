import type React from "react"
import { Header } from "@/components/head"
import { Toaster } from "@/components/ui/toaster"
// import { Sidebar } from "@/components/sidebar"

export default function FormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-gray-100">
      {/* <Sidebar /> */}
      <div className="flex flex-col w-full mx-auto">
        <Header />
        {children}
        <Toaster />
      </div>
    </div>
  )
}