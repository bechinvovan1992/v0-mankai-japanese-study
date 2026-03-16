"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import type { Question } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Medal,
  Star,
  PartyPopper,
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

export function GameBoard() {
  const {
    datasets,
    selectedDatasetIds,
    players,
    gameRound,
    settings,
    startGame,
    endGame,
    markQuestionPlayed,
    nextPlayer,
  } = useAppStore()

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)

  const canStartGame = selectedDatasetIds.length > 0 && players.length > 0

  const handleStartGame = () => {
    if (!canStartGame) {
      toast.error("Vui lòng chọn bộ dữ liệu và thêm người chơi trước")
      return
    }
    startGame()
    toast.success("Bắt đầu trò chơi!")
  }

  const handleCellClick = (question: Question) => {
    if (question.played) return
    setSelectedQuestion(question)
    setShowAnswer(false)
  }

  const handleMarkCorrect = () => {
    if (!selectedQuestion) return
    markQuestionPlayed(selectedQuestion.id, true)
    nextPlayer()
    setSelectedQuestion(null)
    toast.success("Chính xác! +1 điểm")
  }

  const handleMarkWrong = () => {
    if (!selectedQuestion) return
    markQuestionPlayed(selectedQuestion.id, false)
    nextPlayer()
    setSelectedQuestion(null)
    toast.error("Sai rồi!")
  }

  const handleSkip = () => {
    nextPlayer()
    setSelectedQuestion(null)
  }

  const currentPlayer = gameRound?.players[gameRound.currentPlayerIndex]
  const currentPlayerColor = playerColors[gameRound?.currentPlayerIndex % playerColors.length || 0]
  const boardColumns = settings.boardColumns || 4

  // Get all questions for the game
  const allQuestions = gameRound?.questions || []

  // Sort players by score for scoreboard
  const sortedPlayers = gameRound
    ? [...gameRound.players].sort((a, b) => b.score - a.score)
    : []

  // Check if game is complete
  const isGameComplete = gameRound && gameRound.remainingQuestions === 0

  if (!gameRound) {
    return (
      <div className="space-y-6">
        {/* Setup Panel */}
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
            <span className="text-xl font-bold">
              Lượt của {currentPlayer?.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
            Còn {gameRound.remainingQuestions}/{gameRound.totalQuestions} câu
          </div>
          <Button variant="outline" onClick={() => setShowScoreboard(true)} className="hover:bg-primary/10">
            <Trophy className="w-4 h-4 mr-2 text-warning" />
            Bảng điểm
          </Button>
          <Button variant="destructive" onClick={endGame}>
            Kết thúc
          </Button>
        </div>
      </div>

      {/* Game Complete */}
      {isGameComplete ? (
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-warning flex items-center justify-center mx-auto mb-6 shadow-lg">
              <PartyPopper className="w-12 h-12 text-warning-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Hoàn thành!</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Người thắng cuộc: <span className="text-primary font-bold">{sortedPlayers[0]?.name}</span> với {sortedPlayers[0]?.score} điểm
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setShowScoreboard(true)} size="lg">
                Xem bảng điểm
              </Button>
              <Button variant="outline" onClick={endGame} size="lg">
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
      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
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
                {selectedQuestion?.type === 1 ? "Ngữ pháp" : "Từ vựng"}
              </Badge>
              <span>Câu hỏi cho {currentPlayer?.name}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Trả lời câu hỏi để ghi điểm
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Question */}
            <div className="text-center p-6 bg-secondary/50 rounded-xl">
              <p className="text-xl font-medium">{selectedQuestion?.question}</p>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedQuestion?.answers.map((answer, index) => {
                const isCorrect = showAnswer && answer === selectedQuestion.correct
                const isWrong = showAnswer && answer !== selectedQuestion.correct
                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      isCorrect && "border-success bg-success/10",
                      isWrong && "border-border/50 opacity-50",
                      !showAnswer && "border-border hover:border-primary/50"
                    )}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-lg mr-2 text-sm font-bold",
                      isCorrect ? "bg-success text-success-foreground" : "bg-secondary"
                    )}>
                      {["A", "B", "C", "D"][index]}
                    </span>
                    {answer}
                  </div>
                )
              })}
            </div>

            {/* Show Answer Button */}
            {!showAnswer && (
              <Button
                variant="outline"
                onClick={() => setShowAnswer(true)}
                className="w-full text-lg py-5"
              >
                <Eye className="w-5 h-5 mr-2" />
                Hiện đáp án
              </Button>
            )}

            {/* Explanation */}
            {showAnswer && selectedQuestion?.explain && (
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm font-bold mb-1 text-primary">Giải thích:</p>
                <p className="text-sm">
                  {selectedQuestion.explain}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {showAnswer && (
              <div className="flex gap-3">
                <Button
                  onClick={handleMarkCorrect}
                  className="flex-1 bg-gradient-success hover:opacity-90 text-lg py-5"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Đúng (+1)
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
                  Bỏ qua
                </Button>
              </div>
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
                  "flex items-center justify-between p-4 rounded-xl transition-all",
                  index === 0 && "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-warning"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md",
                      index === 0
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                        : index === 2
                        ? "bg-gradient-to-br from-amber-600 to-orange-600 text-amber-950"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl">{player.score}</div>
                  <div className="text-xs text-muted-foreground">
                    {player.correctCount} đúng / {player.wrongCount} sai
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
