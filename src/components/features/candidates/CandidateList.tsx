"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CandidateCard } from './CandidateCard'
import { CandidateFilters } from './CandidateFilters'
import { URLAnalyzer } from '../analysis/URLAnalyzer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Grid, List, Search, Plus, Bot, Shield } from 'lucide-react'
import { Candidate, CandidateFilters as CandidateFiltersType } from '@/types'
import { useCandidates } from '@/lib/hooks/api/useCandidates'
import { useAuth } from '@/lib/contexts/AuthContext'

interface CandidateListProps {
  initialFilters?: CandidateFiltersType
}

export function CandidateList({ initialFilters }: CandidateListProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState<CandidateFiltersType>(initialFilters || {})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('candidates')

  const { data: candidates, isLoading, error } = useCandidates(filters)

  const filteredCandidates = candidates?.filter(candidate => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      candidate.name.toLowerCase().includes(query) ||
      candidate.party.toLowerCase().includes(query) ||
      candidate.slogan?.toLowerCase().includes(query) ||
      candidate.policies?.some(policy => 
        policy.title.toLowerCase().includes(query) ||
        policy.description.toLowerCase().includes(query)
      )
    )
  }) || []

  const handleCandidateClick = (candidate: Candidate) => {
    router.push(`/candidates/${candidate.id}`)
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription>
          候補者データの読み込み中にエラーが発生しました。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? '候補者管理' : '候補者一覧'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? '候補者の閲覧・検索、またはURL分析による新規登録' 
              : '候補者の情報を閲覧・検索できます'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'candidates' && (
            <>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      {isAdmin ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              候補者一覧 ({filteredCandidates.length})
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              URL分析・登録
            </TabsTrigger>
          </TabsList>

        <TabsContent value="candidates" className="space-y-6 mt-6">
          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="候補者名、政党、公約で検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          {/* Filters */}
          <CandidateFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Loading State */}
          {isLoading && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </Card>
              ))}
            </div>
          )}

          {/* Candidates Grid */}
          {!isLoading && filteredCandidates.length > 0 && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => handleCandidateClick(candidate)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredCandidates.length === 0 && (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">候補者が見つかりませんでした</h3>
              <p className="text-muted-foreground mb-4">
                検索条件やフィルターを変更してお試しください
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setFilters({})
                }}
              >
                フィルターをリセット
              </Button>
            </Card>
          )}
        </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <URLAnalyzer />
          </TabsContent>
        </Tabs>
      ) : (
        /* 一般ユーザー向け表示 */
        <div className="space-y-6">
          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="候補者名、政党、公約で検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          {/* Filters */}
          <CandidateFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Loading State */}
          {isLoading && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </Card>
              ))}
            </div>
          )}

          {/* Candidates Grid */}
          {!isLoading && filteredCandidates.length > 0 && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => handleCandidateClick(candidate)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredCandidates.length === 0 && (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">候補者が見つかりませんでした</h3>
              <p className="text-muted-foreground mb-4">
                検索条件やフィルターを変更してお試しください
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setFilters({})
                }}
              >
                フィルターをリセット
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}