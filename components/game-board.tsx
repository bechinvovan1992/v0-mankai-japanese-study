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
  { id: "guess", name: "Guess Mode", icon: <HelpCircle className="w-5 h-5" />, description: "Trả lời miệng, bấm hiện đáp án" },
  { id: "multiple", name: "Multiple Choice", icon: <CircleDot className="w-5 h-5" />, description: "Chọn 1 trong 4 đáp án" },
  { id: "elimination", name: "Elimination", icon: <Trash2 className="w-5 h-5" />, description: "Loại bỏ đáp án sai trước" },
  { id: "speed", name: "Speed Mode", icon: <Timer className="w-5 h-5" />, description: "Đếm ngược 10 giây" },
  { id: "hidden", name: "Hidden Answers", icon: <EyeOff className="w-5 h-5" />, description: "Hiện đáp án sau vài giây" },
  { id: "truefalse", name: "True or False", icon: <Target className="w-5 h-5" />, description: "Đúng hay Sai?" },
  { id: "suddendeath", name: "Sudden Death", icon: <Skull className="w-5 h-5" />, description: "Sai là bị loại!" },
  { id: "teambattle", name: "Team Battle", icon: <Swords className="w-5 h-5" />, description: "Đội nào thắng?" },
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
  } = useAppStore()

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
      toast.error("Het gio!")
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
      toast.error("Vui long chon bo du lieu va them nguoi choi truoc")
      return
    }
    startGame()
    if (selectedGameMode === "teambattle") {
      setupTeams(2)
    }
    toast.success("Bat dau tro choi!")
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
    if (question.played) return
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
    toast.success("Chinh xac! +1 diem")
  }

  const handleMarkWrong = () => {
    if (!selectedQuestion) return
    
    if (gameRound?.gameMode === "suddendeath") {
      const currentPlayer = gameRound.players[gameRound.currentPlayerIndex]
      eliminatePlayer(currentPlayer.id)
      toast.error(`${currentPlayer.name} bi loai!`)
      
      // Check if only one player remains
      const remainingPlayers = gameRound.players.filter(
        (p) => !gameRound.suddenDeathEliminated?.includes(p.id) && p.id !== currentPlayer.id
      )
      if (remainingPlayers.length === 1) {
        toast.success(`${remainingPlayers[0].name} chien thang!`)
      }
    } else if (gameRound?.gameMode === "teambattle" && !canSteal) {
      setCanSteal(true)
      toast.info("Doi kia co the cuop diem!")
      return
    }
    
    markQuestionPlayed(selectedQuestion.id, false)
    
    if (gameRound?.gameMode === "teambattle") {
      nextTeam()
    } else {
      nextPlayer()
    }
    
    resetQuestionState()
    toast.error("Sai roi!")
  }

  const handleSteal = (correct: boolean) => {
    if (!selectedQuestion || !gameRound?.teams) return
    
    const otherTeamIndex = ((gameRound.currentTeamIndex || 0) + 1) % gameRound.teams.length
    const otherTeam = gameRound.teams[otherTeamIndex]
    
    if (correct) {
      addTeamScore(otherTeam.id, 1)
      toast.success(`${otherTeam.name} cuop diem thanh cong!`)
    } else {
      toast.error(`${otherTeam.name} cuop diem that bai!`)
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
      toast.error("Khong the loai dap an dung!")
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
              Chuan bi tro choi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Datasets */}
            <div className="p-4 bg-secondary/50 rounded-xl">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Bo du lieu da chon
              </h4>
              {selectedDatasetIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chua chon bo du lieu. Vao trang Bo du lieu de chon nhe.
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
                Nguoi choi ({players.length})
              </h4>
              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chua co nguoi choi. Vao trang Nguoi choi de them nhe.
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
                Chon che do choi
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
                <p className="text-sm text-muted-foreground">Tong cau hoi</p>
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
                <p className="text-sm text-muted-foreground">Cau/nguoi</p>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              size="lg"
              className="w-full text-lg py-6 bg-gradient-fun hover:opacity-90"
            >
              <Play className="w-6 h-6 mr-2" />
              Bat dau choi!
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
                Luot cua {currentPlayer?.name}
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
            Con {gameRound.remainingQuestions}/{gameRound.totalQuestions} cau
          </div>
          <Button variant="outline" onClick={() => setShowScoreboard(true)} className="hover:bg-primary/10">
            <Trophy className="w-4 h-4 mr-2 text-warning" />
            Bang diem
          </Button>
          <Button variant="destructive" onClick={endGame}>
            Ket thuc
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
              {gameRound.suddenDeathEliminated?.includes(player.id) && " (Loai)"}
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
            <h2 className="text-3xl font-bold mb-2">Hoan thanh!</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Nguoi thang cuoc: <span className="text-primary font-bold">
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
                Xem bang diem
              </Button>
              <Button variant="outline" onClick={endGame} size="lg">
                Choi lai
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
            <button
              key={question.id}
              onClick={() => handleCellClick(question)}
              disabled={question.played}
              className={cn(
                "aspect-square rounded-2xl border-2 transition-all flex items-center justify-center text-2xl font-bold shadow-sm",
                question.played
                  ? "bg-secondary/50 border-border/50 text-muted-foreground/50 cursor-not-allowed"
                  : "bg-card border-primary/30 hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:scale-105 cursor-pointer"
              )}
            >
              {question.played ? (
                <Check className="w-8 h-8 text-success/50" />
              ) : (
                <span className="bg-gradient-to-br from-primary to-chart-5 bg-clip-text text-transparent">
                  {index + 1}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Question Modal */}
      <Dialog open={!!selectedQuestion} onOpenChange={() => resetQuestionState()}>
        <DialogContent className="max-w-2xl">
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
                {selectedQuestion?.type === 1 ? "Ngu phap" : "Tu vung"}
              </Badge>
              <span>Cau hoi cho {currentPlayer?.name}</span>
              {gameRound.gameMode === "speed" && timerActive && (
                <Badge variant="destructive" className="ml-auto">
                  <Timer className="w-4 h-4 mr-1" />
                  {timeLeft}s
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tra loi cau hoi de ghi diem
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Timer Progress for Speed Mode */}
            {gameRound.gameMode === "speed" && timerActive && (
              <Progress value={(timeLeft / 10) * 100} className="h-2" />
            )}

            {/* Question */}
            <div className="text-center p-6 bg-secondary/50 rounded-xl">
              <p className="text-xl font-medium">{selectedQuestion?.question}</p>
            </div>

            {/* True/False Mode */}
            {gameRound.gameMode === "truefalse" && trueFalseAnswer && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-primary/10 rounded-xl border-2 border-primary">
                  <p className="text-lg font-bold">{trueFalseAnswer}</p>
                  <p className="text-sm text-muted-foreground mt-2">Day co phai la dap an dung?</p>
                </div>
                {!showAnswer ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleTrueFalseAnswer(true)}
                      className="flex-1 bg-success hover:bg-success/90 text-lg py-5"
                    >
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      Dung
                    </Button>
                    <Button
                      onClick={() => handleTrueFalseAnswer(false)}
                      variant="destructive"
                      className="flex-1 text-lg py-5"
                    >
                      <ThumbsDown className="w-5 h-5 mr-2" />
                      Sai
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "p-4 rounded-xl text-center",
                    trueFalseIsCorrect ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    <p className="font-bold">
                      Dap an nay {trueFalseIsCorrect ? "DUNG" : "SAI"}!
                    </p>
                    <p className="text-sm mt-1">Dap an dung: {selectedQuestion?.correct}</p>
                  </div>
                )}
              </div>
            )}

            {/* Regular Answers (not True/False) */}
            {gameRound.gameMode !== "truefalse" && (
              <>
                {/* Answers - Hidden initially for Hidden Mode */}
                {(gameRound.gameMode !== "hidden" || hiddenAnswersRevealed) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedQuestion?.answers.map((answer, index) => {
                      const isCorrect = showAnswer && answer === selectedQuestion.correct
                      const isWrong = showAnswer && answer !== selectedQuestion.correct
                      const isEliminated = eliminatedAnswers.includes(index)
                      const isSelected = selectedAnswerIndex === index
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (gameRound.gameMode === "elimination" && !showAnswer) {
                              handleEliminateAnswer(index)
                            } else if (gameRound.gameMode === "multiple" && !showAnswer) {
                              handleMultipleChoiceSelect(index)
                            }
                          }}
                          disabled={isEliminated || (gameRound.gameMode === "multiple" && showAnswer)}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            isEliminated && "opacity-30 line-through",
                            isCorrect && "border-success bg-success/10",
                            isWrong && showAnswer && "border-border/50 opacity-50",
                            isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            !showAnswer && !isEliminated && "border-border hover:border-primary/50 cursor-pointer",
                            gameRound.gameMode === "elimination" && !showAnswer && !isEliminated && "hover:border-destructive hover:bg-destructive/5"
                          )}
                        >
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-2 text-sm font-bold",
                            isCorrect ? "bg-success text-success-foreground" : "bg-secondary"
                          )}>
                            {["A", "B", "C", "D"][index]}
                          </span>
                          {answer}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Hidden Mode - Waiting */}
                {gameRound.gameMode === "hidden" && !hiddenAnswersRevealed && (
                  <div className="text-center p-8 bg-secondary/50 rounded-xl">
                    <EyeOff className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-pulse" />
                    <p className="text-lg font-medium">Dap an se hien sau 3 giay...</p>
                  </div>
                )}

                {/* Elimination Mode Instructions */}
                {gameRound.gameMode === "elimination" && !showAnswer && eliminatedAnswers.length < 2 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Click vao {2 - eliminatedAnswers.length} dap an sai de loai bo
                  </p>
                )}

                {/* Show Answer Button */}
                {!showAnswer && gameRound.gameMode !== "multiple" && (gameRound.gameMode !== "elimination" || eliminatedAnswers.length >= 2) && (gameRound.gameMode !== "hidden" || hiddenAnswersRevealed) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAnswer(true)
                      setTimerActive(false)
                    }}
                    className="w-full text-lg py-5"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Hien dap an
                  </Button>
                )}

                {/* Explanation */}
                {showAnswer && selectedQuestion?.explain && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm font-bold mb-1 text-primary">Giai thich:</p>
                    <p className="text-sm">{selectedQuestion.explain}</p>
                  </div>
                )}

                {/* Team Battle Steal Option */}
                {canSteal && gameRound.teams && (
                  <div className="p-4 bg-warning/20 rounded-xl border border-warning">
                    <p className="text-center font-bold mb-3">
                      {gameRound.teams[((gameRound.currentTeamIndex || 0) + 1) % gameRound.teams.length]?.name} co the cuop diem!
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => handleSteal(true)} className="flex-1 bg-success">
                        <Check className="w-4 h-4 mr-2" />
                        Cuop dung
                      </Button>
                      <Button onClick={() => handleSteal(false)} variant="destructive" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cuop sai
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {showAnswer && !canSteal && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleMarkCorrect}
                      className="flex-1 bg-gradient-success hover:opacity-90 text-lg py-5"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Dung (+1)
                    </Button>
                    <Button
                      onClick={handleMarkWrong}
                      variant="destructive"
                      className="flex-1 text-lg py-5"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Sai
                    </Button>
                    <Button onClick={handleSkip} variant="outline" className="py-5">
                      <SkipForward className="w-5 h-5 mr-2" />
                      Bo qua
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Scoreboard Modal */}
      <Dialog open={showScoreboard} onOpenChange={setShowScoreboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Bang diem
            </DialogTitle>
            <DialogDescription className="sr-only">
              Xem diem so cua tat ca nguoi choi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {/* Team Scores */}
            {gameRound.gameMode === "teambattle" && gameRound.teams && (
              <div className="mb-4 space-y-2">
                <h4 className="font-bold text-sm text-muted-foreground">DOI</h4>
                {[...gameRound.teams].sort((a, b) => b.score - a.score).map((team, index) => (
                  <div
                    key={team.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl",
                      index === 0 && "bg-warning/20 border border-warning"
                    )}
                  >
                    <span className="font-bold">{team.name}</span>
                    <span className="text-xl font-bold">{team.score}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Player Scores */}
            <h4 className="font-bold text-sm text-muted-foreground">CA NHAN</h4>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl transition-all",
                  index === 0 && gameRound.gameMode !== "teambattle" && "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-warning",
                  gameRound.suddenDeathEliminated?.includes(player.id) && "opacity-50 line-through"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md",
                      index === 0 && gameRound.gameMode !== "teambattle"
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                        : index === 2
                        ? "bg-gradient-to-br from-amber-600 to-orange-600 text-amber-950"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {index === 0 && gameRound.gameMode !== "teambattle" ? <Crown className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl">{player.score}</div>
                  <div className="text-xs text-muted-foreground">
                    {player.correctCount} dung / {player.wrongCount} sai
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
