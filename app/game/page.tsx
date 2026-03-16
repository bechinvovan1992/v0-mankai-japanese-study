"use client"

import { Navigation } from "@/components/navigation"
import { GameBoard } from "@/components/game-board"

export default function GamePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Trò chơi</h1>
            <p className="text-muted-foreground">
              Chơi quiz nhiều người với bảng câu hỏi
            </p>
          </div>
          <GameBoard />
        </div>
      </main>
    </div>
  )
}
