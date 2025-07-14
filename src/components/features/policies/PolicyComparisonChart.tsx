"use client"

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Policy } from '@/types'

interface PolicyComparisonChartProps {
  policies: Policy[]
  title?: string
  className?: string
}

export function PolicyComparisonChart({ 
  policies, 
  title = "政策実現可能性比較",
  className 
}: PolicyComparisonChartProps) {
  const data = policies.map((policy) => ({
    name: policy.title.length > 15 ? policy.title.substring(0, 15) + '...' : policy.title,
    fullName: policy.title,
    score: policy.feasibilityScore,
    category: policy.category,
    impact: policy.impact
  }))

  const getBarColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#eab308'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <h4 className="font-semibold mb-2">{data.fullName}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>実現可能性:</span>
              <span className="font-bold">{data.score}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>カテゴリ:</span>
              <Badge variant="outline">{data.category}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>影響度:</span>
              <Badge variant={data.impact === 'high' ? 'default' : 'secondary'}>
                {data.impact === 'high' ? '高' : 
                 data.impact === 'medium' ? '中' : '低'}
              </Badge>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: '実現可能性 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-primary">
              {Math.round(data.reduce((sum, item) => sum + item.score, 0) / data.length)}%
            </div>
            <div className="text-xs text-muted-foreground">平均スコア</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {Math.max(...data.map(item => item.score))}%
            </div>
            <div className="text-xs text-muted-foreground">最高スコア</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-red-600">
              {Math.min(...data.map(item => item.score))}%
            </div>
            <div className="text-xs text-muted-foreground">最低スコア</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}