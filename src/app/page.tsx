"use client"

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Star, 
  ArrowRight,
  Activity,
  Calendar,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { CandidateCard } from '@/components/features/candidates/CandidateCard'
import { useCandidates, useCandidatesStats } from '@/lib/hooks/api/useCandidates'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          政治家評価プラットフォーム
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          AI技術による4次元政策評価で、候補者の公約を客観的に分析。
          技術的・政治的・財政的・時間軸の観点から実現可能性を評価します。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/candidates">
              <Users className="h-5 w-5 mr-2" />
              候補者を見る
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/comparison">
              <BarChart3 className="h-5 w-5 mr-2" />
              政策を比較する
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsOverview />
        </Suspense>
      </div>

      {/* Featured Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* 4次元評価システム説明 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              4次元政策評価システム
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              最新のAI技術を活用し、政策を4つの観点から多角的に評価します。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">技</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">技術的実現性</h4>
                    <p className="text-sm text-muted-foreground">
                      技術的な実装可能性
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">政</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">政治的実現性</h4>
                    <p className="text-sm text-muted-foreground">
                      政治的合意の可能性
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-600">財</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">財政的実現性</h4>
                    <p className="text-sm text-muted-foreground">
                      予算・財源の確保可能性
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">時</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">時間軸実現性</h4>
                    <p className="text-sm text-muted-foreground">
                      実現までの期間の妥当性
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" asChild>
                <Link href="/about">
                  詳しく見る
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              はじめに
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">候補者情報の登録</p>
                  <p className="text-xs text-muted-foreground">URLを共有してAI分析を開始</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">4次元評価の確認</p>
                  <p className="text-xs text-muted-foreground">技術・政治・財政・時間軸で分析</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">候補者の比較検討</p>
                  <p className="text-xs text-muted-foreground">可視化データで客観的判断</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/candidates">
                  候補者を見る
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Candidates */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">登録候補者</h2>
          <Button variant="outline" asChild>
            <Link href="/candidates">
              すべて見る
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        
        <Suspense fallback={<CandidateGridSkeleton />}>
          <RecentCandidates />
        </Suspense>
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

function StatsCard({ title, value, change, icon: Icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {change && (
            <Badge variant="secondary" className="text-xs">
              {change}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsOverview() {
  const { data: stats, isLoading } = useCandidatesStats()
  
  if (isLoading) {
    return (
      <>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </>
    )
  }

  return (
    <>
      <StatsCard
        title="登録候補者数"
        value={stats?.total.toString() || "0"}
        change=""
        icon={Users}
        description="現在登録中"
      />
      <StatsCard
        title="分析済み政策"
        value={stats?.totalPolicies.toString() || "0"}
        change=""
        icon={CheckCircle}
        description="AI分析完了"
      />
      <StatsCard
        title="平均実現可能性"
        value={stats?.avgFeasibilityScore ? `${stats.avgFeasibilityScore}%` : "0%"}
        change=""
        icon={TrendingUp}
        description="全候補者平均"
      />
      <StatsCard
        title="都道府県数"
        value={stats?.byPrefecture ? Object.keys(stats.byPrefecture).length.toString() : "0"}
        change=""
        icon={Star}
        description="登録エリア"
      />
    </>
  )
}

function RecentCandidates() {
  const { data: candidates, isLoading } = useCandidates({ enabled: true })

  if (isLoading) {
    return <CandidateGridSkeleton />
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <Users className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">候補者が登録されていません</h3>
            <p className="text-muted-foreground mt-2">
              現在、候補者の情報が登録されていません。<br />
              URLを共有してAI分析を開始してください。
            </p>
          </div>
          <Button asChild>
            <Link href="/candidates">
              候補者を登録する
            </Link>
          </Button>
        </div>
      </Card>
    )
  }

  // Show up to 3 most recent candidates
  const recentCandidates = candidates.slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recentCandidates.map((candidate) => (
        <CandidateCard 
          key={candidate.id} 
          candidate={candidate}
          showActions={false}
        />
      ))}
    </div>
  )
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function CandidateGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}