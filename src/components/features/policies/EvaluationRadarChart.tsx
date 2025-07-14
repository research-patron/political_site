"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Policy } from '@/types'

interface EvaluationRadarChartProps {
  policy: Policy
  className?: string
}

export function EvaluationRadarChart({ policy, className }: EvaluationRadarChartProps) {
  const data = [
    {
      subject: '技術的実現性',
      score: policy.detailedEvaluation.technical.score,
      fullMark: 100,
    },
    {
      subject: '政治的実現性',
      score: policy.detailedEvaluation.political.score,
      fullMark: 100,
    },
    {
      subject: '財政的実現性',
      score: policy.detailedEvaluation.financial.score,
      fullMark: 100,
    },
    {
      subject: '時間軸実現性',
      score: policy.detailedEvaluation.timeline.score,
      fullMark: 100,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center text-lg">4次元評価レーダーチャート</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 12 }}
              className="text-xs"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="実現可能性"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="text-center mt-4">
          <div className="text-2xl font-bold text-primary">
            {policy.feasibilityScore}%
          </div>
          <div className="text-sm text-muted-foreground">
            総合実現可能性スコア
          </div>
        </div>
      </CardContent>
    </Card>
  )
}