"use client"

import { Navigation } from "@/components/navigation"
import { ReviewPlayer } from "@/components/review-player"

export default function ReviewPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Ôn tập</h1>
            <p className="text-muted-foreground">
              Ôn tập câu hỏi với thẻ ghi nhớ tương tác
            </p>
          </div>
          <ReviewPlayer />
        </div>
      </main>
    </div>
  )
}
