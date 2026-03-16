"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Dataset, Player, GameRound, Settings, Question } from "./types"

interface AppState {
  // Datasets
  datasets: Dataset[]
  selectedDatasetIds: string[]
  addDataset: (dataset: Dataset) => void
  removeDataset: (id: string) => void
  selectDataset: (id: string) => void
  deselectDataset: (id: string) => void
  selectAllDatasets: () => void
  deselectAllDatasets: () => void
  resetDatasetPlayed: (id: string) => void

  // Players
  players: Player[]
  addPlayer: (name: string) => void
  updatePlayer: (id: string, name: string) => void
  removePlayer: (id: string) => void
  randomizePlayers: () => void
  resetPlayers: () => void

  // Game
  gameRound: GameRound | null
  startGame: () => void
  endGame: () => void
  markQuestionPlayed: (questionId: string, correct: boolean) => void
  nextPlayer: () => void

  // Flashcard
  flashcardQuestions: Question[]
  currentFlashcardIndex: number
  flashcardFilter: "all" | "grammar" | "vocabulary"
  setFlashcardFilter: (filter: "all" | "grammar" | "vocabulary") => void
  loadFlashcards: () => void
  nextFlashcard: () => void
  prevFlashcard: () => void
  shuffleFlashcards: () => void
  setFlashcardIndex: (index: number) => void

  // Settings
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  resetAllData: () => void
}

const defaultSettings: Settings = {
  darkMode: true,
  boardColumns: 4,
  animationEnabled: true,
  soundEnabled: true,
  autoPlayFrontTime: 3,
  autoPlayBackTime: 3,
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Datasets
      datasets: [],
      selectedDatasetIds: [],
      addDataset: (dataset) =>
        set((state) => ({ datasets: [...state.datasets, dataset] })),
      removeDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          selectedDatasetIds: state.selectedDatasetIds.filter((sid) => sid !== id),
        })),
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
      randomizePlayers: () =>
        set((state) => ({
          players: [...state.players].sort(() => Math.random() - 0.5),
        })),
      resetPlayers: () => set({ players: [] }),

      // Game
      gameRound: null,
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
            assignedQuestions: [],
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
          },
        })
      },
      endGame: () => set({ gameRound: null }),
      markQuestionPlayed: (questionId, correct) =>
        set((state) => {
          if (!state.gameRound) return state
          const currentPlayer = state.gameRound.players[state.gameRound.currentPlayerIndex]
          return {
            gameRound: {
              ...state.gameRound,
              remainingQuestions: state.gameRound.remainingQuestions - 1,
              players: state.gameRound.players.map((p) =>
                p.id === currentPlayer.id
                  ? {
                      ...p,
                      score: correct ? p.score + 1 : p.score,
                      correctCount: correct ? p.correctCount + 1 : p.correctCount,
                      wrongCount: correct ? p.wrongCount : p.wrongCount + 1,
                      assignedQuestions: p.assignedQuestions.map((q) =>
                        q.id === questionId ? { ...q, played: true } : q
                      ),
                    }
                  : p
              ),
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
          const nextIndex =
            (state.gameRound.currentPlayerIndex + 1) % state.gameRound.players.length
          return {
            gameRound: {
              ...state.gameRound,
              currentPlayerIndex: nextIndex,
            },
          }
        }),

      // Flashcard
      flashcardQuestions: [],
      currentFlashcardIndex: 0,
      flashcardFilter: "all",
      setFlashcardFilter: (filter) => set({ flashcardFilter: filter }),
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
