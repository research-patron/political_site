import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'
import type { Candidate, Policy, Comment, CandidateFilters } from '@/types'

// Candidates
export const getCandidates = async (filters?: CandidateFilters): Promise<Candidate[]> => {
  let q = query(collection(db, 'candidates'), orderBy('updatedAt', 'desc'))
  
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')]
  
  if (filters?.prefecture) {
    constraints.push(where('prefecture', '==', filters.prefecture))
  }
  
  if (filters?.electionType) {
    constraints.push(where('electionType', '==', filters.electionType))
  }
  
  if (filters?.party && filters.party.length > 0) {
    constraints.push(where('party', 'in', filters.party))
  }
  
  if (filters?.status && filters.status.length > 0) {
    constraints.push(where('status', 'in', filters.status))
  }
  
  q = query(collection(db, 'candidates'), ...constraints)
  
  const snapshot = await getDocs(q)
  const candidates: Candidate[] = []
  
  for (const docSnap of snapshot.docs) {
    const candidateData = { id: docSnap.id, ...docSnap.data() } as Candidate
    
    // Get policies for each candidate
    const policiesQuery = query(
      collection(db, 'candidates', docSnap.id, 'policies'),
      orderBy('analyzedAt', 'desc')
    )
    const policiesSnapshot = await getDocs(policiesQuery)
    const policies = policiesSnapshot.docs.map(policyDoc => ({
      id: policyDoc.id,
      ...policyDoc.data()
    })) as Policy[]
    
    candidateData.policies = policies
    candidates.push(candidateData)
  }
  
  return candidates
}

export const getCandidate = async (candidateId: string): Promise<Candidate | null> => {
  const candidateDoc = await getDoc(doc(db, 'candidates', candidateId))
  
  if (!candidateDoc.exists()) {
    return null
  }
  
  const candidateData = { id: candidateDoc.id, ...candidateDoc.data() } as Candidate
  
  // Get policies
  const policiesQuery = query(
    collection(db, 'candidates', candidateId, 'policies'),
    orderBy('analyzedAt', 'desc')
  )
  const policiesSnapshot = await getDocs(policiesQuery)
  const policies = policiesSnapshot.docs.map(policyDoc => ({
    id: policyDoc.id,
    ...policyDoc.data()
  })) as Policy[]
  
  candidateData.policies = policies
  
  return candidateData
}

export const createCandidate = async (candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'policies'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'candidates'), {
    ...candidateData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateCandidate = async (candidateId: string, candidateData: Partial<Candidate>): Promise<void> => {
  await updateDoc(doc(db, 'candidates', candidateId), {
    ...candidateData,
    updatedAt: serverTimestamp(),
  })
}

// Policies
export const addPolicy = async (candidateId: string, policyData: Omit<Policy, 'id' | 'analyzedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'candidates', candidateId, 'policies'), {
    ...policyData,
    analyzedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updatePolicy = async (candidateId: string, policyId: string, policyData: Partial<Policy>): Promise<void> => {
  await updateDoc(doc(db, 'candidates', candidateId, 'policies', policyId), policyData)
}

// Comments
export const getComments = (candidateId: string, callback: (comments: Comment[]) => void, policyId?: string) => {
  let q = query(
    collection(db, 'comments'),
    where('candidateId', '==', candidateId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  
  if (policyId) {
    q = query(
      collection(db, 'comments'),
      where('candidateId', '==', candidateId),
      where('policyId', '==', policyId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  }
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[]
    callback(comments)
  })
}

export const addComment = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'status'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'comments'), {
    ...commentData,
    likes: 0,
    likedBy: [],
    status: 'active',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export const likeComment = async (commentId: string, userId: string): Promise<void> => {
  const commentRef = doc(db, 'comments', commentId)
  const commentDoc = await getDoc(commentRef)
  
  if (commentDoc.exists()) {
    const data = commentDoc.data() as Comment
    const likedBy = data.likedBy || []
    
    if (!likedBy.includes(userId)) {
      await updateDoc(commentRef, {
        likes: (data.likes || 0) + 1,
        likedBy: [...likedBy, userId],
      })
    }
  }
}

export const unlikeComment = async (commentId: string, userId: string): Promise<void> => {
  const commentRef = doc(db, 'comments', commentId)
  const commentDoc = await getDoc(commentRef)
  
  if (commentDoc.exists()) {
    const data = commentDoc.data() as Comment
    const likedBy = data.likedBy || []
    
    if (likedBy.includes(userId)) {
      await updateDoc(commentRef, {
        likes: Math.max((data.likes || 0) - 1, 0),
        likedBy: likedBy.filter(id => id !== userId),
      })
    }
  }
}