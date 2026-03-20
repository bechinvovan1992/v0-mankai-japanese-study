"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Dataset,
  Player,
  GameRound,
  Settings,
  Question,
  GameMode,
  Team,
  MarkQuestionWrongOptions,
} from "./types"

interface AppState {
  // Datasets
  datasets: Dataset[]
  selectedDatasetIds: string[]
  isLoadingFromServer: boolean
  addDataset: (dataset: Dataset) => void
  addDatasetAndSave: (dataset: Dataset) => Promise<void>
  removeDataset: (id: string) => void
  removeDatasetAndDelete: (id: string) => Promise<void>
  loadDatasetsFromServer: () => Promise<void>
  loadDatasetsFromGoogleSheet: () => Promise<void>
  isLoadingFromGoogleSheet: boolean
  selectDataset: (id: string) => void
  deselectDataset: (id: string) => void
  selectAllDatasets: () => void
  deselectAllDatasets: () => void
  resetDatasetPlayed: (id: string) => void
  resetAllSelectedPlayed: () => void

  // Players
  players: Player[]
  addPlayer: (name: string) => void
  updatePlayer: (id: string, name: string) => void
  removePlayer: (id: string) => void
  adjustPlayerScore: (id: string, delta: number) => void
  randomizePlayers: () => void
  resetPlayers: () => void

  // Game
  gameRound: GameRound | null
  selectedGameMode: GameMode
  setGameMode: (mode: GameMode) => void
  startGame: () => void
  endGame: () => void
  markQuestionPlayed: (
    questionId: string,
    correct: boolean,
    bonusPoints?: number,
    wrongOptions?: MarkQuestionWrongOptions
  ) => void
  nextPlayer: () => void
  eliminatePlayer: (playerId: string) => void
  setupTeams: (numTeams: number) => void
  nextTeam: () => void
  addTeamScore: (teamId: string, points: number) => void

  // Flashcard
  flashcardQuestions: Question[]
  currentFlashcardIndex: number
  flashcardFilter: "all" | "grammar" | "vocabulary" | "wrong"
  flashcardMode: "flip" | "guess" | "quiz"
  wrongAnswerIds: string[]
  setFlashcardFilter: (filter: "all" | "grammar" | "vocabulary" | "wrong") => void
  setFlashcardMode: (mode: "flip" | "guess" | "quiz") => void
  loadFlashcards: () => void
  nextFlashcard: () => void
  prevFlashcard: () => void
  shuffleFlashcards: () => void
  setFlashcardIndex: (index: number) => void
  markFlashcardWrong: (questionId: string) => void
  markFlashcardCorrect: (questionId: string) => void
  clearWrongAnswers: () => void

  // Settings
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  resetAllData: () => void
}

const defaultSettings: Settings = {
  darkMode: false,
  boardColumns: 4,
  animationEnabled: true,
  soundEnabled: true,
  autoPlayFrontTime: 3,
  autoPlayBackTime: 3,
  googleSheetUrl: "",
  guessTimerSeconds: 10,
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Datasets
      datasets: [],
      selectedDatasetIds: [],
      isLoadingFromServer: false,
      isLoadingFromGoogleSheet: false,
      addDataset: (dataset) =>
        set((state) => ({ datasets: [...state.datasets, dataset] })),
      addDatasetAndSave: async (dataset) => {
        set((state) => ({ datasets: [...state.datasets, dataset] }))
        try {
          await fetch("/api/datasets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataset),
          })
        } catch (error) {
          console.error("Failed to save dataset to server:", error)
        }
      },
      removeDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          selectedDatasetIds: state.selectedDatasetIds.filter((sid) => sid !== id),
        })),
      removeDatasetAndDelete: async (id) => {
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          selectedDatasetIds: state.selectedDatasetIds.filter((sid) => sid !== id),
        }))
        try {
          await fetch(`/api/datasets?id=${id}`, { method: "DELETE" })
        } catch (error) {
          console.error("Failed to delete dataset from server:", error)
        }
      },
      loadDatasetsFromServer: async () => {
        set({ isLoadingFromServer: true })
        try {
          const res = await fetch("/api/datasets")
          const data = await res.json()
          if (data.datasets && data.datasets.length > 0) {
            set((state) => {
              // Merge server datasets with local ones, avoiding duplicates
              const existingIds = state.datasets.map((d) => d.id)
              const newDatasets = data.datasets.filter(
                (d: Dataset) => !existingIds.includes(d.id)
              )
              return { datasets: [...state.datasets, ...newDatasets] }
            })
          }
        } catch (error) {
          console.error("Failed to load datasets from server:", error)
        } finally {
          set({ isLoadingFromServer: false })
        }
      },
      loadDatasetsFromGoogleSheet: async () => {
        const state = get()
        const { googleSheetUrl } = state.settings
        if (!googleSheetUrl) return

        set({ isLoadingFromGoogleSheet: true })
        try {
          const res = await fetch(`/api/google-sheets?url=${encodeURIComponent(googleSheetUrl)}`)
          const data = await res.json()
          if (data.datasets && data.datasets.length > 0) {
            // Replace all datasets with Google Sheet data
            set({ datasets: data.datasets })
          }
        } catch (error) {
          console.error("Failed to load datasets from Google Sheet:", error)
        } finally {
          set({ isLoadingFromGoogleSheet: false })
        }
      },
      selectDataset: (id) =>
        set((state) => ({
          selectedDatasetIds: state.selectedDatasetIds.includes(id)
            ? state.selectedDatasetIds
            : [...state.selectedDatasetIds, id],
        })),
      deselectDataset: (id) =>
        set((state) => ({
          selectedDatasetIds: state.selectedDatasetIds.filter((sid) => sid !== id),
        })),
      selectAllDatasets: () =>
        set((state) => ({
          selectedDatasetIds: state.datasets.map((d) => d.id),
        })),
      deselectAllDatasets: () => set({ selectedDatasetIds: [] }),
      resetDatasetPlayed: (id) =>
        set((state) => ({
          datasets: state.datasets.map((d) =>
            d.id === id
              ? {
                  ...d,
                  questions: d.questions.map((q) => ({ ...q, played: false })),
                }
              : d
          ),
        })),
      resetAllSelectedPlayed: () =>
        set((state) => ({
          datasets: state.datasets.map((d) =>
            state.selectedDatasetIds.includes(d.id)
              ? {
                  ...d,
                  questions: d.questions.map((q) => ({ ...q, played: false })),
                }
              : d
          ),
        })),

      // Players
      players: [],
      addPlayer: (name) =>
        set((state) => {
          if (state.players.length >= 20) return state
          return {
            players: [
              ...state.players,
              {
                id: generateId(),
                name,
                score: 0,
                correctCount: 0,
                wrongCount: 0,
                assignedQuestions: [],
              },
            ],
          }
        }),
      updatePlayer: (id, name) =>
        set((state) => ({
          players: state.players.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),
      adjustPlayerScore: (id, delta) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, score: p.score + delta } : p
          ),
          gameRound: state.gameRound
            ? {
                ...state.gameRound,
                players: state.gameRound.players.map((p) =>
                  p.id === id ? { ...p, score: p.score + delta } : p
                ),
              }
            : state.gameRound,
        })),
      randomizePlayers: () =>
        set((state) => ({
          players: [...state.players].sort(() => Math.random() - 0.5),
        })),
      resetPlayers: () => set({ players: [] }),

      // Game
      gameRound: null,
      selectedGameMode: "guess",
      setGameMode: (mode) => set({ selectedGameMode: mode }),
      startGame: () => {
        const state = get()
        const selectedDatasets = state.datasets.filter((d) =>
          state.selectedDatasetIds.includes(d.id)
        )
        const allQuestions = selectedDatasets.flatMap((d) =>
          d.questions.filter((q) => !q.played)
        )
        const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5)
        const shuffledPlayers = [...state.players]
          .sort(() => Math.random() - 0.5)
          .map((p) => ({
            ...p,
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            assignedQuestions: [] as Question[],
          }))

        // Distribute questions to players
        const questionsPerPlayer = Math.floor(shuffledQuestions.length / shuffledPlayers.length)
        const extraQuestions = shuffledQuestions.length % shuffledPlayers.length

        let questionIndex = 0
        shuffledPlayers.forEach((player, playerIndex) => {
          const numQuestions =
            questionsPerPlayer + (playerIndex < extraQuestions ? 1 : 0)
          player.assignedQuestions = shuffledQuestions.slice(
            questionIndex,
            questionIndex + numQuestions
          )
          questionIndex += numQuestions
        })

        set({
          gameRound: {
            id: generateId(),
            createdAt: new Date().toISOString(),
            players: shuffledPlayers,
            questions: shuffledQuestions,
            currentPlayerIndex: 0,
            totalQuestions: shuffledQuestions.length,
            remainingQuestions: shuffledQuestions.length,
            gameMode: state.selectedGameMode,
            guessTimerSeconds: state.settings.guessTimerSeconds || 10, // Lock timer value when game starts
            suddenDeathEliminated: [],
          },
        })
      },
      endGame: () => set({ gameRound: null }),
      markQuestionPlayed: (questionId, correct, bonusPoints = 0, wrongOptions) =>
        set((state) => {
          if (!state.gameRound) return state
          const currentPlayer = state.gameRound.players[state.gameRound.currentPlayerIndex]
          const mode = state.gameRound.gameMode

          const deductPlayerOnWrong =
            !correct &&
            bonusPoints === 0 &&
            wrongOptions?.deductCurrentPlayer !== false &&
            mode !== "suddendeath"

          const pointsToAdd =
            bonusPoints > 0 ? bonusPoints : correct ? 1 : deductPlayerOnWrong ? -1 : 0

          let nextGameRound = { ...state.gameRound }

          nextGameRound.players = nextGameRound.players.map((p) =>
            p.id === currentPlayer.id
              ? {
                  ...p,
                  score: p.score + pointsToAdd,
                  correctCount: correct || bonusPoints > 0 ? p.correctCount + 1 : p.correctCount,
                  wrongCount: correct || bonusPoints > 0 ? p.wrongCount : p.wrongCount + 1,
                  assignedQuestions: p.assignedQuestions.map((q) =>
                    q.id === questionId ? { ...q, played: true } : q
                  ),
                }
              : p
          )

          if (
            !correct &&
            bonusPoints === 0 &&
            mode === "teambattle" &&
            nextGameRound.teams &&
            nextGameRound.teams.length > 0
          ) {
            const teamId =
              wrongOptions?.wrongTeamId ??
              nextGameRound.teams[nextGameRound.currentTeamIndex || 0]?.id
            if (teamId) {
              nextGameRound.teams = nextGameRound.teams.map((t) =>
                t.id === teamId ? { ...t, score: t.score - 1 } : t
              )
            }
          }

          return {
            gameRound: {
              ...nextGameRound,
              remainingQuestions:
                bonusPoints > 0
                  ? state.gameRound.remainingQuestions
                  : state.gameRound.remainingQuestions - 1,
              questions: state.gameRound.questions.map((q) =>
                q.id === questionId ? { ...q, played: true } : q
              ),
            },
            datasets: state.datasets.map((d) => ({
              ...d,
              questions: d.questions.map((q) =>
                q.id === questionId ? { ...q, played: true } : q
              ),
            })),
          }
        }),
      nextPlayer: () =>
        set((state) => {
          if (!state.gameRound) return state
          // For sudden death, skip eliminated players
          let nextIndex = (state.gameRound.currentPlayerIndex + 1) % state.gameRound.players.length
          if (state.gameRound.gameMode === "suddendeath" && state.gameRound.suddenDeathEliminated) {
            let attempts = 0
            while (
              state.gameRound.suddenDeathEliminated.includes(state.gameRound.players[nextIndex].id) &&
              attempts < state.gameRound.players.length
            ) {
              nextIndex = (nextIndex + 1) % state.gameRound.players.length
              attempts++
            }
          }
          return {
            gameRound: {
              ...state.gameRound,
              currentPlayerIndex: nextIndex,
            },
          }
        }),
      eliminatePlayer: (playerId) =>
        set((state) => {
          if (!state.gameRound) return state
          return {
            gameRound: {
              ...state.gameRound,
              suddenDeathEliminated: [
                ...(state.gameRound.suddenDeathEliminated || []),
                playerId,
              ],
            },
          }
        }),
      setupTeams: (numTeams) =>
        set((state) => {
          if (!state.gameRound) return state
          const shuffledPlayers = [...state.gameRound.players].sort(() => Math.random() - 0.5)
          const teams: Team[] = []
          for (let i = 0; i < numTeams; i++) {
            teams.push({
              id: generateId(),
              name: `Đội ${i + 1}`,
              players: [],
              score: 0,
            })
          }
          shuffledPlayers.forEach((player, index) => {
            teams[index % numTeams].players.push(player)
          })
          return {
            gameRound: {
              ...state.gameRound,
              teams,
              currentTeamIndex: 0,
            },
          }
        }),
      nextTeam: () =>
        set((state) => {
          if (!state.gameRound || !state.gameRound.teams) return state
          return {
            gameRound: {
              ...state.gameRound,
              currentTeamIndex: ((state.gameRound.currentTeamIndex || 0) + 1) % state.gameRound.teams.length,
            },
          }
        }),
      addTeamScore: (teamId, points) =>
        set((state) => {
          if (!state.gameRound || !state.gameRound.teams) return state
          return {
            gameRound: {
              ...state.gameRound,
              teams: state.gameRound.teams.map((t) =>
                t.id === teamId ? { ...t, score: t.score + points } : t
              ),
            },
          }
        }),

      // Flashcard
      flashcardQuestions: [],
      currentFlashcardIndex: 0,
      flashcardFilter: "all",
      flashcardMode: "flip",
      wrongAnswerIds: [],
      setFlashcardFilter: (filter) => set({ flashcardFilter: filter }),
      setFlashcardMode: (mode) => set({ flashcardMode: mode }),
      loadFlashcards: () => {
        const state = get()
        const selectedDatasets = state.datasets.filter((d) =>
          state.selectedDatasetIds.includes(d.id)
        )
        let questions = selectedDatasets.flatMap((d) => d.questions)

        if (state.flashcardFilter === "grammar") {
          questions = questions.filter((q) => q.type === 1)
        } else if (state.flashcardFilter === "vocabulary") {
          questions = questions.filter((q) => q.type === 2)
        } else if (state.flashcardFilter === "wrong") {
          questions = questions.filter((q) => state.wrongAnswerIds.includes(q.id))
        }

        set({ flashcardQuestions: questions, currentFlashcardIndex: 0 })
      },
      nextFlashcard: () =>
        set((state) => ({
          currentFlashcardIndex:
            (state.currentFlashcardIndex + 1) % state.flashcardQuestions.length,
        })),
      prevFlashcard: () =>
        set((state) => ({
          currentFlashcardIndex:
            state.currentFlashcardIndex === 0
              ? state.flashcardQuestions.length - 1
              : state.currentFlashcardIndex - 1,
        })),
      shuffleFlashcards: () =>
        set((state) => ({
          flashcardQuestions: [...state.flashcardQuestions].sort(
            () => Math.random() - 0.5
          ),
          currentFlashcardIndex: 0,
        })),
      setFlashcardIndex: (index) => set({ currentFlashcardIndex: index }),
      markFlashcardWrong: (questionId) =>
        set((state) => ({
          wrongAnswerIds: state.wrongAnswerIds.includes(questionId)
            ? state.wrongAnswerIds
            : [...state.wrongAnswerIds, questionId],
        })),
      markFlashcardCorrect: (questionId) =>
        set((state) => ({
          wrongAnswerIds: state.wrongAnswerIds.filter((id) => id !== questionId),
        })),
      clearWrongAnswers: () => set({ wrongAnswerIds: [] }),

      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetAllData: () =>
        set({
          datasets: [],
          selectedDatasetIds: [],
          players: [],
          gameRound: null,
          flashcardQuestions: [],
          currentFlashcardIndex: 0,
          settings: defaultSettings,
        }),
    }),
    {
      name: "mankai-storage",
    }
  )
)
