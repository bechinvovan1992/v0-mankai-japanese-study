"use client"

import { Navigation } from "@/components/navigation"
import { ReviewPlayer } from "@/components/review-player"

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-3 md:p-8">
          <div className="mb-4 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Ôn tập</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Ôn tập câu hỏi với thẻ ghi nhớ tương tác
            </p>
          </div>
          <ReviewPlayer />
        </div>
      </main>
    </div>
  )
}
