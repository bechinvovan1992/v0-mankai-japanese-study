"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/lib/store"
import type { Question, GameMode } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Play,
  Users,
  HelpCircle,
  Check,
  X,
  SkipForward,
  Eye,
  Trophy,
  Gamepad2,
  Sparkles,
  Crown,
  Star,
  PartyPopper,
  Timer,
  Target,
  Zap,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Skull,
  Swords,
  CircleDot,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

const playerColors = [
  "from-pink-500 to-rose-500",
  "from-violet-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-red-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-green-500 to-emerald-500",
]

const gameModes: { id: GameMode; name: string; icon: React.ReactNode; description: string }[] = [
  { id: "guess", name: "Đoán Đáp Án", icon: <HelpCircle className="w-5 h-5" />, description: "Trả lời miệng, bấm hiện đáp án" },
  { id: "multiple", name: "Trắc Nghiệm", icon: <CircleDot className="w-5 h-5" />, description: "Chọn 1 trong 4 đáp án" },
  { id: "elimination", name: "Loại Trừ", icon: <Trash2 className="w-5 h-5" />, description: "Loại bỏ đáp án sai trước" },
  { id: "speed", name: "Tốc Độ", icon: <Timer className="w-5 h-5" />, description: "Đếm ngược 10 giây" },
  { id: "hidden", name: "Ẩn Đáp Án", icon: <EyeOff className="w-5 h-5" />, description: "Hiện đáp án sau vài giây" },
  { id: "truefalse", name: "Đúng Sai", icon: <Target className="w-5 h-5" />, description: "Đúng hay Sai?" },
  { id: "suddendeath", name: "Sinh Tử", icon: <Skull className="w-5 h-5" />, description: "Sai là bị loại!" },
  { id: "teambattle", name: "Đối Kháng", icon: <Swords className="w-5 h-5" />, description: "Đội nào thắng?" },
]

export function GameBoard() {
  const {
    datasets,
    selectedDatasetIds,
    players,
    gameRound,
    settings,
    selectedGameMode,
    setGameMode,
    startGame,
    endGame,
    markQuestionPlayed,
    nextPlayer,
    eliminatePlayer,
    setupTeams,
    nextTeam,
    addTeamScore,
    resetAllSelectedPlayed,
    loadDatasetsFromServer,
  } = useAppStore()

  // Load datasets from server on mount
  useEffect(() => {
    loadDatasetsFromServer()
  }, [loadDatasetsFromServer])

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [eliminatedAnswers, setEliminatedAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(10)
  const [timerActive, setTimerActive] = useState(false)
  const [hiddenAnswersRevealed, setHiddenAnswersRevealed] = useState(false)
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string | null>(null)
  const [trueFalseIsCorrect, setTrueFalseIsCorrect] = useState(false)
  const [canSteal, setCanSteal] = useState(false)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)

  const canStartGame = selectedDatasetIds.length > 0 && players.length > 0

  // Timer effect for speed mode
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false)
      setShowAnswer(true)
      toast.error("Hết giờ!")
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  // Hidden answers reveal effect
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (selectedQuestion && gameRound?.gameMode === "hidden" && !hiddenAnswersRevealed) {
      timeout = setTimeout(() => {
        setHiddenAnswersRevealed(true)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [selectedQuestion, gameRound?.gameMode, hiddenAnswersRevealed])

  const handleStartGame = () => {
    if (!canStartGame) {
      toast.error("Vui lòng chọn bộ dữ liệu và thêm người chơi trước")
      return
    }
    startGame()
    if (selectedGameMode === "teambattle") {
      setupTeams(2)
    }
    toast.success("Bắt đầu trò chơi!")
  }

  const handlePlayAgain = () => {
    resetAllSelectedPlayed()
    endGame()
    toast.success("Đã reset tất cả câu hỏi. Bắt đầu chơi lại!")
  }

  const resetQuestionState = useCallback(() => {
    setSelectedQuestion(null)
    setShowAnswer(false)
    setEliminatedAnswers([])
    setTimeLeft(10)
    setTimerActive(false)
    setHiddenAnswersRevealed(false)
    setTrueFalseAnswer(null)
    setTrueFalseIsCorrect(false)
    setCanSteal(false)
    setSelectedAnswerIndex(null)
  }, [])

  const handleCellClick = (question: Question) => {
    if (question.played) {
      // Toggle expanded view for played cells
      setExpandedCell(expandedCell === question.id ? null : question.id)
      return
    }
    resetQuestionState()
    setSelectedQuestion(question)
    
    // Setup for specific modes
    if (gameRound?.gameMode === "speed") {
      setTimeLeft(10)
      setTimerActive(true)
    }
    if (gameRound?.gameMode === "truefalse") {
      // Pick a random answer to show
      const randomAnswer = question.answers[Math.floor(Math.random() * question.answers.length)]
      setTrueFalseAnswer(randomAnswer)
      setTrueFalseIsCorrect(randomAnswer === question.correct)
    }
  }

  const handleMarkCorrect = () => {
    if (!selectedQuestion) return
    markQuestionPlayed(selectedQuestion.id, true)
    
    if (gameRound?.gameMode === "teambattle" && gameRound.teams) {
      const currentTeam = gameRound.teams[gameRound.currentTeamIndex || 0]
      addTeamScore(currentTeam.id, 1)
      nextTeam()
    } else {
      nextPlayer()
    }
    
    resetQuestionState()
    toast.success("Chính xác! +1 điểm")
  }

  const handleMarkWrong = () => {
    if (!selectedQuestion) return
    
    if (gameRound?.gameMode === "suddendeath") {
      const currentPlayer = gameRound.players[gameRound.currentPlayerIndex]
      eliminatePlayer(currentPlayer.id)
      toast.error(`${currentPlayer.name} bị loại!`)
      
      // Check if only one player remains
      const remainingPlayers = gameRound.players.filter(
        (p) => !gameRound.suddenDeathEliminated?.includes(p.id) && p.id !== currentPlayer.id
      )
      if (remainingPlayers.length === 1) {
        toast.success(`${remainingPlayers[0].name} chiến thắng!`)
      }
    } else if (gameRound?.gameMode === "teambattle" && !canSteal) {
      setCanSteal(true)
      toast.info("Đội kia có thể cướp điểm!")
      return
    }
    
    markQuestionPlayed(selectedQuestion.id, false)
    
    if (gameRound?.gameMode === "teambattle") {
      nextTeam()
    } else {
      nextPlayer()
    }
    
    resetQuestionState()
    toast.error("Sai rồi!")
  }

  const handleSteal = (correct: boolean) => {
    if (!selectedQuestion || !gameRound?.teams) return
    
    const otherTeamIndex = ((gameRound.currentTeamIndex || 0) + 1) % gameRound.teams.length
    const otherTeam = gameRound.teams[otherTeamIndex]
    
    if (correct) {
      addTeamScore(otherTeam.id, 1)
      toast.success(`${otherTeam.name} cướp điểm thành công!`)
    } else {
      toast.error(`${otherTeam.name} cướp điểm thất bại!`)
    }
    
    markQuestionPlayed(selectedQuestion.id, correct)
    nextTeam()
    resetQuestionState()
  }

  const handleSkip = () => {
    if (gameRound?.gameMode === "teambattle") {
      nextTeam()
    } else {
      nextPlayer()
    }
    resetQuestionState()
  }

  const handleEliminateAnswer = (index: number) => {
    if (eliminatedAnswers.length >= 2) return
    if (selectedQuestion?.answers[index] === selectedQuestion?.correct) {
      toast.error("Không thể loại đáp án đúng!")
      return
    }
    setEliminatedAnswers([...eliminatedAnswers, index])
  }

  const handleMultipleChoiceSelect = (index: number) => {
    if (showAnswer) return
    setSelectedAnswerIndex(index)
    setShowAnswer(true)
  }

  const handleTrueFalseAnswer = (userSaysTrue: boolean) => {
    const isCorrect = userSaysTrue === trueFalseIsCorrect
    setShowAnswer(true)
    if (isCorrect) {
      setTimeout(() => handleMarkCorrect(), 1500)
    } else {
      setTimeout(() => handleMarkWrong(), 1500)
    }
  }

  const currentPlayer = gameRound?.players[gameRound.currentPlayerIndex]
  const currentPlayerColor = playerColors[gameRound?.currentPlayerIndex % playerColors.length || 0]
  const boardColumns = settings.boardColumns || 4

  const allQuestions = gameRound?.questions || []

  const sortedPlayers = gameRound
    ? [...gameRound.players].sort((a, b) => b.score - a.score)
    : []

  const isGameComplete = gameRound && gameRound.remainingQuestions === 0

  // Check for sudden death winner
  const suddenDeathWinner = gameRound?.gameMode === "suddendeath" && gameRound.suddenDeathEliminated
    ? gameRound.players.filter((p) => !gameRound.suddenDeathEliminated?.includes(p.id))
    : null

  const isSuddenDeathComplete = suddenDeathWinner && suddenDeathWinner.length === 1

  if (!gameRound) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Chuẩn bị trò chơi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Datasets */}
            <div className="p-4 bg-secondary/50 rounded-xl">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Bộ dữ liệu đã chọn
              </h4>
              {selectedDatasetIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa chọn bộ dữ liệu. Vào trang Bộ dữ liệu để chọn nhé.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {datasets
                    .filter((d) => selectedDatasetIds.includes(d.id))
                    .map((d) => (
                      <Badge key={d.id} variant="secondary" className="py-1.5 px-3">
                        {d.fileName} ({d.totalQuestions})
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Players */}
            <div className="p-4 bg-secondary/50 rounded-xl">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Người chơi ({players.length})
              </h4>
              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có người chơi. Vào trang Người chơi để thêm nhé.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((p, i) => (
                    <Badge 
                      key={p.id} 
                      className={`bg-gradient-to-r ${playerColors[i % playerColors.length]} text-white border-0 py-1.5 px-3`}
                    >
                      {p.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Game Mode Selection */}
            <div className="p-4 bg-secondary/50 rounded-xl">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Chọn chế độ chơi
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gameModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      selectedGameMode === mode.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-primary",
                        selectedGameMode === mode.id && "text-primary"
                      )}>
                        {mode.icon}
                      </span>
                      <span className="font-bold text-sm">{mode.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary">
                  {datasets
                    .filter((d) => selectedDatasetIds.includes(d.id))
                    .reduce((acc, d) => acc + d.questions.filter((q) => !q.played).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng câu hỏi</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-xl text-center">
                <p className="text-3xl font-bold text-accent">
                  {players.length > 0
                    ? Math.floor(
                        datasets
                          .filter((d) => selectedDatasetIds.includes(d.id))
                          .reduce((acc, d) => acc + d.questions.filter((q) => !q.played).length, 0) /
                          players.length
                      )
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Câu/người</p>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              size="lg"
              className="w-full text-lg py-6 bg-gradient-fun hover:opacity-90"
            >
              <Play className="w-6 h-6 mr-2" />
              Bắt đầu chơi!
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={`p-4 rounded-xl bg-gradient-to-r ${currentPlayerColor} text-white shadow-lg`}>
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6" />
            <div>
              <span className="text-xl font-bold">
                Lượt của {currentPlayer?.name}
              </span>
              {gameRound.gameMode === "teambattle" && gameRound.teams && (
                <p className="text-sm opacity-90">
                  {gameRound.teams[gameRound.currentTeamIndex || 0]?.name}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="py-1.5 px-3">
            {gameModes.find((m) => m.id === gameRound.gameMode)?.name}
          </Badge>
          <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
            Còn {gameRound.remainingQuestions}/{gameRound.totalQuestions} câu
          </div>
          <Button variant="outline" onClick={() => setShowScoreboard(true)} className="hover:bg-primary/10">
            <Trophy className="w-4 h-4 mr-2 text-warning" />
            Bảng điểm
          </Button>
          <Button variant="outline" onClick={handlePlayAgain}>
            Chơi lại
          </Button>
          <Button variant="destructive" onClick={endGame}>
            Kết thúc
          </Button>
        </div>
      </div>

      {/* Team Scores for Team Battle */}
      {gameRound.gameMode === "teambattle" && gameRound.teams && (
        <div className="grid grid-cols-2 gap-4">
          {gameRound.teams.map((team, index) => (
            <Card 
              key={team.id} 
              className={cn(
                "border-2",
                index === gameRound.currentTeamIndex ? "border-primary" : "border-border"
              )}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-bold text-lg">{team.name}</h3>
                <p className="text-3xl font-bold text-primary">{team.score}</p>
                <p className="text-xs text-muted-foreground">
                  {team.players.map((p) => p.name).join(", ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sudden Death Status */}
      {gameRound.gameMode === "suddendeath" && (
        <div className="flex flex-wrap gap-2">
          {gameRound.players.map((player, index) => (
            <Badge
              key={player.id}
              className={cn(
                "py-1.5 px-3",
                gameRound.suddenDeathEliminated?.includes(player.id)
                  ? "bg-destructive/50 line-through"
                  : `bg-gradient-to-r ${playerColors[index % playerColors.length]} text-white`
              )}
            >
              {player.name}
              {gameRound.suddenDeathEliminated?.includes(player.id) && " (Loại)"}
            </Badge>
          ))}
        </div>
      )}

      {/* Game Complete or Sudden Death Winner */}
      {(isGameComplete || isSuddenDeathComplete) ? (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-warning flex items-center justify-center mx-auto mb-6 shadow-lg">
              <PartyPopper className="w-12 h-12 text-warning-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Hoàn thành!</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Người thắng cuộc: <span className="text-primary font-bold">
                {isSuddenDeathComplete 
                  ? suddenDeathWinner?.[0]?.name 
                  : gameRound.gameMode === "teambattle" && gameRound.teams
                    ? [...gameRound.teams].sort((a, b) => b.score - a.score)[0]?.name
                    : sortedPlayers[0]?.name
                }
              </span>
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setShowScoreboard(true)} size="lg">
                Xem bảng điểm
              </Button>
              <Button variant="outline" onClick={handlePlayAgain} size="lg">
                Chơi lại
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Game Board Grid */
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${boardColumns}, minmax(0, 1fr))` }}
        >
          {allQuestions.map((question, index) => (
            <div key={question.id} className="relative">
              <button
                onClick={() => handleCellClick(question)}
                className={cn(
                  "w-full aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 text-center shadow-sm",
                  question.played
                    ? "bg-success/10 border-success/30 cursor-pointer hover:bg-success/20"
                    : "bg-card border-primary/30 hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:scale-105 cursor-pointer"
                )}
              >
                {question.played ? (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <Check className="w-6 h-6 text-success" />
                    <span className="text-xs text-muted-foreground truncate w-full px-1">
                      {question.question.slice(0, 20)}...
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold bg-gradient-to-br from-primary to-chart-5 bg-clip-text text-transparent">
                    {index + 1}
                  </span>
                )}
              </button>
              
              {/* Expanded Cell Content */}
              {expandedCell === question.id && question.played && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2">
                  <Card className="border-2 border-success/50 shadow-xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={question.type === 1 ? "bg-chart-3" : "bg-chart-4"}>
                          {question.type === 1 ? "Ngữ pháp" : "Từ vựng"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setExpandedCell(null) }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-medium text-sm">{question.question}</p>
                      <div className="text-sm space-y-1">
                        {question.answers.map((ans, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "p-2 rounded-lg",
                              ans === question.correct 
                                ? "bg-success/20 border border-success/50 font-medium" 
                                : "bg-secondary/50"
                            )}
                          >
                            <span className="font-bold mr-2">{["A", "B", "C", "D"][i]}.</span>
                            {ans}
                            {ans === question.correct && <Check className="w-4 h-4 inline ml-2 text-success" />}
                          </div>
                        ))}
                      </div>
                      {question.explain && (
                        <div className="p-3 bg-primary/10 rounded-lg text-xs">
                          <span className="font-bold">Giải thích:</span> {question.explain}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Modal */}
      <Dialog open={!!selectedQuestion} onOpenChange={() => resetQuestionState()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge 
                className={cn(
                  "py-1",
                  selectedQuestion?.type === 1 
                    ? "bg-chart-3 text-chart-3-foreground" 
                    : "bg-chart-4 text-chart-4-foreground"
                )}
              >
                {selectedQuestion?.type === 1 ? "Ngữ pháp" : "Từ vựng"}
              </Badge>
              <span>Câu hỏi cho {currentPlayer?.name}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Trả lời câu hỏi để ghi điểm
            </DialogDescription>
          </DialogHeader>

          {/* Speed Mode Timer */}
          {gameRound?.gameMode === "speed" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  Thời gian còn lại
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  timeLeft <= 3 ? "text-destructive animate-pulse" : "text-primary"
                )}>
                  {timeLeft}s
                </span>
              </div>
              <Progress value={(timeLeft / 10) * 100} className="h-3" />
            </div>
          )}

          {/* Question */}
          <div className="p-6 bg-secondary/30 rounded-xl text-center">
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              {selectedQuestion?.question}
            </p>
          </div>

          {/* True/False Mode */}
          {gameRound?.gameMode === "truefalse" && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-2">Đáp án được đưa ra:</p>
                <p className="text-xl font-bold">{trueFalseAnswer}</p>
              </div>
              {!showAnswer ? (
                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-success hover:bg-success/90"
                    size="lg"
                    onClick={() => handleTrueFalseAnswer(true)}
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Đúng
                  </Button>
                  <Button
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                    size="lg"
                    onClick={() => handleTrueFalseAnswer(false)}
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    Sai
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "p-4 rounded-xl text-center text-lg font-bold",
                  trueFalseIsCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {trueFalseIsCorrect ? "Đáp án ĐÚNG!" : "Đáp án SAI!"}
                  <p className="text-sm font-normal mt-2">
                    Đáp án đúng: {selectedQuestion?.correct}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Guess Mode - Only show correct answer after reveal */}
          {gameRound?.gameMode === "guess" && showAnswer && (
            <div className="p-6 bg-success/10 rounded-xl border-2 border-success/30 text-center">
              <p className="text-sm text-muted-foreground mb-2">Dap an dung:</p>
              <p className="text-2xl font-bold text-success">{selectedQuestion?.correct}</p>
            </div>
          )}

          {/* Answers for other modes (not guess mode) */}
          {gameRound?.gameMode !== "truefalse" && gameRound?.gameMode !== "guess" && (
            <div className="space-y-3">
              {selectedQuestion?.answers.map((answer, index) => {
                const isCorrect = answer === selectedQuestion.correct
                const isEliminated = eliminatedAnswers.includes(index)
                const isSelected = selectedAnswerIndex === index
                const showAsCorrect = showAnswer && isCorrect
                const showAsWrong = showAnswer && isSelected && !isCorrect

                // Hidden mode: don't show answers initially
                if (gameRound?.gameMode === "hidden" && !hiddenAnswersRevealed && !showAnswer) {
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl border-2 border-border/50 bg-secondary/30 animate-pulse"
                    >
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary mr-3 text-sm font-bold">
                        {["A", "B", "C", "D"][index]}
                      </span>
                      <span className="text-muted-foreground">Dang an...</span>
                    </div>
                  )
                }

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (gameRound?.gameMode === "elimination" && !showAnswer) {
                        handleEliminateAnswer(index)
                      } else if (gameRound?.gameMode === "multiple" || gameRound?.gameMode === "hidden") {
                        handleMultipleChoiceSelect(index)
                      }
                    }}
                    disabled={showAnswer || isEliminated}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all text-left",
                      isEliminated && "opacity-30 line-through",
                      showAsCorrect && "border-success bg-success/20",
                      showAsWrong && "border-destructive bg-destructive/20",
                      !showAnswer && !isEliminated && "hover:border-primary hover:bg-primary/5 cursor-pointer",
                      !showAnswer && !isEliminated && "border-border/50"
                    )}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-sm font-bold",
                      showAsCorrect ? "bg-success text-success-foreground" : 
                      showAsWrong ? "bg-destructive text-destructive-foreground" : "bg-secondary"
                    )}>
                      {["A", "B", "C", "D"][index]}
                    </span>
                    <span className={cn(showAsCorrect && "font-medium")}>
                      {answer}
                    </span>
                    {showAsCorrect && <Check className="w-5 h-5 inline ml-2 text-success" />}
                    {showAsWrong && <X className="w-5 h-5 inline ml-2 text-destructive" />}
                  </button>
                )
              })}
            </div>
          )}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-sm font-bold",
                      showAsCorrect ? "bg-success text-success-foreground" : 
                      showAsWrong ? "bg-destructive text-destructive-foreground" : "bg-secondary"
                    )}>
                      {["A", "B", "C", "D"][index]}
                    </span>
                    <span className={cn(showAsCorrect && "font-medium")}>
                      {answer}
                    </span>
                    {showAsCorrect && <Check className="w-5 h-5 inline ml-2 text-success" />}
                    {showAsWrong && <X className="w-5 h-5 inline ml-2 text-destructive" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Elimination Mode Info */}
          {gameRound?.gameMode === "elimination" && !showAnswer && (
            <p className="text-center text-sm text-muted-foreground">
              Nhấn vào đáp án sai để loại bỏ ({2 - eliminatedAnswers.length} lần còn lại)
            </p>
          )}

          {/* Explanation */}
          {showAnswer && selectedQuestion?.explain && (
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-sm font-bold mb-1 text-primary">Giải thích:</p>
              <p className="text-sm">{selectedQuestion.explain}</p>
            </div>
          )}

          {/* Action Buttons */}
          {gameRound?.gameMode !== "truefalse" && (
            <div className="flex flex-wrap gap-3">
              {/* Guess Mode - Show reveal button */}
              {gameRound?.gameMode === "guess" && !showAnswer && (
                <Button
                  onClick={() => setShowAnswer(true)}
                  className="flex-1 bg-gradient-fun hover:opacity-90"
                  size="lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Hiện đáp án
                </Button>
              )}

              {/* Team Battle - Steal buttons */}
              {canSteal && gameRound?.teams && (
                <>
                  <Button
                    onClick={() => handleSteal(true)}
                    className="flex-1 bg-success hover:bg-success/90"
                    size="lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {gameRound.teams[((gameRound.currentTeamIndex || 0) + 1) % gameRound.teams.length]?.name} cướp đúng
                  </Button>
                  <Button
                    onClick={() => handleSteal(false)}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cướp sai
                  </Button>
                </>
              )}

              {/* Correct/Wrong buttons after answer revealed */}
              {showAnswer && !canSteal && (
                <>
                  {gameRound?.gameMode === "guess" && (
                    <>
                      <Button
                        onClick={handleMarkCorrect}
                        className="flex-1 bg-success hover:bg-success/90"
                        size="lg"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Đúng
                      </Button>
                      <Button
                        onClick={handleMarkWrong}
                        variant="destructive"
                        className="flex-1"
                        size="lg"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Sai
                      </Button>
                    </>
                  )}
                  {(gameRound?.gameMode === "multiple" || gameRound?.gameMode === "elimination" || gameRound?.gameMode === "hidden" || gameRound?.gameMode === "speed") && (
                    <Button
                      onClick={() => {
                        const isCorrect = selectedAnswerIndex !== null && 
                          selectedQuestion?.answers[selectedAnswerIndex] === selectedQuestion?.correct
                        if (isCorrect) {
                          handleMarkCorrect()
                        } else {
                          handleMarkWrong()
                        }
                      }}
                      className="flex-1"
                      size="lg"
                    >
                      <SkipForward className="w-5 h-5 mr-2" />
                      Tiếp tục
                    </Button>
                  )}
                </>
              )}

              {/* Skip button */}
              {!showAnswer && gameRound?.gameMode !== "guess" && (
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="lg"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Bỏ qua
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scoreboard Dialog */}
      <Dialog open={showScoreboard} onOpenChange={setShowScoreboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Bảng điểm
            </DialogTitle>
            <DialogDescription className="sr-only">
              Xem điểm số của tất cả người chơi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl",
                  index === 0 && "bg-gradient-warning"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                    index === 0 ? "bg-warning-foreground/20" : "bg-secondary"
                  )}>
                    {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={cn("font-medium", index === 0 && "font-bold")}>
                    {player.name}
                  </span>
                </div>
                <span className={cn(
                  "text-2xl font-bold",
                  index === 0 ? "text-warning-foreground" : "text-primary"
                )}>
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
