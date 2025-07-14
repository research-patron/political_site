"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart3, Users, Filter, TrendingUp } from 'lucide-react'
import { useCandidates } from '@/lib/hooks/api/useCandidates'
import { PolicyComparisonChart } from '@/components/features/policies/PolicyComparisonChart'
import { EvaluationRadarChart } from '@/components/features/policies/EvaluationRadarChart'
import { FeasibilityIndicator } from '@/components/features/policies/FeasibilityIndicator'
import { Candidate, Policy } from '@/types'
import { calculateAverageFeasibility } from '@/lib/utils'

export function ComparisonPageClient() {
  const [mounted, setMounted] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImpact, setSelectedImpact] = useState<string>('all')
  
  const { data: candidates = [], isLoading } = useCandidates({
    enabled: mounted
  })
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCandidateToggle = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const getFilteredPolicies = (): Policy[] => {
    const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id))
    const allPolicies = selectedCandidateData.flatMap(c => c.policies || [])
    
    return allPolicies.filter(policy => {
      if (selectedCategory !== 'all' && policy.category !== selectedCategory) return false
      if (selectedImpact !== 'all' && policy.impact !== selectedImpact) return false
      return true
    })
  }

  const getComparisonData = () => {
    const selectedCandidateData = candidates.filter(c => selectedCandidates.includes(c.id))
    
    return selectedCandidateData.map(candidate => ({
      candidate,
      avgFeasibility: calculateAverageFeasibility(candidate.policies || []),
      policyCount: candidate.policies?.length || 0,
      highImpactPolicies: candidate.policies?.filter(p => p.impact === 'high').length || 0
    }))
  }

  const categories = ['all', '経済政策', '社会保障', '教育', '環境', '外交・安全保障', 'その他']
  const impacts = ['all', 'high', 'medium', 'low']

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">候補者・政策比較</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  const filteredPolicies = getFilteredPolicies()
  const comparisonData = getComparisonData()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">候補者・政策比較</h1>
          <p className="text-muted-foreground">複数の候補者の政策を比較分析します</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Candidate Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                候補者選択
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={candidate.id}
                    checked={selectedCandidates.includes(candidate.id)}
                    onCheckedChange={() => handleCandidateToggle(candidate.id)}
                  />
                  <label
                    htmlFor={candidate.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {candidate.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {candidate.policies?.length || 0}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                フィルター
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">カテゴリ</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'すべて' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">影響度</label>
                <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {impacts.map((impact) => (
                      <SelectItem key={impact} value={impact}>
                        {impact === 'all' ? 'すべて' : 
                         impact === 'high' ? '高影響' :
                         impact === 'medium' ? '中影響' : '低影響'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                統計
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">選択候補者</span>
                <span className="font-semibold">{selectedCandidates.length}人</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">比較政策数</span>
                <span className="font-semibold">{filteredPolicies.length}件</span>
              </div>
              {filteredPolicies.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">平均スコア</span>
                  <span className="font-semibold">
                    {Math.round(filteredPolicies.reduce((sum, p) => sum + p.feasibilityScore, 0) / filteredPolicies.length)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedCandidates.length === 0 ? (
            <Alert>
              <AlertDescription>
                比較を開始するには、左側のパネルから候補者を選択してください。
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">概要</TabsTrigger>
                <TabsTrigger value="policies">政策比較</TabsTrigger>
                <TabsTrigger value="details">詳細分析</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Candidate Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>候補者概要</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {comparisonData.map(({ candidate, avgFeasibility, policyCount, highImpactPolicies }) => (
                        <div key={candidate.id} className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">{candidate.name}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">平均スコア</span>
                              <FeasibilityIndicator score={avgFeasibility} size="sm" />
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">公約数</span>
                              <span className="font-medium">{policyCount}件</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">高影響政策</span>
                              <span className="font-medium">{highImpactPolicies}件</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="policies" className="space-y-6">
                {filteredPolicies.length > 0 ? (
                  <PolicyComparisonChart 
                    policies={filteredPolicies} 
                    title="政策実現可能性比較"
                  />
                ) : (
                  <Alert>
                    <AlertDescription>
                      選択した条件に該当する政策がありません。フィルター設定を変更してください。
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {filteredPolicies.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredPolicies.slice(0, 4).map((policy) => (
                      <EvaluationRadarChart key={policy.id} policy={policy} />
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      詳細分析を表示するには政策を選択してください。
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}