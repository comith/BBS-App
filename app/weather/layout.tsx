import type React from "react"
import MobileTabBar from "@/components/MobileTab"

export default function WeatherLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="flex flex-col w-full mx-auto mb-[50px] md:mb-0 relative">
        {children}
      </div>
      <MobileTabBar activeTab="weather" />
    </div>
  )
}
