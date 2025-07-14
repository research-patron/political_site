import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCandidates, getCandidate, createCandidate, updateCandidate } from '@/lib/firebase/firestore'
import type { Candidate, CandidateFilters } from '@/types'

export function useCandidates(filtersOrOptions?: CandidateFilters | { filters?: CandidateFilters; enabled?: boolean }) {
  // Handle both filters directly or options object
  const filters = filtersOrOptions && 'enabled' in filtersOrOptions ? filtersOrOptions.filters : filtersOrOptions as CandidateFilters
  const enabled = filtersOrOptions && 'enabled' in filtersOrOptions ? filtersOrOptions.enabled : true
  
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => getCandidates(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => getCandidate(candidateId),
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (candidateData: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'policies'>) => 
      createCandidate(candidateData),
    onSuccess: () => {
      // 候補者一覧をrefresh
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error) => {
      console.error('Failed to create candidate:', error)
    },
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ candidateId, candidateData }: { 
      candidateId: string
      candidateData: Partial<Candidate> 
    }) => updateCandidate(candidateId, candidateData),
    onSuccess: (_, { candidateId }) => {
      // 特定の候補者データをrefresh
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      // 候補者一覧もrefresh
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error) => {
      console.error('Failed to update candidate:', error)
    },
  })
}

// 候補者の統計情報を取得
export function useCandidatesStats() {
  return useQuery({
    queryKey: ['candidates-stats'],
    queryFn: async () => {
      const candidates = await getCandidates()
      
      const stats = {
        total: candidates.length,
        byStatus: candidates.reduce((acc, candidate) => {
          acc[candidate.status] = (acc[candidate.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPrefecture: candidates.reduce((acc, candidate) => {
          acc[candidate.prefecture] = (acc[candidate.prefecture] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byParty: candidates.reduce((acc, candidate) => {
          acc[candidate.party] = (acc[candidate.party] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byElectionType: candidates.reduce((acc, candidate) => {
          acc[candidate.electionType] = (acc[candidate.electionType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        avgFeasibilityScore: candidates.length > 0 
          ? Math.round(
              candidates
                .filter(c => c.policies && c.policies.length > 0)
                .reduce((acc, candidate) => {
                  const avgScore = candidate.policies!.reduce((sum, policy) => 
                    sum + policy.feasibilityScore, 0
                  ) / candidate.policies!.length
                  return acc + avgScore
                }, 0) / candidates.filter(c => c.policies && c.policies.length > 0).length
            )
          : 0,
        totalPolicies: candidates.reduce((acc, candidate) => 
          acc + (candidate.policies?.length || 0), 0
        ),
      }
      
      return stats
    },
    staleTime: 10 * 60 * 1000, // 10分
  })
}