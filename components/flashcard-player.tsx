"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Shuffle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Timer,
  RotateCw,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Trash2,
  Settings2,
} from "lucide-react"
import { toast } from "sonner"

type FlashcardMode = "flip" | "guess"

export function FlashcardPlayer() {
  const {
    datasets,
    selectedDatasetIds,
    flashcardQuestions,
    currentFlashcardIndex,
    flashcardFilter,
    flashcardMode,
    wrongAnswerIds,
    settings,
    setFlashcardFilter,
    setFlashcardMode,
    loadFlashcards,
    nextFlashcard,
    prevFlashcard,
    shuffleFlashcards,
    setFlashcardIndex,
    markFlashcardWrong,
    markFlashcardCorrect,
    clearWrongAnswers,
  } = useAppStore()

  const [isFlipped, setIsFlipped] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [frontTime, setFrontTime] = useState(settings.autoPlayFrontTime)
  const [backTime, setBackTime] = useState(settings.autoPlayBackTime)
  const [showAnswer, setShowAnswer] = useState(false) // For guess mode
  const [isShuffleMode, setIsShuffleMode] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const currentCard = flashcardQuestions[currentFlashcardIndex]
  const isWrongCard = currentCard ? wrongAnswerIds.includes(currentCard.id) : false

  // Load flashcards when filter or selection changes
  useEffect(() => {
    loadFlashcards()
  }, [flashcardFilter, selectedDatasetIds, loadFlashcards])

  // Reset flip and showAnswer when card changes
  useEffect(() => {
    setIsFlipped(false)
    setShowAnswer(false)
  }, [currentFlashcardIndex])

  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false)
    setProgress(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  const startAutoPlay = useCallback(() => {
    if (flashcardQuestions.length === 0) {
      toast.error("Khong co the de phat")
      return
    }
    setIsAutoPlaying(true)
    setIsFlipped(false)
    setShowAnswer(false)
    setProgress(0)
  }, [flashcardQuestions.length])

  // Auto play logic
  useEffect(() => {
    if (!isAutoPlaying || flashcardQuestions.length === 0) return

    const isShowingAnswer = flashcardMode === "flip" ? isFlipped : showAnswer
    const totalTime = isShowingAnswer ? backTime : frontTime
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newProgress = Math.min((elapsed / totalTime) * 100, 100)
      setProgress(newProgress)
    }, 50)

    timerRef.current = setTimeout(() => {
      if (!isShowingAnswer) {
        if (flashcardMode === "flip") {
          setIsFlipped(true)
        } else {
          setShowAnswer(true)
        }
      } else {
        if (currentFlashcardIndex < flashcardQuestions.length - 1) {
          nextFlashcard()
          setIsFlipped(false)
          setShowAnswer(false)
        } else {
          stopAutoPlay()
          toast.success("Da on tap xong tat ca the!")
        }
      }
      setProgress(0)
    }, totalTime * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [isAutoPlaying, isFlipped, showAnswer, frontTime, backTime, currentFlashcardIndex, flashcardQuestions.length, flashcardMode, nextFlashcard, stopAutoPlay])

  const handleFlip = () => {
    if (!isAutoPlaying && flashcardMode === "flip") {
      setIsFlipped(!isFlipped)
    }
  }

  const handleRevealAnswer = () => {
    if (!isAutoPlaying && flashcardMode === "guess") {
      setShowAnswer(true)
    }
  }

  const handleShuffle = () => {
    shuffleFlashcards()
    setIsFlipped(false)
    setShowAnswer(false)
    setIsShuffleMode(true)
    toast.success("Da xao tron the!")
  }

  const handlePrev = () => {
    prevFlashcard()
    setIsFlipped(false)
    setShowAnswer(false)
  }

  const handleNext = () => {
    nextFlashcard()
    setIsFlipped(false)
    setShowAnswer(false)
  }

  const handleMarkWrong = () => {
    if (currentCard) {
      markFlashcardWrong(currentCard.id)
      toast.info("Da danh dau la cau sai")
    }
  }

  const handleMarkCorrect = () => {
    if (currentCard) {
      markFlashcardCorrect(currentCard.id)
      toast.success("Da bo danh dau cau sai")
    }
  }

  const handleClearWrongAnswers = () => {
    clearWrongAnswers()
    if (flashcardFilter === "wrong") {
      loadFlashcards()
    }
    toast.success("Da xoa tat ca cau sai")
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
          <h3 className="text-xl font-bold mb-2">Chua chon bo du lieu</h3>
          <p className="text-muted-foreground mb-6">
            Vao trang Bo du lieu de chon bo du lieu cho flashcard nhe.
          </p>
          <Button asChild className="bg-gradient-fun hover:opacity-90">
            <a href="/datasets">Chon bo du lieu</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection Tabs */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Study Mode */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Che do hoc</Label>
              <Tabs value={flashcardMode} onValueChange={(v) => setFlashcardMode(v as FlashcardMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="flip" className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Lat the
                  </TabsTrigger>
                  <TabsTrigger value="guess" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Doan dap an
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filter Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-muted-foreground">Loc:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={flashcardFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("all")}
                  className={flashcardFilter === "all" ? "bg-primary" : ""}
                >
                  Tat ca
                </Button>
                <Button
                  variant={flashcardFilter === "grammar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("grammar")}
                  className={flashcardFilter === "grammar" ? "bg-chart-3" : ""}
                >
                  Ngu phap
                </Button>
                <Button
                  variant={flashcardFilter === "vocabulary" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("vocabulary")}
                  className={flashcardFilter === "vocabulary" ? "bg-chart-4" : ""}
                >
                  Tu vung
                </Button>
                <Button
                  variant={flashcardFilter === "wrong" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("wrong")}
                  className={cn(
                    flashcardFilter === "wrong" ? "bg-destructive text-destructive-foreground" : "",
                    "flex items-center gap-1"
                  )}
                >
                  <AlertCircle className="w-3 h-3" />
                  Cau sai ({wrongAnswerIds.length})
                </Button>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                {flashcardQuestions.length} the tu {selectedDatasetIds.length} bo
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShuffle} className="hover:bg-primary/10">
                  <Shuffle className="w-4 h-4 mr-1" />
                  Xao tron
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className={showSettings ? "bg-primary/10" : ""}
                >
                  <Settings2 className="w-4 h-4 mr-1" />
                  Tu dong
                </Button>
                {wrongAnswerIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearWrongAnswers}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xoa cau sai
                  </Button>
                )}
              </div>
            </div>

            {/* Auto Play Settings */}
            {showSettings && (
              <div className="p-4 bg-secondary/50 rounded-xl space-y-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <span className="font-medium">Cai dat tu dong phat</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Hien cau hoi: {frontTime}s</Label>
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
                    <Label className="text-sm font-medium">Hien dap an: {backTime}s</Label>
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
                      Dung
                    </Button>
                  ) : (
                    <Button onClick={startAutoPlay} className="bg-gradient-fun hover:opacity-90">
                      <Play className="w-4 h-4 mr-2" />
                      Bat dau tu dong
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
              The {currentFlashcardIndex + 1} / {flashcardQuestions.length}
            </div>
            {isWrongCard && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Da danh dau sai
              </Badge>
            )}
          </div>

          {/* Flip Mode Card */}
          {flashcardMode === "flip" && (
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
                          {currentCard.type === 1 ? "Ngu phap" : "Tu vung"}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <RotateCw className="w-4 h-4" />
                          Nhan de lat
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
                          Dap an
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <RotateCw className="w-4 h-4" />
                          Nhan de lat
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
                          <p className="text-sm font-bold mb-1 text-primary">Giai thich:</p>
                          <p className="text-sm">{currentCard.explain}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Guess Mode Card */}
          {flashcardMode === "guess" && (
            <Card className="w-full max-w-2xl border-2 border-primary/20">
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
                    {currentCard.type === 1 ? "Ngu phap" : "Tu vung"}
                  </Badge>
                  {!showAnswer && (
                    <Button size="sm" variant="outline" onClick={handleRevealAnswer} className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Xem dap an
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Question */}
                <div className="p-6 bg-secondary/30 rounded-xl text-center">
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>

                {/* Answers - hidden until revealed */}
                <div className="space-y-2">
                  {currentCard.answers.map((answer, index) => {
                    const isCorrect = answer === currentCard.correct
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all",
                          showAnswer
                            ? isCorrect
                              ? "border-success bg-success/10"
                              : "border-border/50"
                            : "border-border/30 bg-muted/30"
                        )}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-lg mr-2 text-sm font-bold",
                          showAnswer && isCorrect ? "bg-success text-success-foreground" : "bg-secondary"
                        )}>
                          {["A", "B", "C", "D"][index]}
                        </span>
                        <span className={cn(
                          showAnswer ? "" : "blur-sm select-none",
                          showAnswer && isCorrect ? "font-medium" : ""
                        )}>
                          {answer}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Explanation - only show when answer revealed */}
                {showAnswer && currentCard.explain && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm font-bold mb-1 text-primary">Giai thich:</p>
                    <p className="text-sm">{currentCard.explain}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mark Wrong/Correct Buttons */}
          <div className="flex items-center gap-2">
            {isWrongCard ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkCorrect}
                className="text-success hover:bg-success/10"
              >
                <Check className="w-4 h-4 mr-1" />
                Bo danh dau sai
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkWrong}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-1" />
                Danh dau sai
              </Button>
            )}
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
              {flashcardFilter === "wrong" 
                ? "Chua co cau nao duoc danh dau sai. Hay on tap va danh dau cac cau can on lai nhe!"
                : "Khong co the nao phu hop voi bo loc hien tai."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
