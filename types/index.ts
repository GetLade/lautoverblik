export type TodoType = 'daily' | 'weekly' | 'fixes'
export type TodoPriority = 'high' | 'medium' | 'low'

export interface Todo {
  id: string
  title: string
  type: TodoType
  completed: boolean
  priority: TodoPriority
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

export type MeetingKeyPointCategory = 'action' | 'decision' | 'note'

export interface MeetingKeyPoint {
  text: string
  category: MeetingKeyPointCategory
}

export interface MeetingSpeakerSegment {
  speaker: string
  timestamp: string
  text: string
}

export interface MeetingSalesAnalysis {
  outcome: 'won' | 'lost' | 'pending'
  outcome_summary: string
  closing_blockers: string[]
  strengths: string[]
  improvements: string[]
  score: number
}

export interface Meeting {
  id: string
  title: string
  transcript: string
  summary: string
  key_points: MeetingKeyPoint[]
  duration: number
  created_at: string
  corrected_transcript?: string
  speaker_segments?: MeetingSpeakerSegment[]
  goals_expectations?: string
  next_steps?: string
  sales_analysis?: MeetingSalesAnalysis
}
