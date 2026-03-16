"use client"

import { Navigation } from "@/components/navigation"
import { SettingsPanel } from "@/components/settings-panel"

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Cài đặt</h1>
            <p className="text-muted-foreground">
              Tùy chỉnh trải nghiệm học tập của bạn
            </p>
          </div>
          <SettingsPanel />
        </div>
      </main>
    </div>
  )
}
