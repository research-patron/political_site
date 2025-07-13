import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Candidate, Comment, Policy } from '@/types';
import { db, functions } from '@/lib/firebase';
import { mockCandidates } from '@/data/candidates';

export class CandidateService {
  // Get all candidates from Firestore
  static async getAllCandidates(): Promise<Candidate[]> {
    try {
      const candidatesRef = collection(db, 'candidates');
      const candidatesQuery = query(candidatesRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(candidatesQuery);
      
      const candidates: Candidate[] = [];
      
      for (const docSnap of snapshot.docs) {
        const candidateData = docSnap.data();
        
        // Get policies for this candidate
        const policies = await this.getPoliciesForCandidate(docSnap.id);
        
        const candidate: Candidate = {
          id: docSnap.id,
          name: candidateData.name,
          age: candidateData.age,
          party: candidateData.party,
          status: candidateData.status,
          prefecture: candidateData.prefecture,
          electionType: candidateData.electionType,
          electionDate: candidateData.electionDate?.toDate() || new Date(),
          slogan: candidateData.slogan || '',
          photoUrl: candidateData.photoUrl,
          achievements: candidateData.achievements || [],
          policies: policies,
          color: candidateData.color,
          createdAt: candidateData.createdAt?.toDate() || new Date(),
          updatedAt: candidateData.updatedAt?.toDate() || new Date()
        };
        
        candidates.push(candidate);
      }
      
      return candidates;
    } catch (error) {
      console.error('Error fetching candidates from Firestore:', error);
      // Fallback to mock data
      console.warn('Falling back to mock data');
      return mockCandidates;
    }
  }

  // Get candidate by ID from Firestore
  static async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const candidateRef = doc(db, 'candidates', id);
      const candidateSnap = await getDoc(candidateRef);
      
      if (!candidateSnap.exists()) {
        // Fallback to mock data
        return mockCandidates.find(candidate => candidate.id === id) || null;
      }
      
      const candidateData = candidateSnap.data();
      
      // Get policies for this candidate
      const policies = await this.getPoliciesForCandidate(id);
      
      const candidate: Candidate = {
        id: candidateSnap.id,
        name: candidateData.name,
        age: candidateData.age,
        party: candidateData.party,
        status: candidateData.status,
        prefecture: candidateData.prefecture,
        electionType: candidateData.electionType,
        electionDate: candidateData.electionDate?.toDate() || new Date(),
        slogan: candidateData.slogan || '',
        photoUrl: candidateData.photoUrl,
        achievements: candidateData.achievements || [],
        policies: policies,
        color: candidateData.color,
        createdAt: candidateData.createdAt?.toDate() || new Date(),
        updatedAt: candidateData.updatedAt?.toDate() || new Date()
      };
      
      return candidate;
    } catch (error) {
      console.error('Error fetching candidate from Firestore:', error);
      // Fallback to mock data
      return mockCandidates.find(candidate => candidate.id === id) || null;
    }
  }

  // Get candidates by prefecture from Firestore
  static async getCandidatesByPrefecture(prefecture: string): Promise<Candidate[]> {
    try {
      const candidatesRef = collection(db, 'candidates');
      const candidatesQuery = query(
        candidatesRef, 
        where('prefecture', '==', prefecture),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(candidatesQuery);
      
      const candidates: Candidate[] = [];
      
      for (const docSnap of snapshot.docs) {
        const candidateData = docSnap.data();
        
        // Get policies for this candidate
        const policies = await this.getPoliciesForCandidate(docSnap.id);
        
        const candidate: Candidate = {
          id: docSnap.id,
          name: candidateData.name,
          age: candidateData.age,
          party: candidateData.party,
          status: candidateData.status,
          prefecture: candidateData.prefecture,
          electionType: candidateData.electionType,
          electionDate: candidateData.electionDate?.toDate() || new Date(),
          slogan: candidateData.slogan || '',
          photoUrl: candidateData.photoUrl,
          achievements: candidateData.achievements || [],
          policies: policies,
          color: candidateData.color,
          createdAt: candidateData.createdAt?.toDate() || new Date(),
          updatedAt: candidateData.updatedAt?.toDate() || new Date()
        };
        
        candidates.push(candidate);
      }
      
      return candidates;
    } catch (error) {
      console.error('Error fetching candidates by prefecture from Firestore:', error);
      // Fallback to mock data
      return mockCandidates.filter(candidate => candidate.prefecture === prefecture);
    }
  }

  // Search candidates by name or party
  static async searchCandidates(searchQuery: string): Promise<Candidate[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // For now, we'll get all candidates and filter client-side
      // In production, you might want to use Algolia or similar service
      const allCandidates = await this.getAllCandidates();
      
      const lowerQuery = searchQuery.toLowerCase();
      return allCandidates.filter(candidate => 
        candidate.name.toLowerCase().includes(lowerQuery) ||
        candidate.party.toLowerCase().includes(lowerQuery) ||
        candidate.slogan.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching candidates:', error);
      // Fallback to mock data
      const lowerQuery = searchQuery.toLowerCase();
      return mockCandidates.filter(candidate => 
        candidate.name.toLowerCase().includes(lowerQuery) ||
        candidate.party.toLowerCase().includes(lowerQuery) ||
        candidate.slogan.toLowerCase().includes(lowerQuery)
      );
    }
  }

  // Get policies for a specific candidate
  static async getPoliciesForCandidate(candidateId: string): Promise<Policy[]> {
    try {
      const policiesRef = collection(db, 'candidates', candidateId, 'policies');
      const policiesQuery = query(policiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(policiesQuery);
      
      const policies: Policy[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const policyData = docSnap.data();
        
        const policy: Policy = {
          id: docSnap.id,
          title: policyData.title,
          category: policyData.category,
          description: policyData.description,
          feasibilityScore: policyData.feasibilityScore,
          impact: policyData.impact,
          detailedEvaluation: policyData.detailedEvaluation,
          sourceUrl: policyData.sourceUrl,
          analyzedBy: policyData.analyzedBy,
          analyzedAt: policyData.analyzedAt?.toDate() || new Date()
        };
        
        policies.push(policy);
      });
      
      return policies;
    } catch (error) {
      console.error('Error fetching policies for candidate:', error);
      return [];
    }
  }

  // Create a new candidate
  static async createCandidate(candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'policies'>): Promise<Candidate> {
    try {
      const candidatesRef = collection(db, 'candidates');
      
      const newCandidateData = {
        ...candidateData,
        electionDate: Timestamp.fromDate(candidateData.electionDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(candidatesRef, newCandidateData);
      
      // Return the created candidate
      return {
        ...candidateData,
        id: docRef.id,
        policies: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw new Error('Failed to create candidate');
    }
  }

  // Update an existing candidate
  static async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    try {
      const candidateRef = doc(db, 'candidates', id);
      
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Convert Date objects to Timestamps
      if (updates.electionDate) {
        updateData.electionDate = Timestamp.fromDate(updates.electionDate);
      }
      
      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.policies;
      
      await updateDoc(candidateRef, updateData);
      
      // Return updated candidate
      const updatedCandidate = await this.getCandidateById(id);
      if (!updatedCandidate) {
        throw new Error('Failed to retrieve updated candidate');
      }
      
      return updatedCandidate;
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw new Error('Failed to update candidate');
    }
  }

  // Delete a candidate
  static async deleteCandidate(id: string): Promise<void> {
    try {
      // Delete all policies first
      const policiesRef = collection(db, 'candidates', id, 'policies');
      const policiesSnapshot = await getDocs(policiesRef);
      
      const deletePromises = policiesSnapshot.docs.map(policyDoc => 
        deleteDoc(policyDoc.ref)
      );
      await Promise.all(deletePromises);
      
      // Delete the candidate document
      const candidateRef = doc(db, 'candidates', id);
      await deleteDoc(candidateRef);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw new Error('Failed to delete candidate');
    }
  }

  // Listen to candidates changes (real-time)
  static subscribeToCandidate(candidateId: string, callback: (candidate: Candidate | null) => void): () => void {
    const candidateRef = doc(db, 'candidates', candidateId);
    
    return onSnapshot(candidateRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      
      // Get candidate data and policies
      this.getCandidateById(candidateId).then(candidate => {
        callback(candidate);
      }).catch(error => {
        console.error('Error in candidate subscription:', error);
        callback(null);
      });
    });
  }
}

export class CommentService {
  // Get comments for a candidate
  static async getCommentsByCandidate(candidateId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('candidateId', '==', candidateId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(commentsQuery);
      
      const comments: Comment[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const commentData = docSnap.data();
        
        const comment: Comment = {
          id: docSnap.id,
          candidateId: commentData.candidateId,
          policyId: commentData.policyId,
          userId: commentData.userId,
          userName: commentData.userName,
          text: commentData.text,
          likes: commentData.likes || 0,
          likedBy: commentData.likedBy || [],
          createdAt: commentData.createdAt?.toDate() || new Date(),
          moderationScore: commentData.moderationScore,
          status: commentData.status
        };
        
        comments.push(comment);
      });
      
      return comments;
    } catch (error) {
      console.error('Error fetching comments by candidate:', error);
      return [];
    }
  }

  // Get comments for a specific policy
  static async getCommentsByPolicy(policyId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(
        commentsRef,
        where('policyId', '==', policyId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(commentsQuery);
      
      const comments: Comment[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const commentData = docSnap.data();
        
        const comment: Comment = {
          id: docSnap.id,
          candidateId: commentData.candidateId,
          policyId: commentData.policyId,
          userId: commentData.userId,
          userName: commentData.userName,
          text: commentData.text,
          likes: commentData.likes || 0,
          likedBy: commentData.likedBy || [],
          createdAt: commentData.createdAt?.toDate() || new Date(),
          moderationScore: commentData.moderationScore,
          status: commentData.status
        };
        
        comments.push(comment);
      });
      
      return comments;
    } catch (error) {
      console.error('Error fetching comments by policy:', error);
      return [];
    }
  }

  // Create a new comment with moderation
  static async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy'>): Promise<Comment> {
    try {
      // First, moderate the comment
      const moderateCommentFunction = httpsCallable(functions, 'moderateCommentFunction');
      const moderationResult = await moderateCommentFunction({
        text: commentData.text,
        userId: commentData.userId,
        candidateId: commentData.candidateId,
        policyId: commentData.policyId
      });
      
      if (!moderationResult.data.allowed) {
        throw new Error(`Comment blocked: ${moderationResult.data.reasons?.join(', ')}`);
      }
      
      // Create the comment in Firestore
      const commentsRef = collection(db, 'comments');
      
      const newCommentData = {
        ...commentData,
        likes: 0,
        likedBy: [],
        moderationScore: moderationResult.data.score,
        status: 'active' as const,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(commentsRef, newCommentData);
      
      return {
        ...commentData,
        id: docRef.id,
        likes: 0,
        likedBy: [],
        moderationScore: moderationResult.data.score,
        status: 'active',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  }

  // Like/unlike a comment
  static async likeComment(commentId: string, userId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentSnap.data();
      const likedBy = commentData.likedBy || [];
      const isLiked = likedBy.includes(userId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(commentRef, {
          likes: Math.max(0, (commentData.likes || 0) - 1),
          likedBy: likedBy.filter((id: string) => id !== userId)
        });
      } else {
        // Like
        await updateDoc(commentRef, {
          likes: (commentData.likes || 0) + 1,
          likedBy: [...likedBy, userId]
        });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  // Report a comment
  static async reportComment(commentId: string, reason: string, userId: string): Promise<void> {
    try {
      const reportsRef = collection(db, 'commentReports');
      
      const reportData = {
        commentId,
        reportedBy: userId,
        reason,
        createdAt: serverTimestamp(),
        status: 'pending'
      };
      
      await addDoc(reportsRef, reportData);
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw new Error('Failed to report comment');
    }
  }

  // Subscribe to comments for real-time updates
  static subscribeToComments(
    candidateId: string, 
    callback: (comments: Comment[]) => void
  ): () => void {
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('candidateId', '==', candidateId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(commentsQuery, (snapshot) => {
      const comments: Comment[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const commentData = docSnap.data();
        
        const comment: Comment = {
          id: docSnap.id,
          candidateId: commentData.candidateId,
          policyId: commentData.policyId,
          userId: commentData.userId,
          userName: commentData.userName,
          text: commentData.text,
          likes: commentData.likes || 0,
          likedBy: commentData.likedBy || [],
          createdAt: commentData.createdAt?.toDate() || new Date(),
          moderationScore: commentData.moderationScore,
          status: commentData.status
        };
        
        comments.push(comment);
      });
      
      callback(comments);
    });
  }
}