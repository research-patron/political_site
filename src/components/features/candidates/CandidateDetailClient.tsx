"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  BarChart3, 
  MessageCircle, 
  Calendar,
  MapPin,
  Users,
  Trophy
} from 'lucide-react'
import { useCandidate } from '@/lib/hooks/api/useCandidates'
import { PolicyEvaluationDetail } from '@/components/features/policies/PolicyEvaluationDetail'
import { CommentSection } from '@/components/features/comments/CommentSection'
import { PolicyComparisonChart } from '@/components/features/policies/PolicyComparisonChart'
import { FeasibilityIndicator } from '@/components/features/policies/FeasibilityIndicator'
import { calculateAverageFeasibility, getStatusLabel, getInitials, formatDate } from '@/lib/utils'

interface CandidateDetailClientProps {
  candidateId: string
}

export function CandidateDetailClient({ candidateId }: CandidateDetailClientProps) {
  const router = useRouter()
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
  const [showPolicyDetail, setShowPolicyDetail] = useState(false)
  
  const { data: candidate, isLoading, error } = useCandidate(candidateId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <CandidateDetailSkeleton />
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            候補者の情報を読み込めませんでした。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const avgFeasibility = calculateAverageFeasibility(candidate.policies || [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">候補者詳細</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Candidate Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-3xl">{candidate.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{candidate.age}歳</span>
                      <span>•</span>
                      <span>{candidate.party}</span>
                      <span>•</span>
                      <Badge variant={candidate.status === 'incumbent' ? 'default' : 'secondary'}>
                        {getStatusLabel(candidate.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {candidate.slogan && (
                <blockquote className="border-l-4 border-primary pl-4 italic text-lg">
                  "{candidate.slogan}"
                </blockquote>
              )}

              {/* Election Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.prefecture}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.electionType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {candidate.electionDate ? formatDate(candidate.electionDate.toDate()) : '未定'}
                  </span>
                </div>
                {candidate.achievements && candidate.achievements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">実績 {candidate.achievements.length}件</span>
                  </div>
                )}
              </div>

              {/* Feasibility Score */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">平均実現可能性スコア</span>
                  <FeasibilityIndicator score={avgFeasibility} size="lg" showLabel />
                </div>
                <Progress value={avgFeasibility} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {candidate.policies?.length || 0}項目の公約から算出
                  {candidate.isAnalyzedByAI && ' (AI分析済み)'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="policies" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="policies">公約一覧</TabsTrigger>
              <TabsTrigger value="analysis">政策分析</TabsTrigger>
              <TabsTrigger value="achievements">実績</TabsTrigger>
              <TabsTrigger value="comparison">可視化</TabsTrigger>
            </TabsList>
            
            <TabsContent value="policies" className="space-y-4">
              {candidate.policies && candidate.policies.length > 0 ? (
                candidate.policies.map((policy) => (
                  <Card key={policy.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{policy.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {policy.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline">{policy.category}</Badge>
                          <FeasibilityIndicator score={policy.feasibilityScore} size="md" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Progress value={policy.feasibilityScore} className="flex-1 mr-4" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPolicy(policy)
                            setShowPolicyDetail(true)
                          }}
                        >
                          詳細を見る
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">公約情報がまだ登録されていません</p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>AI分析レポート</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.isAnalyzedByAI ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {avgFeasibility}%
                          </div>
                          <div className="text-sm text-muted-foreground">平均スコア</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {candidate.policies?.filter(p => p.feasibilityScore >= 80).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">高実現性政策</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {candidate.policies?.filter(p => p.impact === 'high').length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">高影響政策</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {candidate.policies?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">総政策数</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        この候補者の公約は最新のAI技術により詳細に分析されています。
                        各政策の実現可能性は技術的、政治的、財政的、時間軸の4つの観点から評価されています。
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      この候補者の公約はまだAI分析されていません。
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              {candidate.achievements && candidate.achievements.length > 0 ? (
                candidate.achievements.map((achievement, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <p>{achievement}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">実績情報がまだ登録されていません</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              {candidate.policies && candidate.policies.length > 0 ? (
                <PolicyComparisonChart 
                  policies={candidate.policies} 
                  title={`${candidate.name}の政策実現可能性`}
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">可視化する政策データがありません</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">アクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                他候補者と比較
              </Button>
              <Button className="w-full" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                議論に参加
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">統計情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">公約数</span>
                <span className="font-semibold">{candidate.policies?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">平均スコア</span>
                <span className="font-semibold">{avgFeasibility}%</span>
              </div>
              {candidate.achievements && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">実績数</span>
                  <span className="font-semibold">{candidate.achievements.length}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">最新のコメント</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection candidateId={candidateId} preview />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Policy Detail Modal */}
      <PolicyEvaluationDetail
        policy={selectedPolicy}
        open={showPolicyDetail}
        onOpenChange={setShowPolicyDetail}
      />
    </div>
  )
}

function CandidateDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}