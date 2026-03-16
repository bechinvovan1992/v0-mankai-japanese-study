// Data Types for Mankai-Ôn Tập

export interface Question {
  id: string
  type: 1 | 2 // 1 = grammar, 2 = vocabulary
  question: string
  answers: string[]
  correct: string
  explain: string
  played: boolean
  markedWrong?: boolean // For wrong review mode
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

export type GameMode = 
  | "guess"           // Guess Mode - verbal answer, reveal
  | "multiple"        // Multiple Choice Mode
  | "elimination"     // Elimination Mode
  | "speed"           // Speed Mode with timer
  | "hidden"          // Hidden Answers Mode
  | "truefalse"       // True or False Mode
  | "suddendeath"     // Sudden Death Mode
  | "teambattle"      // Team Battle Mode

export interface Team {
  id: string
  name: string
  players: Player[]
  score: number
}

export interface GameRound {
  id: string
  createdAt: string
  players: Player[]
  questions: Question[]
  currentPlayerIndex: number
  totalQuestions: number
  remainingQuestions: number
  gameMode: GameMode
  teams?: Team[]
  currentTeamIndex?: number
  suddenDeathEliminated?: string[] // Player IDs who are eliminated
}

export interface Settings {
  darkMode: boolean
  boardColumns: number
  animationEnabled: boolean
  soundEnabled: boolean
  autoPlayFrontTime: number
  autoPlayBackTime: number
  googleSheetUrl: string
  googleApiKey: string
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
