"use client"

import { useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { useAppStore } from "@/lib/store"
import { useGameSounds } from "@/hooks/use-game-sounds"
import { toast } from "sonner"

export default function GamePage() {
  const { startGame, setupTeams, selectedGameMode, gameRound } = useAppStore()
  const { playGameStart, startBgMusic } = useGameSounds()

  const handleStartGame = () => {
    playGameStart()
    startGame()
    if (selectedGameMode === "teambattle") {
      setupTeams(2)
    }
    startBgMusic()
    toast.success("Bắt đầu trò chơi!")
  }

  // If game is in progress, show game board
  // When gameRound is null (after endGame), automatically go back to setup
  if (gameRound) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
          <div className="p-3 md:p-8">
            <GameBoard />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-3 md:p-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Trò chơi</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Chọn dữ liệu, thêm người chơi và bắt đầu chơi
            </p>
          </div>
          <GameSetup onStartGame={handleStartGame} />
        </div>
      </main>
    </div>
  )
}
