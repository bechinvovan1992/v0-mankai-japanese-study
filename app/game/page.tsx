"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { useAppStore } from "@/lib/store"
import { useGameSounds } from "@/hooks/use-game-sounds"
import { toast } from "sonner"

export default function GamePage() {
  const [showGame, setShowGame] = useState(false)
  const { startGame, setupTeams, selectedGameMode, gameRound } = useAppStore()
  const { playGameStart, startBgMusic } = useGameSounds()

  const handleStartGame = () => {
    playGameStart()
    startGame()
    if (selectedGameMode === "teambattle") {
      setupTeams(2)
    }
    startBgMusic()
    setShowGame(true)
    toast.success("Bat dau tro choi!")
  }

  // If game is in progress, show game board
  if (gameRound || showGame) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="md:ml-64 pt-16 md:pt-0">
          <div className="p-4 md:p-8">
            <GameBoard />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Tro choi</h1>
            <p className="text-muted-foreground">
              Chon du lieu, them nguoi choi va bat dau choi
            </p>
          </div>
          <GameSetup onStartGame={handleStartGame} />
        </div>
      </main>
    </div>
  )
}
