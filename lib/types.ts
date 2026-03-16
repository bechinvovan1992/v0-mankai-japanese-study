// Data Types for Mankai-Ôn Tập

export interface Question {
  id: string
  type: 1 | 2 // 1 = grammar, 2 = vocabulary
  question: string
  answers: string[]
  correct: string
  explain: string
  played: boolean
}

export interface Dataset {
  id: string
  fileName: string
  createdAt: string
  type: 1 | 2 // 1 = grammar, 2 = vocabulary
  totalQuestions: number
  questions: Question[]
}

export interface Player {
  id: string
  name: string
  score: number
  correctCount: number
  wrongCount: number
  assignedQuestions: Question[]
}

export interface GameRound {
  id: string
  createdAt: string
  players: Player[]
  questions: Question[]
  currentPlayerIndex: number
  totalQuestions: number
  remainingQuestions: number
}

export interface Settings {
  darkMode: boolean
  boardColumns: number
  animationEnabled: boolean
  soundEnabled: boolean
  autoPlayFrontTime: number
  autoPlayBackTime: number
}

export interface DataIndex {
  files: {
    id: string
    fileName: string
    createdAt: string
    type: 1 | 2
    totalQuestions: number
  }[]
}
