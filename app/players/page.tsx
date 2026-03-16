"use client"

import { Navigation } from "@/components/navigation"
import { PlayerManager } from "@/components/player-manager"

export default function PlayersPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Manage Players</h1>
            <p className="text-muted-foreground">
              Add and manage players for the game mode
            </p>
          </div>
          <PlayerManager />
        </div>
      </main>
    </div>
  )
}
