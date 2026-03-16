"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Shuffle,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Timer,
  RotateCw,
} from "lucide-react"
import { toast } from "sonner"

export function FlashcardPlayer() {
  const {
    datasets,
    selectedDatasetIds,
    flashcardQuestions,
    currentFlashcardIndex,
    flashcardFilter,
    settings,
    setFlashcardFilter,
    loadFlashcards,
    nextFlashcard,
    prevFlashcard,
    shuffleFlashcards,
    setFlashcardIndex,
  } = useAppStore()

  const [isFlipped, setIsFlipped] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [frontTime, setFrontTime] = useState(settings.autoPlayFrontTime)
  const [backTime, setBackTime] = useState(settings.autoPlayBackTime)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const currentCard = flashcardQuestions[currentFlashcardIndex]

  // Load flashcards when filter or selection changes
  useEffect(() => {
    loadFlashcards()
  }, [flashcardFilter, selectedDatasetIds, loadFlashcards])

  // Reset flip when card changes
  useEffect(() => {
    setIsFlipped(false)
  }, [currentFlashcardIndex])

  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false)
    setProgress(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  const startAutoPlay = useCallback(() => {
    if (flashcardQuestions.length === 0) {
      toast.error("Không có thẻ để phát")
      return
    }
    setIsAutoPlaying(true)
    setIsFlipped(false)
    setProgress(0)
  }, [flashcardQuestions.length])

  // Auto play logic
  useEffect(() => {
    if (!isAutoPlaying || flashcardQuestions.length === 0) return

    const totalTime = isFlipped ? backTime : frontTime
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newProgress = Math.min((elapsed / totalTime) * 100, 100)
      setProgress(newProgress)
    }, 50)

    timerRef.current = setTimeout(() => {
      if (!isFlipped) {
        setIsFlipped(true)
      } else {
        if (currentFlashcardIndex < flashcardQuestions.length - 1) {
          nextFlashcard()
          setIsFlipped(false)
        } else {
          stopAutoPlay()
          toast.success("Đã ôn tập xong tất cả thẻ!")
        }
      }
      setProgress(0)
    }, totalTime * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [isAutoPlaying, isFlipped, frontTime, backTime, currentFlashcardIndex, flashcardQuestions.length, nextFlashcard, stopAutoPlay])

  const handleFlip = () => {
    if (!isAutoPlaying) {
      setIsFlipped(!isFlipped)
    }
  }

  const handleShuffle = () => {
    shuffleFlashcards()
    setIsFlipped(false)
    toast.success("Đã xáo trộn thẻ!")
  }

  const handlePrev = () => {
    prevFlashcard()
    setIsFlipped(false)
  }

  const handleNext = () => {
    nextFlashcard()
    setIsFlipped(false)
  }

  const selectedCount = datasets
    .filter((d) => selectedDatasetIds.includes(d.id))
    .reduce((acc, d) => acc + d.totalQuestions, 0)

  if (selectedDatasetIds.length === 0) {
    return (
      <Card className="border-border/50 border-2 border-dashed">
        <CardContent className="py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Chưa chọn bộ dữ liệu</h3>
          <p className="text-muted-foreground mb-6">
            Vào trang Bộ dữ liệu để chọn bộ dữ liệu cho flashcard nhé.
          </p>
          <Button asChild className="bg-gradient-fun hover:opacity-90">
            <a href="/datasets">Chọn bộ dữ liệu</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Lọc theo</Label>
                <Select
                  value={flashcardFilter}
                  onValueChange={(v) => setFlashcardFilter(v as "all" | "grammar" | "vocabulary")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="grammar">Chỉ ngữ pháp</SelectItem>
                    <SelectItem value="vocabulary">Chỉ từ vựng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                {flashcardQuestions.length} thẻ từ {selectedDatasetIds.length} bộ
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShuffle} className="hover:bg-primary/10">
                <Shuffle className="w-4 h-4 mr-1" />
                Xáo trộn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={showSettings ? "bg-primary/10" : ""}
              >
                <Timer className="w-4 h-4 mr-1" />
                Tự động
              </Button>
            </div>
          </div>

          {/* Auto Play Settings */}
          {showSettings && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Mặt trước: {frontTime}s</Label>
                  <Slider
                    value={[frontTime]}
                    onValueChange={([v]) => setFrontTime(v)}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Mặt sau: {backTime}s</Label>
                  <Slider
                    value={[backTime]}
                    onValueChange={([v]) => setBackTime(v)}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {isAutoPlaying ? (
                  <Button onClick={stopAutoPlay} variant="destructive">
                    <Pause className="w-4 h-4 mr-2" />
                    Dừng
                  </Button>
                ) : (
                  <Button onClick={startAutoPlay} className="bg-gradient-fun hover:opacity-90">
                    <Play className="w-4 h-4 mr-2" />
                    Bắt đầu tự động
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Play Progress */}
      {isAutoPlaying && (
        <Progress value={progress} className="h-2" />
      )}

      {/* Flashcard */}
      {flashcardQuestions.length > 0 && currentCard ? (
        <div className="flex flex-col items-center gap-6">
          {/* Card Counter */}
          <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
            Thẻ {currentFlashcardIndex + 1} / {flashcardQuestions.length}
          </div>

          {/* Flip Card */}
          <div
            className="flip-card w-full max-w-2xl aspect-[4/3] cursor-pointer"
            onClick={handleFlip}
          >
            <div className={cn("flip-card-inner", isFlipped && "flipped")}>
              {/* Front */}
              <div className="flip-card-front">
                <Card className="w-full h-full border-2 border-primary/20 flex flex-col hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        className={cn(
                          "py-1",
                          currentCard.type === 1 
                            ? "bg-chart-3 text-chart-3-foreground" 
                            : "bg-chart-4 text-chart-4-foreground"
                        )}
                      >
                        {currentCard.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <RotateCw className="w-4 h-4" />
                        Nhấn để lật
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center p-8">
                    <p className="text-2xl md:text-3xl font-medium text-center leading-relaxed">
                      {currentCard.question}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Back */}
              <div className="flip-card-back">
                <Card className="w-full h-full border-2 border-success/50 bg-success/5 flex flex-col overflow-auto hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-success text-success-foreground py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Đáp án
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <RotateCw className="w-4 h-4" />
                        Nhấn để lật
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-6 space-y-4 overflow-auto">
                    {/* Question */}
                    <p className="text-lg text-center text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                      {currentCard.question}
                    </p>

                    {/* Answers */}
                    <div className="space-y-2">
                      {currentCard.answers.map((answer, index) => {
                        const isCorrect = answer === currentCard.correct
                        return (
                          <div
                            key={index}
                            className={cn(
                              "p-3 rounded-xl border-2",
                              isCorrect
                                ? "border-success bg-success/10"
                                : "border-border/50"
                            )}
                          >
                            <span className={cn(
                              "inline-flex items-center justify-center w-7 h-7 rounded-lg mr-2 text-sm font-bold",
                              isCorrect ? "bg-success text-success-foreground" : "bg-secondary"
                            )}>
                              {["A", "B", "C", "D"][index]}
                            </span>
                            <span className={isCorrect ? "font-medium" : ""}>
                              {answer}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    {currentCard.explain && (
                      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <p className="text-sm font-bold mb-1 text-primary">Giải thích:</p>
                        <p className="text-sm">{currentCard.explain}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrev}
              disabled={isAutoPlaying || currentFlashcardIndex === 0}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex gap-1.5">
              {flashcardQuestions.slice(
                Math.max(0, currentFlashcardIndex - 2),
                Math.min(flashcardQuestions.length, currentFlashcardIndex + 3)
              ).map((_, i) => {
                const actualIndex = Math.max(0, currentFlashcardIndex - 2) + i
                return (
                  <button
                    key={actualIndex}
                    onClick={() => !isAutoPlaying && setFlashcardIndex(actualIndex)}
                    disabled={isAutoPlaying}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      actualIndex === currentFlashcardIndex
                        ? "bg-primary w-8"
                        : "bg-muted hover:bg-muted-foreground/50"
                    )}
                  />
                )
              })}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={handleNext}
              disabled={isAutoPlaying || currentFlashcardIndex >= flashcardQuestions.length - 1}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Không có thẻ nào phù hợp với bộ lọc hiện tại.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
