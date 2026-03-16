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
  SkipBack,
  SkipForward,
  Shuffle,
  RotateCcw,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
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
      toast.error("No flashcards to play")
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
          toast.success("Flashcard review complete!")
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
    toast.success("Cards shuffled")
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
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Datasets Selected</h3>
          <p className="text-muted-foreground mb-4">
            Go to the Datasets page to select datasets for flashcard study.
          </p>
          <Button asChild>
            <a href="/datasets">Select Datasets</a>
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
                <Label className="text-xs text-muted-foreground">Filter</Label>
                <Select
                  value={flashcardFilter}
                  onValueChange={(v) => setFlashcardFilter(v as "all" | "grammar" | "vocabulary")}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="grammar">Grammar Only</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                {flashcardQuestions.length} cards from {selectedDatasetIds.length} dataset(s)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShuffle}>
                <Shuffle className="w-4 h-4 mr-1" />
                Shuffle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Auto Play
              </Button>
            </div>
          </div>

          {/* Auto Play Settings */}
          {showSettings && (
            <div className="mt-4 p-4 bg-secondary/50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Front side time: {frontTime}s</Label>
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
                  <Label className="text-sm">Back side time: {backTime}s</Label>
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
                    Stop Auto Play
                  </Button>
                ) : (
                  <Button onClick={startAutoPlay}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Auto Play
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
          <div className="text-sm text-muted-foreground">
            Card {currentFlashcardIndex + 1} of {flashcardQuestions.length}
          </div>

          {/* Flip Card */}
          <div
            className="flip-card w-full max-w-2xl aspect-[4/3] cursor-pointer"
            onClick={handleFlip}
          >
            <div className={cn("flip-card-inner", isFlipped && "flipped")}>
              {/* Front */}
              <div className="flip-card-front">
                <Card className="w-full h-full border-border/50 flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={currentCard.type === 1 ? "default" : "secondary"}>
                        {currentCard.type === 1 ? "Grammar" : "Vocabulary"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Click to flip
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center p-8">
                    <p className="text-2xl font-medium text-center">
                      {currentCard.question}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Back */}
              <div className="flip-card-back">
                <Card className="w-full h-full border-primary/50 bg-primary/5 flex flex-col overflow-auto">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-success text-success-foreground">Answer</Badge>
                      <span className="text-sm text-muted-foreground">
                        Click to flip
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-6 space-y-4 overflow-auto">
                    {/* Question */}
                    <p className="text-lg text-center text-muted-foreground">
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
                              "p-3 rounded-lg border",
                              isCorrect
                                ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                                : "border-border/50"
                            )}
                          >
                            <span className="font-medium mr-2">
                              {["A", "B", "C", "D"][index]}.
                            </span>
                            {answer}
                            {isCorrect && " ✓"}
                          </div>
                        )
                      })}
                    </div>

                    {/* Explanation */}
                    {currentCard.explain && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium mb-1">Explanation:</p>
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
              disabled={isAutoPlaying}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex gap-1">
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
                      "w-2 h-2 rounded-full transition-all",
                      actualIndex === currentFlashcardIndex
                        ? "bg-primary w-6"
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
              disabled={isAutoPlaying}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No flashcards match your current filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
