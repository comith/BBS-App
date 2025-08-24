import type React from "react"
import MobileTabBar from "@/components/MobileTab"

export default function FormLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex bg-gray-100">
      <div className="flex flex-col w-full mx-auto mb-[50px] md:mb-0">
        {children}
      </div>
      <MobileTabBar activeTab="form" />
     
    </div>
  )
}