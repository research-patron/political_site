"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Search, BookOpen } from "lucide-react"
import { Policy } from "@/types"
import { getEvaluationLabel } from "@/lib/utils"
import { EvaluationRadarChart } from "./EvaluationRadarChart"
import { ScoreBreakdown } from "./ScoreBreakdown"

interface PolicyEvaluationDetailProps {
  policy: Policy | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PolicyEvaluationDetail({ policy, open, onOpenChange }: PolicyEvaluationDetailProps) {
  if (!policy) return null

  const evaluationKeys = ['technical', 'political', 'financial', 'timeline'] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{policy.title}</DialogTitle>
          <DialogDescription>
            詳細な政策評価レポート
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-6">
          {/* 可視化セクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EvaluationRadarChart policy={policy} />
            <ScoreBreakdown policy={policy} />
          </div>

          {/* 政策説明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">政策概要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{policy.description}</p>
            </CardContent>
          </Card>
          
          {/* タブで各評価軸を表示 */}
          <Tabs defaultValue="technical" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {evaluationKeys.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {getEvaluationLabel(key)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {evaluationKeys.map((key) => {
              const detail = policy.detailedEvaluation[key]
              return (
                <TabsContent key={key} value={key} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {getEvaluationLabel(key)}評価
                        </CardTitle>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-primary">
                            {detail.score}%
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={detail.score} className="h-3" />
                      
                      {/* 要約 */}
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">評価要約</h4>
                        <p className="text-sm">{detail.summary}</p>
                      </div>
                      
                      {/* 詳細レポート */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          詳細分析
                        </h4>
                        <div className="bg-background border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {detail.report}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 参考資料 */}
                      {detail.references && detail.references.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            参考資料
                          </h4>
                          <div className="space-y-2">
                            {detail.references.map((ref, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{ref}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 検索キーワード */}
                      {detail.searchKeywords && detail.searchKeywords.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            関連検索キーワード
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {detail.searchKeywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>

          {/* 分析メタデータ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分析情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">分析方法:</span>
                  <span className="ml-2 font-medium">
                    {policy.analyzedBy === 'gemini' ? 'Gemini AI' :
                     policy.analyzedBy === 'claude' ? 'Claude AI' :
                     policy.analyzedBy === 'perplexity' ? 'Perplexity AI' :
                     '手動分析'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">分析日時:</span>
                  <span className="ml-2 font-medium">
                    {policy.analyzedAt ? 
                      new Date(policy.analyzedAt.seconds * 1000).toLocaleDateString('ja-JP') : 
                      '不明'
                    }
                  </span>
                </div>
              </div>
              {policy.sourceUrl && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(policy.sourceUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    元の資料を見る
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}