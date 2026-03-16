"use client"

import { Navigation } from "@/components/navigation"
import { DashboardStats } from "@/components/dashboard-stats"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <DashboardStats />
        </div>
      </main>
    </div>
  )
}
