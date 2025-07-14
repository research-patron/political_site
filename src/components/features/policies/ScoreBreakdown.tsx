"use client"

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Policy } from '@/types'
import { getEvaluationLabel } from '@/lib/utils'

interface ScoreBreakdownProps {
  policy: Policy
  className?: string
}

export function ScoreBreakdown({ policy, className }: ScoreBreakdownProps) {
  const evaluationKeys = ['technical', 'political', 'financial', 'timeline'] as const

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '高'
    if (score >= 60) return '中'
    if (score >= 40) return '低'
    return '困難'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">詳細スコア内訳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 総合スコア */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-3xl font-bold text-primary mb-2">
            {policy.feasibilityScore}%
          </div>
          <div className="text-sm text-muted-foreground">
            総合実現可能性スコア
          </div>
          <Progress value={policy.feasibilityScore} className="mt-3 h-3" />
        </div>

        {/* 各評価軸のスコア */}
        <div className="space-y-4">
          {evaluationKeys.map((key) => {
            const detail = policy.detailedEvaluation[key]
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">
                    {getEvaluationLabel(key)}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={getScoreBadgeVariant(detail.score)}>
                      {getScoreLabel(detail.score)}
                    </Badge>
                    <span className={`text-lg font-bold ${getScoreColor(detail.score)}`}>
                      {detail.score}%
                    </span>
                  </div>
                </div>
                <Progress value={detail.score} className="h-2" />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {detail.summary}
                </p>
              </div>
            )
          })}
        </div>

        {/* 影響度と分析情報 */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">政策影響度</span>
            <Badge variant={policy.impact === 'high' ? 'default' : 'secondary'}>
              {policy.impact === 'high' ? '高影響' : 
               policy.impact === 'medium' ? '中影響' : '低影響'}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">分析方法</span>
            <span className="font-medium">
              {policy.analyzedBy === 'gemini' ? 'Gemini AI' :
               policy.analyzedBy === 'claude' ? 'Claude AI' :
               policy.analyzedBy === 'perplexity' ? 'Perplexity AI' :
               '手動分析'}
            </span>
          </div>
          {policy.analyzedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">分析日時</span>
              <span className="font-medium">
                {new Date(policy.analyzedAt.seconds * 1000).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}