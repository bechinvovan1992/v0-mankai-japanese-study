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
} from "lucide-react"
import { toast } from "sonner"

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
      toast.error("Please select datasets and add players first")
      return
    }
    startGame()
    toast.success("Game started!")
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
    toast.success("Correct! +1 point")
  }

  const handleMarkWrong = () => {
    if (!selectedQuestion) return
    markQuestionPlayed(selectedQuestion.id, false)
    nextPlayer()
    setSelectedQuestion(null)
    toast.error("Wrong answer")
  }

  const handleSkip = () => {
    nextPlayer()
    setSelectedQuestion(null)
  }

  const currentPlayer = gameRound?.players[gameRound.currentPlayerIndex]
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
              <Gamepad2 className="w-5 h-5" />
              Game Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Datasets */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Selected Datasets
              </h4>
              {selectedDatasetIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No datasets selected. Go to Datasets page to select.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {datasets
                    .filter((d) => selectedDatasetIds.includes(d.id))
                    .map((d) => (
                      <Badge key={d.id} variant="secondary">
                        {d.fileName} ({d.totalQuestions})
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Players */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Players ({players.length})
              </h4>
              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No players added. Go to Players page to add.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <Badge key={p.id} variant="outline">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">
                  {datasets
                    .filter((d) => selectedDatasetIds.includes(d.id))
                    .reduce((acc, d) => acc + d.questions.filter((q) => !q.played).length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions/Player</p>
                <p className="text-2xl font-bold">
                  {players.length > 0
                    ? Math.floor(
                        datasets
                          .filter((d) => selectedDatasetIds.includes(d.id))
                          .reduce((acc, d) => acc + d.questions.filter((q) => !q.played).length, 0) /
                          players.length
                      )
                    : 0}
                </p>
              </div>
            </div>

            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              size="lg"
              className="w-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
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
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <span className="text-lg font-bold text-primary">
              {currentPlayer?.name}{"'"}s Turn
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Questions: {gameRound.remainingQuestions}/{gameRound.totalQuestions}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScoreboard(true)}>
            <Trophy className="w-4 h-4 mr-2" />
            Scoreboard
          </Button>
          <Button variant="destructive" onClick={endGame}>
            End Game
          </Button>
        </div>
      </div>

      {/* Game Complete */}
      {isGameComplete ? (
        <Card className="border-primary/50">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Game Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Winner: {sortedPlayers[0]?.name} with {sortedPlayers[0]?.score} points
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => setShowScoreboard(true)}>
                View Final Scores
              </Button>
              <Button variant="outline" onClick={endGame}>
                New Game
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
                "aspect-square rounded-xl border-2 transition-all flex items-center justify-center text-2xl font-bold",
                question.played
                  ? "bg-secondary/50 border-border/50 text-muted-foreground cursor-not-allowed"
                  : "bg-card border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer cell-hover"
              )}
            >
              {question.played ? (
                <Check className="w-8 h-8 text-muted-foreground/50" />
              ) : (
                index + 1
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
              <Badge variant={selectedQuestion?.type === 1 ? "default" : "secondary"}>
                {selectedQuestion?.type === 1 ? "Grammar" : "Vocabulary"}
              </Badge>
              <span>{currentPlayer?.name}{"'"}s Question</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Question */}
            <div className="text-center">
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
                      "p-4 rounded-lg border-2 transition-all",
                      isCorrect && "border-green-500 bg-green-500/10",
                      isWrong && "border-border/50 opacity-50",
                      !showAnswer && "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="font-medium mr-2">
                      {["A", "B", "C", "D"][index]}.
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
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Show Answer
              </Button>
            )}

            {/* Explanation */}
            {showAnswer && selectedQuestion?.explain && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Explanation:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedQuestion.explain}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {showAnswer && (
              <div className="flex gap-2">
                <Button
                  onClick={handleMarkCorrect}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Correct (+1)
                </Button>
                <Button
                  onClick={handleMarkWrong}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Wrong
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
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
              <Trophy className="w-5 h-5" />
              Scoreboard
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  index === 0 && "bg-yellow-500/10 border border-yellow-500/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                      index === 0
                        ? "bg-yellow-500 text-yellow-950"
                        : index === 1
                        ? "bg-gray-300 text-gray-800"
                        : index === 2
                        ? "bg-amber-600 text-amber-950"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{player.score} pts</div>
                  <div className="text-xs text-muted-foreground">
                    {player.correctCount} correct / {player.wrongCount} wrong
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
