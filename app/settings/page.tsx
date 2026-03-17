"use client"

import { Navigation } from "@/components/navigation"
import { SettingsPanel } from "@/components/settings-panel"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-3 md:p-8">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Cài đặt</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Tùy chỉnh trải nghiệm học tập của bạn
            </p>
          </div>
          
          <SettingsPanel />
        </div>
      </main>
    </div>
  )
}
