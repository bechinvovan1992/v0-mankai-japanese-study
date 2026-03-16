"use client"

import { Navigation } from "@/components/navigation"
import { FlashcardPlayer } from "@/components/flashcard-player"

export default function FlashcardPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Flashcard Study</h1>
            <p className="text-muted-foreground">
              Review questions with interactive flashcards
            </p>
          </div>
          <FlashcardPlayer />
        </div>
      </main>
    </div>
  )
}
