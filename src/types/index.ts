import { Timestamp } from 'firebase/firestore'

export interface Candidate {
  id: string
  name: string
  age: number
  party: string
  status: 'incumbent' | 'newcomer' | 'former'
  prefecture: string
  electionType: string
  electionDate: Timestamp
  slogan: string
  photoUrl?: string
  achievements: string[]
  policies: Policy[]
  isAnalyzedByAI?: boolean
  color?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Policy {
  id: string
  title: string
  category: string
  description: string
  feasibilityScore: number
  impact: 'high' | 'medium' | 'low'
  detailedEvaluation: {
    technical: EvaluationDetail
    political: EvaluationDetail
    financial: EvaluationDetail
    timeline: EvaluationDetail
  }
  sourceUrl?: string
  analyzedBy: 'gemini' | 'claude' | 'perplexity' | 'manual'
  analyzedAt: Timestamp
}

export interface EvaluationDetail {
  score: number
  summary: string
  report: string
  references: string[]
  searchKeywords: string[]
}

export interface Comment {
  id: string
  candidateId: string
  policyId?: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  likes: number
  likedBy: string[]
  createdAt: Timestamp
  moderationScore?: number
  status: 'active' | 'hidden' | 'deleted'
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  prefecture?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CandidateFilters {
  prefecture?: string
  electionType?: string
  party?: string[]
  status?: Array<'incumbent' | 'newcomer' | 'former'>
}

export interface AnalysisRequest {
  url: string
  candidateName: string
  prefecture: string
  electionType: string
  electionDate: string
}

export interface AnalysisResponse {
  success: boolean
  candidateId: string
  policies: Policy[]
  analysisMetadata: {
    aiModel: string
    analyzedAt: string
    processingTime: number
  }
}