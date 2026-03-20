"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
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
  Check,
  X,
  AlertCircle,
  Trash2,
  Settings2,
  ClipboardList,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  Search,
  CheckSquare,
  Square,
  Settings,
  Maximize,
  Minimize,
  Volume2,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Dataset, Question } from "@/lib/types"

type ReviewMode = "flip" | "quiz"

export function ReviewPlayer() {
  const { settings } = useAppStore()

  // Local state for review - independent from game
  const [reviewDatasets, setReviewDatasets] = useState<Dataset[]>([])
  const [selectedReviewDatasetIds, setSelectedReviewDatasetIds] = useState<string[]>([])
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewMode, setReviewMode] = useState<ReviewMode>("flip")
  const [reviewFilter, setReviewFilter] = useState<"all" | "grammar" | "vocabulary" | "wrong">("all")
  const [wrongIds, setWrongIds] = useState<string[]>([])

  // Sheet loading state
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingSheets, setIsLoadingSheets] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  // Card display states
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [frontTime, setFrontTime] = useState(settings.autoPlayFrontTime)
  const [backTime, setBackTime] = useState(settings.autoPlayBackTime)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Text-to-speech helper - extracts Japanese text to speak
  const speakText = useCallback((text: string) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return

    // Extract only Japanese characters (kanji, hiragana, katakana) for reading
    const japaneseOnly = text.match(/[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF・ー]+/g)?.join(" ") || text

    // IMPORTANT: On iOS Safari, speak() MUST be called synchronously in the user gesture.
    // Never call speak() inside setTimeout or async callbacks — iOS blocks it.
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(japaneseOnly)
    utterance.lang = "ja-JP"
    utterance.rate = 0.9

    // Try to use a Japanese voice if available (may be empty on first call on some devices)
    const voices = window.speechSynthesis.getVoices()
    const jaVoice = voices.find(v => v.lang.startsWith("ja"))
    if (jaVoice) utterance.voice = jaVoice

    // Speak immediately — required for iOS gesture lock
    window.speechSynthesis.speak(utterance)
  }, [])

  // iOS/Chrome can sometimes double-trigger (touch + click) and/or miss taps on small targets.
  // Guard by timestamp so speech fires exactly once per user action.
  const lastVoiceTapTsRef = useRef(0)
  const handleVoiceTap = useCallback(
    (text: string) => {
      const now = Date.now()
      if (now - lastVoiceTapTsRef.current < 350) return
      lastVoiceTapTsRef.current = now
      speakText(text)
    },
    [speakText]
  )

  // Quiz mode
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  const currentCard = reviewQuestions[currentIndex]
  const isWrongCard = currentCard ? wrongIds.includes(currentCard.id) : false

  const filteredSheetNames = sheetNames.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Detect data format from selected datasets
  const selectedDatasets = reviewDatasets.filter(d => selectedReviewDatasetIds.includes(d.id))
  const hasSimpleFormat = selectedDatasets.some(d => 
    d.questions.some(q => q.answers.length === 1)
  )
  const hasFullFormat = selectedDatasets.some(d => 
    d.questions.some(q => q.answers.length > 1)
  )

  // Simple format modes: flip (type, question, answer)
  // Full format mode: quiz (type, question, answer1-4, correct, explain)
  const isModeCompatible = (mode: ReviewMode) => {
    if (selectedReviewDatasetIds.length === 0) return true
    if (mode === "flip") return hasSimpleFormat
    if (mode === "quiz") return hasFullFormat
    return true
  }

  // Auto-select compatible mode if current mode is not compatible
  useEffect(() => {
    if (selectedReviewDatasetIds.length > 0 && !isModeCompatible(reviewMode)) {
      if (hasSimpleFormat) setReviewMode("flip")
      else if (hasFullFormat) setReviewMode("quiz")
    }
  }, [selectedReviewDatasetIds, hasSimpleFormat, hasFullFormat])

  // Load sheets on mount
  useEffect(() => {
    loadSheetNames()
  }, [])

  // Update questions when selection or filter changes
  useEffect(() => {
    loadReviewQuestions()
  }, [selectedReviewDatasetIds, reviewDatasets, reviewFilter, wrongIds])

  // Reset states when card changes
  useEffect(() => {
    setIsFlipped(false)
    setShowAnswer(false)
    setSelectedQuizAnswer(null)
    setQuizAnswered(false)
  }, [currentIndex])

  const loadSheetNames = async () => {
    setIsLoadingSheets(true)
    setApiKeyError(null)
    try {
      const res = await fetch(`/api/google-sheets?action=getSheets`)
      const data = await res.json()
      if (data.sheets) {
        setSheetNames(data.sheets)
        setApiKeyError(null)
      } else if (data.error) {
        if (data.error.includes("API") || data.error.includes("key")) {
          setApiKeyError(data.error)
        } else {
          toast.error(data.error)
        }
      }
    } catch (error) {
      console.error("Error loading sheets:", error)
      toast.error("Không thể tải danh sách sheet")
    } finally {
      setIsLoadingSheets(false)
    }
  }

  const loadSheetData = async (sheetName: string) => {
    setIsLoadingData(true)
    try {
      const res = await fetch(`/api/google-sheets?action=getSheetData&sheetName=${encodeURIComponent(sheetName)}`)
      const data = await res.json()
      if (data.dataset) {
        const exists = reviewDatasets.find(d => d.fileName === sheetName)
        if (!exists) {
          setReviewDatasets(prev => [...prev, data.dataset])
          setSelectedReviewDatasetIds(prev => [...prev, data.dataset.id])
        } else {
          if (!selectedReviewDatasetIds.includes(exists.id)) {
            setSelectedReviewDatasetIds(prev => [...prev, exists.id])
          }
        }
        toast.success(`Đã tải ${data.dataset.totalQuestions} câu hỏi từ "${sheetName}"`)
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (error) {
      console.error("Error loading sheet:", error)
      toast.error("Không thể tải dữ liệu sheet")
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadAllSheets = async () => {
    setIsLoadingData(true)
    try {
      const res = await fetch(`/api/google-sheets`)
      const data = await res.json()
      if (data.datasets) {
        let added = 0
        const newDatasets: Dataset[] = []
        const newIds: string[] = []
        data.datasets.forEach((dataset: Dataset) => {
          const exists = reviewDatasets.find(d => d.fileName === dataset.fileName)
          if (!exists) {
            newDatasets.push(dataset)
            newIds.push(dataset.id)
            added++
          }
        })
        setReviewDatasets(prev => [...prev, ...newDatasets])
        setSelectedReviewDatasetIds(prev => [...prev, ...newIds])
        toast.success(`Đã tải ${data.datasets.length} sheet (${added} mới)`)
      }
    } catch (error) {
      console.error("Error loading all sheets:", error)
      toast.error("Không thể tải tất cả sheet")
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadReviewQuestions = () => {
    const selectedDatasets = reviewDatasets.filter(d => selectedReviewDatasetIds.includes(d.id))
    let questions = selectedDatasets.flatMap(d => d.questions)

    if (reviewFilter === "grammar") {
      questions = questions.filter(q => q.type === 1)
    } else if (reviewFilter === "vocabulary") {
      questions = questions.filter(q => q.type === 2)
    } else if (reviewFilter === "wrong") {
      questions = questions.filter(q => wrongIds.includes(q.id))
    }

    setReviewQuestions(questions)
    setCurrentIndex(0)
  }

  const selectDataset = (id: string) => {
    setSelectedReviewDatasetIds(prev => [...prev, id])
  }

  const deselectDataset = (id: string) => {
    setSelectedReviewDatasetIds(prev => prev.filter(i => i !== id))
  }

  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false)
    setProgress(0)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  const startAutoPlay = useCallback(() => {
    if (reviewQuestions.length === 0) {
      toast.error("Không có thẻ để phát")
      return
    }
    setIsAutoPlaying(true)
    setIsFlipped(false)
    setShowAnswer(false)
    setProgress(0)
  }, [reviewQuestions.length])

  // Auto play logic
  useEffect(() => {
    if (!isAutoPlaying || reviewQuestions.length === 0) return

    const isShowingAnswer = reviewMode === "flip" ? isFlipped : showAnswer
    const totalTime = isShowingAnswer ? backTime : frontTime
    const startTime = Date.now()

    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newProgress = Math.min((elapsed / totalTime) * 100, 100)
      setProgress(newProgress)
    }, 50)

    timerRef.current = setTimeout(() => {
      if (!isShowingAnswer) {
        if (reviewMode === "flip") {
          setIsFlipped(true)
          speakText(currentCard.correct)
        } else {
          setShowAnswer(true)
          speakText(currentCard.correct)
        }
      } else {
        if (currentIndex < reviewQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1)
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
  }, [isAutoPlaying, isFlipped, showAnswer, frontTime, backTime, currentIndex, reviewQuestions.length, reviewMode, stopAutoPlay, speakText, currentCard?.correct])

  const handleFlip = () => {
    if (!isAutoPlaying && reviewMode === "flip") {
      setIsFlipped(!isFlipped)
    }
  }

  const handleRevealAnswer = () => {
    if (!isAutoPlaying && reviewMode === "guess") {
      setShowAnswer(true)
    }
  }

  const handleShuffle = () => {
    setReviewQuestions(prev => [...prev].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowAnswer(false)
    toast.success("Đã xáo trộn thẻ!")
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < reviewQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleMarkWrong = () => {
    if (currentCard && !wrongIds.includes(currentCard.id)) {
      setWrongIds(prev => [...prev, currentCard.id])
      toast.info("Đã đánh dấu là câu sai")
    }
  }

  const handleMarkCorrect = () => {
    if (currentCard) {
      setWrongIds(prev => prev.filter(id => id !== currentCard.id))
      toast.success("Đã bỏ đánh dấu câu sai")
    }
  }

  const handleClearWrongAnswers = () => {
    setWrongIds([])
    toast.success("Đã xóa tất cả câu sai")
  }

  // Quiz mode
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
      if (!wrongIds.includes(currentCard.id)) {
        setWrongIds(prev => [...prev, currentCard.id])
      }
      toast.error("Sai rồi!")
    }
  }

  const handleQuizNext = () => {
    if (currentIndex < reviewQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      toast.success(`Hoàn thành! Điểm: ${quizScore.correct}/${quizScore.correct + quizScore.wrong}`)
    }
  }

  const resetQuiz = () => {
    setQuizScore({ correct: 0, wrong: 0 })
    setCurrentIndex(0)
    setSelectedQuizAnswer(null)
    setQuizAnswered(false)
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sheet Selection Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Chọn bài học
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSheetNames}
              disabled={isLoadingSheets}
              className="flex-1"
            >
              {isLoadingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={loadAllSheets}
              disabled={isLoadingData || sheetNames.length === 0}
              className="flex-1"
            >
              {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="ml-1">Tất cả</span>
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[200px] md:h-[350px]">
            {isLoadingSheets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : apiKeyError ? (
              <div className="p-4 text-sm">
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Lỗi API Key</p>
                      <p className="text-xs opacity-80">{apiKeyError}</p>
                    </div>
                  </div>
                </div>
                <Link href="/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Đi đến Cài đặt
                  </Button>
                </Link>
              </div>
            ) : filteredSheetNames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm px-4">
                {searchQuery ? `Không tìm thấy "${searchQuery}"` : "Chưa có sheet nào"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSheetNames.map((name) => {
                  const loaded = reviewDatasets.find(d => d.fileName === name)
                  const isSelected = loaded && selectedReviewDatasetIds.includes(loaded.id)
                  return (
                    <button
                      key={name}
                      onClick={() => loaded ? (isSelected ? deselectDataset(loaded.id) : selectDataset(loaded.id)) : loadSheetData(name)}
                      disabled={isLoadingData}
                      className={cn(
                        "w-full p-3 rounded-lg text-left text-sm transition-all flex items-center gap-2",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : loaded
                          ? "bg-secondary hover:bg-secondary/80"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      {loaded ? (
                        isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      <span className="flex-1 truncate">{name}</span>
                      {loaded && (
                        <Badge variant={isSelected ? "outline" : "secondary"} className="text-xs">
                          {loaded.totalQuestions}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Flashcard Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Controls */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Study Mode */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Chế độ học 
                  {selectedReviewDatasetIds.length > 0 && (
                    <span className="ml-2 text-muted-foreground/70">
                      ({hasSimpleFormat && hasFullFormat 
                        ? "Dữ liệu hỗn hợp" 
                        : hasSimpleFormat 
                          ? "Dữ liệu đơn giản" 
                          : hasFullFormat 
                            ? "Dữ liệu trắc nghiệm" 
                            : ""})
                    </span>
                  )}
                </Label>
                <Tabs value={reviewMode} onValueChange={(v) => { 
                  if (isModeCompatible(v as ReviewMode)) {
                    setReviewMode(v as ReviewMode)
                    resetQuiz() 
                  }
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="flip" 
                      className={cn(
                        "flex items-center gap-2",
                        !isModeCompatible("flip") && selectedReviewDatasetIds.length > 0 && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isModeCompatible("flip") && selectedReviewDatasetIds.length > 0}
                    >
                      <RotateCw className="w-4 h-4" />
                      Lật thẻ
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quiz" 
                      className={cn(
                        "flex items-center gap-2",
                        !isModeCompatible("quiz") && selectedReviewDatasetIds.length > 0 && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isModeCompatible("quiz") && selectedReviewDatasetIds.length > 0}
                    >
                      <ClipboardList className="w-4 h-4" />
                      Trắc nghiệm
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs text-muted-foreground">Lọc:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={reviewFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewFilter("all")}
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={reviewFilter === "grammar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewFilter("grammar")}
                    className={reviewFilter === "grammar" ? "bg-chart-3" : ""}
                  >
                    Ngữ pháp
                  </Button>
                  <Button
                    variant={reviewFilter === "vocabulary" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewFilter("vocabulary")}
                    className={reviewFilter === "vocabulary" ? "bg-chart-4" : ""}
                  >
                    Từ vựng
                  </Button>
                  <Button
                    variant={reviewFilter === "wrong" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReviewFilter("wrong")}
                    className={cn(
                      reviewFilter === "wrong" ? "bg-destructive text-destructive-foreground" : "",
                      "flex items-center gap-1"
                    )}
                  >
                    <AlertCircle className="w-3 h-3" />
                    Câu sai ({wrongIds.length})
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                  {reviewQuestions.length} thẻ từ {selectedReviewDatasetIds.length} bộ
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShuffle}>
                    <Shuffle className="w-4 h-4 mr-1" />
                    Xáo trộn
                  </Button>
                  {reviewMode !== "quiz" && (
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
                  {wrongIds.length > 0 && (
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
              {showSettings && reviewMode !== "quiz" && (
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
              {reviewMode === "quiz" && (
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

        {/* Progress */}
        {isAutoPlaying && (
          <Progress value={progress} className="h-2" />
        )}

        {/* Flashcard Display */}
        {reviewQuestions.length > 0 && currentCard ? (
          <div className="flex flex-col items-center gap-6">
            {/* Card Counter */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
                Thẻ {currentIndex + 1} / {reviewQuestions.length}
              </div>
              {isWrongCard && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Đã đánh dấu sai
                </Badge>
              )}
            </div>

            {/* Flip Mode Card */}
            {reviewMode === "flip" && (
              <div className="w-full max-w-2xl">
                {/* Fullscreen toggle button */}
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-1"
                  >
                    <Maximize className="w-4 h-4" />
                    <span className="hidden md:inline">Toàn màn hình</span>
                  </Button>
                </div>
                <div
                  className="flip-card w-full h-[320px] md:h-[380px] cursor-pointer"
                  onClick={handleFlip}
                >
                <div className={cn("flip-card-inner", isFlipped && "flipped")}>
                  {/* Front */}
                  <div className="flip-card-front">
                    <Card className="w-full h-full border-2 border-primary/20 flex flex-col hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-2 shrink-0">
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
                      <CardContent className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto">
                        <p className="text-xl md:text-2xl font-medium text-center leading-relaxed break-words">
                          {currentCard.question}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Back */}
                  <div className="flip-card-back">
                    <Card className="w-full h-full border-2 border-success/50 bg-success/5 flex flex-col hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-1 shrink-0">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-success text-success-foreground py-1">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Đáp án
                          </Badge>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVoiceTap(currentCard.correct)
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation()
                                handleVoiceTap(currentCard.correct)
                              }}
                              className="h-9 w-9 p-0 rounded-full hover:bg-success/20 text-success transition-colors flex items-center justify-center flex-shrink-0 z-10"
                              title="Đọc đáp án"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <RotateCw className="w-4 h-4" />
                              Nhấn để lật
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 p-3 md:p-4 space-y-2 overflow-auto">
                        <p className="text-sm md:text-base text-center text-muted-foreground bg-secondary/50 p-2 rounded-lg break-words">
                          {currentCard.question}
                        </p>
                        <div className="p-2 md:p-3 bg-success/10 rounded-xl text-center">
                          <p className="text-lg md:text-xl font-bold text-success break-words">{currentCard.correct}</p>
                        </div>
                        {currentCard.example && (
                          <div className="p-2 md:p-3 bg-primary/10 rounded-xl">
                            <p className="text-xs font-medium mb-0.5">Ví dụ:</p>
                            <p className="text-xs md:text-sm text-foreground italic break-words">{currentCard.example}</p>
                          </div>
                        )}
                        {currentCard.explain && (
                          <div className="p-2 md:p-3 bg-secondary/50 rounded-xl">
                            <p className="text-xs font-medium mb-0.5">Giải thích:</p>
                            <p className="text-xs md:text-sm text-muted-foreground break-words">{currentCard.explain}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Fullscreen Mode */}
            {isFullscreen && reviewMode === "flip" && (
              <div className="fixed inset-0 z-50 bg-background flex flex-col">
                {/* Fullscreen Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <Minimize className="w-4 h-4 mr-1" />
                    Thoat
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {currentIndex + 1} / {reviewQuestions.length}
                    </span>
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
                  </div>
                  
                  <div className="w-[72px]"></div>
                </div>

                {/* Fullscreen Card with Side Navigation */}
                <div className="flex-1 flex items-center justify-center p-4">
                  {/* Left Navigation Button */}
                  <button
                    className="h-32 md:h-48 px-2 md:px-4 text-primary/60 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    onClick={() => { handlePrev(); setIsFlipped(false); }}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-10 h-10 md:w-14 md:h-14" strokeWidth={1.5} />
                  </button>

                  {/* Flip Card */}
                  <div
                    className="flip-card flex-1 max-w-3xl h-[70vh] cursor-pointer"
                    onClick={handleFlip}
                  >
                    <div className={cn("flip-card-inner", isFlipped && "flipped")}>
                      {/* Front */}
                      <div className="flip-card-front">
                        <Card className="w-full h-full border-2 border-primary/20 flex flex-col hover:shadow-xl transition-shadow">
                          <CardContent className="flex-1 flex items-center justify-center p-8">
                            <p className="text-3xl md:text-4xl font-medium text-center leading-relaxed break-words">
                              {currentCard.question}
                            </p>
                          </CardContent>
                          <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                            <RotateCw className="w-4 h-4" />
                            Nhan de lat
                          </div>
                        </Card>
                      </div>

                      {/* Back */}
                      <div className="flip-card-back">
                        <Card className="w-full h-full border-2 border-success/50 bg-success/5 flex flex-col hover:shadow-xl transition-shadow">
                          <CardContent className="flex-1 p-6 md:p-8 space-y-4 overflow-auto flex flex-col justify-center">
                            <p className="text-xl md:text-2xl text-center text-muted-foreground bg-secondary/50 p-4 rounded-lg break-words">
                              {currentCard.question}
                            </p>
                            <div className="p-4 md:p-6 bg-success/10 rounded-xl text-center relative pr-12 pt-10">
                              <p className="text-2xl md:text-3xl font-bold text-success break-words">{currentCard.correct}</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleVoiceTap(currentCard.correct)
                                }}
                                onPointerDown={(e) => {
                                  e.stopPropagation()
                                  handleVoiceTap(currentCard.correct)
                                }}
                                className="absolute top-3 right-3 h-9 w-9 p-0 rounded-full hover:bg-success/20 text-success transition-colors flex items-center justify-center flex-shrink-0 z-10"
                                title="Đọc đáp án"
                              >
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>
                            {currentCard.example && (
                              <div className="p-4 bg-primary/10 rounded-xl">
                                <p className="text-sm font-medium mb-1">Vi du:</p>
                                <p className="text-base md:text-lg text-foreground italic break-words">{currentCard.example}</p>
                              </div>
                            )}
                            {currentCard.explain && (
                              <div className="p-4 bg-secondary/50 rounded-xl">
                                <p className="text-sm font-medium mb-1">Giai thich:</p>
                                <p className="text-base md:text-lg text-muted-foreground break-words">{currentCard.explain}</p>
                              </div>
                            )}
                          </CardContent>
                          <div className="p-4 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                            <RotateCw className="w-4 h-4" />
                            Nhan de lat
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Right Navigation Button */}
                  <button
                    className="h-32 md:h-48 px-2 md:px-4 text-primary/60 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    onClick={() => { handleNext(); setIsFlipped(false); }}
                    disabled={currentIndex === reviewQuestions.length - 1}
                  >
                    <ChevronRight className="w-10 h-10 md:w-14 md:h-14" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Mode */}
            {reviewMode === "quiz" && (
              <Card className="w-full max-w-2xl border-2 border-primary/20">
                <CardHeader>
                  <Badge
                    className={cn(
                      "py-1 w-fit",
                      currentCard.type === 1
                        ? "bg-chart-3 text-chart-3-foreground"
                        : "bg-chart-4 text-chart-4-foreground"
                    )}
                  >
                    {currentCard.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xl font-medium text-center mb-6">{currentCard.question}</p>

                  <div className="grid grid-cols-1 gap-3">
                    {currentCard.answers.map((answer, index) => {
                      const isCorrect = answer === currentCard.correct
                      const isSelected = selectedQuizAnswer === index
                      const showResult = quizAnswered

                      return (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          disabled={quizAnswered}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all",
                            showResult && isCorrect && "border-success bg-success/10",
                            showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            !showResult && "border-border/50 hover:border-primary hover:bg-primary/5",
                            quizAnswered && "cursor-default"
                          )}
                        >
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-sm font-bold",
                            showResult && isCorrect ? "bg-success text-success-foreground" :
                            showResult && isSelected && !isCorrect ? "bg-destructive text-destructive-foreground" :
                            "bg-secondary"
                          )}>
                            {["A", "B", "C", "D"][index]}
                          </span>
                          {answer}
                          {showResult && isCorrect && <Check className="w-5 h-5 inline ml-2 text-success" />}
                          {showResult && isSelected && !isCorrect && <X className="w-5 h-5 inline ml-2 text-destructive" />}
                        </button>
                      )
                    })}
                  </div>

                  {quizAnswered && (
                    <div className="space-y-3 pt-4">
                      {currentCard.explain && (
                        <div className="p-4 bg-secondary/50 rounded-xl">
                          <p className="text-sm font-medium mb-1">Giải thích:</p>
                          <p className="text-muted-foreground">{currentCard.explain}</p>
                        </div>
                      )}
                      <Button onClick={handleQuizNext} className="w-full">
                        {currentIndex < reviewQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={currentIndex === 0 || isAutoPlaying}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              {!isAutoPlaying && reviewMode !== "quiz" && (
                <div className="flex gap-2">
                  {isWrongCard ? (
                    <Button variant="outline" size="sm" onClick={handleMarkCorrect}>
                      <Check className="w-4 h-4 mr-1" />
                      Bỏ đánh dấu
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleMarkWrong} className="text-destructive">
                      <X className="w-4 h-4 mr-1" />
                      Đánh dấu sai
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={currentIndex >= reviewQuestions.length - 1 || isAutoPlaying}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-border/50 border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chưa có dữ liệu</h3>
              <p className="text-muted-foreground">
                Chọn các sheet từ danh sách bên trái để bắt đầu ôn tập.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
