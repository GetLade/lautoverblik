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

export type CustomerStatus = 'lead' | 'active' | 'inactive'

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  status: CustomerStatus
  created_at: string
}

export interface CustomerRepo {
  id: string
  customer_id: string
  repo_url: string
  repo_name: string
  description?: string | null
  created_at: string
}

export interface CustomerNote {
  id: string
  customer_id: string
  content: string
  created_at: string
}

export interface CustomerFile {
  id: string
  customer_id: string
  file_name: string
  file_path: string
  file_size?: number | null
  mime_type?: string | null
  created_at: string
}

export interface TimeEntry {
  id: string
  customer_id?: string | null
  description: string
  started_at: string
  ended_at?: string | null
  duration_seconds?: number | null
  created_at: string
  customer?: { name: string } | null
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
