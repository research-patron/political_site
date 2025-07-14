import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { PolicyComparisonChart } from '@/components/features/policies/PolicyComparisonChart'
import { FeasibilityIndicator } from '@/components/features/policies/FeasibilityIndicator'

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
          <StatsCard
            title="登録候補者数"
            value="24"
            change="+3"
            icon={Users}
            description="今週新規登録"
          />
        </Suspense>
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard
            title="分析済み政策"
            value="156"
            change="+12"
            icon={CheckCircle}
            description="今週AI分析完了"
          />
        </Suspense>
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard
            title="平均実現可能性"
            value="72%"
            change="+2.3%"
            icon={TrendingUp}
            description="前月比改善"
          />
        </Suspense>
        <Suspense fallback={<StatsCardSkeleton />}>
          <StatsCard
            title="ユーザー評価"
            value="4.8"
            change="+0.2"
            icon={Star}
            description="5点満点中"
          />
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              最新情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">新候補者が登録されました</p>
                  <p className="text-xs text-muted-foreground">2時間前</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">AI分析が完了しました</p>
                  <p className="text-xs text-muted-foreground">5時間前</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">新しい政策が追加されました</p>
                  <p className="text-xs text-muted-foreground">1日前</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">システム更新が完了しました</p>
                  <p className="text-xs text-muted-foreground">2日前</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                すべて見る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Candidates */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">注目の候補者</h2>
          <Button variant="outline" asChild>
            <Link href="/candidates">
              すべて見る
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        
        <Suspense fallback={<CandidateGridSkeleton />}>
          <FeaturedCandidates />
        </Suspense>
      </div>

      {/* Sample Visualization */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">政策分析サンプル</h2>
          <Button variant="outline" asChild>
            <Link href="/comparison">
              詳細な比較を見る
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        
        <Suspense fallback={<ChartSkeleton />}>
          <SampleVisualization />
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
          <Badge variant="secondary" className="text-xs">
            {change}
          </Badge>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedCandidates() {
  // Mock data - replace with actual data fetching
  const mockCandidates = [
    {
      id: '1',
      name: '田中太郎',
      party: '未来党',
      prefecture: '東京都',
      age: 45,
      status: 'candidate' as const,
      slogan: '未来への架け橋を',
      policies: [
        { id: '1', title: 'デジタル教育推進', feasibilityScore: 85 },
        { id: '2', title: '再生可能エネルギー導入', feasibilityScore: 78 },
        { id: '3', title: '子育て支援拡充', feasibilityScore: 92 },
      ]
    },
    {
      id: '2',
      name: '佐藤花子',
      party: '希望党',
      prefecture: '大阪府',
      age: 52,
      status: 'incumbent' as const,
      slogan: '実現する政治を',
      policies: [
        { id: '4', title: '高齢者支援強化', feasibilityScore: 88 },
        { id: '5', title: '中小企業支援', feasibilityScore: 75 },
      ]
    },
    {
      id: '3',
      name: '山田次郎',
      party: '革新党',
      prefecture: '愛知県',
      age: 38,
      status: 'candidate' as const,
      slogan: '変革の時代へ',
      policies: [
        { id: '6', title: 'スマートシティ構想', feasibilityScore: 72 },
        { id: '7', title: '労働環境改善', feasibilityScore: 89 },
        { id: '8', title: '観光産業振興', feasibilityScore: 81 },
      ]
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockCandidates.map((candidate) => (
        <CandidateCard 
          key={candidate.id} 
          candidate={candidate as any}
          showActions={false}
        />
      ))}
    </div>
  )
}

function SampleVisualization() {
  // Mock policy data for demonstration
  const samplePolicies = [
    {
      id: '1',
      title: 'デジタル教育推進',
      category: '教育',
      feasibilityScore: 85,
      impact: 'high' as const,
      detailedEvaluation: {
        technical: { score: 88, summary: '技術的に実現可能' },
        political: { score: 78, summary: '政治的合意が必要' },
        financial: { score: 82, summary: '予算確保は可能' },
        timeline: { score: 92, summary: '短期間で実現可能' }
      }
    },
    {
      id: '2',
      title: '再生可能エネルギー',
      category: '環境',
      feasibilityScore: 78,
      impact: 'high' as const,
      detailedEvaluation: {
        technical: { score: 85, summary: '技術は確立済み' },
        political: { score: 65, summary: '業界調整が必要' },
        financial: { score: 70, summary: '大規模投資が必要' },
        timeline: { score: 85, summary: '中期的に実現可能' }
      }
    },
    {
      id: '3',
      title: '子育て支援拡充',
      category: '社会保障',
      feasibilityScore: 92,
      impact: 'medium' as const,
      detailedEvaluation: {
        technical: { score: 95, summary: '既存制度の拡充' },
        political: { score: 90, summary: '広範な支持が得られる' },
        financial: { score: 88, summary: '段階的予算増可能' },
        timeline: { score: 95, summary: '即座に実行可能' }
      }
    },
    {
      id: '4',
      title: 'スマートシティ構想',
      category: '都市開発',
      feasibilityScore: 72,
      impact: 'high' as const,
      detailedEvaluation: {
        technical: { score: 80, summary: '最新技術が必要' },
        political: { score: 68, summary: '調整が複雑' },
        financial: { score: 65, summary: '大規模予算が必要' },
        timeline: { score: 75, summary: '長期プロジェクト' }
      }
    }
  ]

  return (
    <PolicyComparisonChart 
      policies={samplePolicies as any}
      title="政策実現可能性サンプル分析"
    />
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

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}