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
  CircleDot,
  ClipboardList,
} from "lucide-react"
import { toast } from "sonner"

type FlashcardMode = "flip" | "guess" | "quiz"

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
  
  // Quiz mode states
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 })

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
    setSelectedQuizAnswer(null)
    setQuizAnswered(false)
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
          toast.success("Đã ôn tập xong tất cả thẻ!")
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
    toast.success("Đã xáo trộn thẻ!")
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
      toast.info("Đã đánh dấu là câu sai")
    }
  }

  const handleMarkCorrect = () => {
    if (currentCard) {
      markFlashcardCorrect(currentCard.id)
      toast.success("Đã bỏ đánh dấu câu sai")
    }
  }

  const handleClearWrongAnswers = () => {
    clearWrongAnswers()
    if (flashcardFilter === "wrong") {
      loadFlashcards()
    }
    toast.success("Đã xóa tất cả câu sai")
  }

  // Quiz mode handlers
  const handleQuizAnswer = (index: number) => {
    if (quizAnswered || !currentCard) return
    setSelectedQuizAnswer(index)
    setQuizAnswered(true)
    
    const isCorrect = currentCard.answers[index] === currentCard.correct
    if (isCorrect) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }))
      toast.success("Chính xác!")
    } else {
      setQuizScore(prev => ({ ...prev, wrong: prev.wrong + 1 }))
      markFlashcardWrong(currentCard.id)
      toast.error("Sai rồi!")
    }
  }

  const handleQuizNext = () => {
    if (currentFlashcardIndex < flashcardQuestions.length - 1) {
      nextFlashcard()
    } else {
      toast.success(`Hoàn thành! Điểm: ${quizScore.correct}/${quizScore.correct + quizScore.wrong}`)
    }
  }

  const resetQuiz = () => {
    setQuizScore({ correct: 0, wrong: 0 })
    setFlashcardIndex(0)
    setSelectedQuizAnswer(null)
    setQuizAnswered(false)
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
      {/* Mode Selection Tabs */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Study Mode */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Chế độ học</Label>
              <Tabs value={flashcardMode} onValueChange={(v) => { setFlashcardMode(v as FlashcardMode); resetQuiz() }} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="flip" className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Lật thẻ
                  </TabsTrigger>
                  <TabsTrigger value="guess" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Đoán đáp án
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Trắc nghiệm
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filter Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs text-muted-foreground">Lọc:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={flashcardFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("all")}
                  className={flashcardFilter === "all" ? "bg-primary" : ""}
                >
                  Tất cả
                </Button>
                <Button
                  variant={flashcardFilter === "grammar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("grammar")}
                  className={flashcardFilter === "grammar" ? "bg-chart-3" : ""}
                >
                  Ngữ pháp
                </Button>
                <Button
                  variant={flashcardFilter === "vocabulary" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFlashcardFilter("vocabulary")}
                  className={flashcardFilter === "vocabulary" ? "bg-chart-4" : ""}
                >
                  Từ vựng
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
                  Câu sai ({wrongAnswerIds.length})
                </Button>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                {flashcardQuestions.length} thẻ từ {selectedDatasetIds.length} bộ
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShuffle} className="hover:bg-primary/10">
                  <Shuffle className="w-4 h-4 mr-1" />
                  Xáo trộn
                </Button>
                {flashcardMode !== "quiz" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className={showSettings ? "bg-primary/10" : ""}
                  >
                    <Settings2 className="w-4 h-4 mr-1" />
                    Tự động
                  </Button>
                )}
                {wrongAnswerIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearWrongAnswers}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa câu sai
                  </Button>
                )}
              </div>
            </div>

            {/* Auto Play Settings */}
            {showSettings && flashcardMode !== "quiz" && (
              <div className="p-4 bg-secondary/50 rounded-xl space-y-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <span className="font-medium">Cài đặt tự động phát</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Hiện câu hỏi: {frontTime}s</Label>
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
                    <Label className="text-sm font-medium">Hiện đáp án: {backTime}s</Label>
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

            {/* Quiz Score */}
            {flashcardMode === "quiz" && (
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="font-bold text-success">{quizScore.correct}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="font-bold text-destructive">{quizScore.wrong}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetQuiz}>
                  Làm lại
                </Button>
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
              Thẻ {currentFlashcardIndex + 1} / {flashcardQuestions.length}
            </div>
            {isWrongCard && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Đã đánh dấu sai
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
                    {currentCard.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                  </Badge>
                  {!showAnswer && (
                    <Button size="sm" variant="outline" onClick={handleRevealAnswer} className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Xem đáp án
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
                            : "border-border/50 bg-secondary/30"
                        )}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-lg mr-2 text-sm font-bold",
                          showAnswer && isCorrect ? "bg-success text-success-foreground" : "bg-secondary"
                        )}>
                          {["A", "B", "C", "D"][index]}
                        </span>
                        {showAnswer ? (
                          <span className={isCorrect ? "font-medium" : ""}>{answer}</span>
                        ) : (
                          <span className="text-muted-foreground">• • • • •</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {showAnswer && currentCard.explain && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm font-bold mb-1 text-primary">Giải thích:</p>
                    <p className="text-sm">{currentCard.explain}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quiz Mode Card */}
          {flashcardMode === "quiz" && (
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
                    {currentCard.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                  </Badge>
                  <Badge variant="outline">
                    Câu {currentFlashcardIndex + 1}/{flashcardQuestions.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Question */}
                <div className="p-6 bg-secondary/30 rounded-xl text-center">
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>

                {/* Answers - clickable */}
                <div className="space-y-2">
                  {currentCard.answers.map((answer, index) => {
                    const isCorrect = answer === currentCard.correct
                    const isSelected = selectedQuizAnswer === index
                    const showCorrect = quizAnswered && isCorrect
                    const showWrong = quizAnswered && isSelected && !isCorrect
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuizAnswer(index)}
                        disabled={quizAnswered}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 transition-all text-left",
                          showCorrect && "border-success bg-success/20",
                          showWrong && "border-destructive bg-destructive/20",
                          !quizAnswered && "hover:border-primary hover:bg-primary/5 cursor-pointer border-border/50",
                          quizAnswered && !showCorrect && !showWrong && "border-border/50 opacity-50"
                        )}
                      >
                        <span className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-sm font-bold",
                          showCorrect ? "bg-success text-success-foreground" : 
                          showWrong ? "bg-destructive text-destructive-foreground" : "bg-secondary"
                        )}>
                          {["A", "B", "C", "D"][index]}
                        </span>
                        <span className={showCorrect ? "font-medium" : ""}>
                          {answer}
                        </span>
                        {showCorrect && <Check className="w-5 h-5 inline ml-2 text-success" />}
                        {showWrong && <X className="w-5 h-5 inline ml-2 text-destructive" />}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation after answering */}
                {quizAnswered && currentCard.explain && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm font-bold mb-1 text-primary">Giải thích:</p>
                    <p className="text-sm">{currentCard.explain}</p>
                  </div>
                )}

                {/* Next button after answering */}
                {quizAnswered && (
                  <Button onClick={handleQuizNext} className="w-full bg-gradient-fun hover:opacity-90">
                    {currentFlashcardIndex < flashcardQuestions.length - 1 ? (
                      <>
                        Câu tiếp theo
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      <>
                        Xem kết quả
                        <Sparkles className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons (not for quiz mode) */}
          {flashcardMode !== "quiz" && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={isAutoPlaying}
                className="px-6"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Trước
              </Button>

              {/* Mark Wrong/Correct */}
              {!isAutoPlaying && (
                isWrongCard ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleMarkCorrect}
                    className="text-success border-success hover:bg-success/10"
                  >
                    <Check className="w-5 h-5 mr-1" />
                    Bỏ đánh dấu
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleMarkWrong}
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <X className="w-5 h-5 mr-1" />
                    Đánh dấu sai
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={isAutoPlaying}
                className="px-6"
              >
                Tiếp
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-border/50 border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Không có thẻ nào</h3>
            <p className="text-muted-foreground">
              {flashcardFilter === "wrong" 
                ? "Chưa có câu nào được đánh dấu sai."
                : "Không có câu hỏi nào phù hợp với bộ lọc."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
