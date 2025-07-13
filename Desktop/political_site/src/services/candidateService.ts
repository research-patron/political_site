import { Candidate, Comment } from '@/types';
import { mockCandidates } from '@/data/candidates';

// This is a placeholder service layer for candidate data management
// In production, this would connect to Firebase Firestore

export class CandidateService {
  // Get all candidates
  static async getAllCandidates(): Promise<Candidate[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockCandidates;
  }

  // Get candidate by ID
  static async getCandidateById(id: string): Promise<Candidate | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockCandidates.find(candidate => candidate.id === id) || null;
  }

  // Get candidates by prefecture
  static async getCandidatesByPrefecture(prefecture: string): Promise<Candidate[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockCandidates.filter(candidate => candidate.prefecture === prefecture);
  }

  // Search candidates by name or party
  static async searchCandidates(query: string): Promise<Candidate[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    return mockCandidates.filter(candidate => 
      candidate.name.toLowerCase().includes(lowerQuery) ||
      candidate.party.toLowerCase().includes(lowerQuery) ||
      candidate.slogan.toLowerCase().includes(lowerQuery)
    );
  }

  // In production, these would interact with Firestore:
  // static async createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> { ... }
  // static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> { ... }
  // static async deleteCandidate(id: string): Promise<void> { ... }
}

export class CommentService {
  // Placeholder for comment management
  // In production, this would connect to Firebase Firestore with real-time listeners

  static async getCommentsByCandidate(candidateId: string): Promise<Comment[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Return mock comments or empty array
    return [];
  }

  static async getCommentsByPolicy(policyId: string): Promise<Comment[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }

  static async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy'>): Promise<Comment> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      status: 'active'
    };

    return newComment;
  }

  // In production, these would interact with Firestore and Cloud Functions:
  // static async moderateComment(commentId: string): Promise<ModerateCommentResponse> { ... }
  // static async likeComment(commentId: string, userId: string): Promise<void> { ... }
  // static async reportComment(commentId: string, reason: string): Promise<void> { ... }
}