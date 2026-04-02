export type TodoType = 'daily' | 'weekly'

export interface Todo {
  id: string
  title: string
  type: TodoType
  completed: boolean
  created_at: string
}

export interface Idea {
  id: string
  raw_transcript: string
  formatted_text: string
  ai_evaluation: IdeaEvaluation | null
  created_at: string
}

export interface IdeaEvaluation {
  score: number
  pros: string[]
  cons: string[]
  improvements: string[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  created_at: string
}
