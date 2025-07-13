// Core types based on functional requirements

export interface EvaluationDetail {
  score: number;
  summary: string;
  report: string;
  references: string[];
  searchKeywords?: string[];
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  description: string;
  feasibilityScore: number;
  impact: 'high' | 'medium' | 'low';
  detailedEvaluation: {
    technical: EvaluationDetail;
    political: EvaluationDetail;
    financial: EvaluationDetail;
    timeline: EvaluationDetail;
  };
  sourceUrl?: string;
  analyzedBy: 'gemini' | 'claude' | 'perplexity' | 'manual';
  analyzedAt: Date;
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  party: string;
  status: 'incumbent' | 'newcomer' | 'former';
  prefecture: string;
  electionType: string;
  electionDate: Date;
  slogan: string;
  photoUrl?: string;
  achievements: string[];
  policies: Policy[];
  color?: string; // For UI theming
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  candidateId: string;
  policyId?: string;
  userId: string;
  userName: string;
  text: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  moderationScore?: number;
  status: 'active' | 'hidden' | 'deleted';
}

// API request/response types
export interface AnalyzeManifestoRequest {
  url: string;
  candidateName: string;
  prefecture: string;
  electionType: string;
  electionDate: string;
}

export interface AnalyzeManifestoResponse {
  success: boolean;
  candidateId: string;
  policies: Policy[];
  analysisMetadata: {
    aiModel: string;
    analyzedAt: string;
    processingTime: number;
  };
}

export interface ModerateCommentRequest {
  text: string;
  userId: string;
}

export interface ModerateCommentResponse {
  allowed: boolean;
  score: number;
  reasons?: string[];
}

// UI State types
export interface AppState {
  activeTab: string;
  selectedCandidate: Candidate | null;
  showComparison: boolean;
  selectedCandidatesForComparison: string[];
  comments: Record<string, Comment[]>;
  showDetailModal: Policy | null;
}

// Personal impact calculation types
export interface PersonalImpact {
  description: string;
  monthlyAmount?: number;
  benefitType: 'direct' | 'indirect';
}

// Categories for policy analysis
export type PolicyCategory = 'economy' | 'education' | 'agriculture' | 'healthcare' | 'environment' | 'labor' | 'social';

// Election types
export type ElectionType = 'prefectural' | 'municipal' | 'national' | 'house-of-representatives' | 'house-of-councilors';