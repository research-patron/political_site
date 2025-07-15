"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Bot,
  Brain,
  Search,
  Clock
} from 'lucide-react'

interface AnalysisResult {
  id: string
  url: string
  candidateName?: string
  policies?: Policy[]
  summary?: string
  analyzer: 'gemini' | 'claude' | 'perplexity'
  timestamp: Date
  status: 'success' | 'error' | 'processing'
  error?: string
}

interface Policy {
  title: string
  description: string
  category: string
  feasibilityScore: number
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  source?: string
}

export function URLAnalyzer() {
  const [url, setUrl] = useState('')
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<'gemini' | 'claude' | 'perplexity'>('gemini')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState('')

  const analyzerOptions = [
    { value: 'gemini', label: 'Gemini 2.5 Flash', icon: Brain, description: 'Google AI - 高速分析' },
    { value: 'claude', label: 'Claude Sonnet 4', icon: Bot, description: 'Anthropic - 詳細分析' },
    { value: 'perplexity', label: 'Perplexity Sonar Pro', icon: Search, description: 'リアルタイム検索付き分析' }
  ]

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!isValidUrl(url)) {
      setError('有効なURLを入力してください')
      return
    }

    setError('')
    setIsAnalyzing(true)
    setProgress(0)
    setCurrentStep('URL解析を開始しています...')

    try {
      // Step 1: URL Scraping
      setProgress(20)
      setCurrentStep('ウェブページを解析中...')
      
      const scrapeResponse = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!scrapeResponse.ok) {
        throw new Error('ウェブページの解析に失敗しました')
      }

      const scrapedData = await scrapeResponse.json()
      
      // Step 2: AI Analysis
      setProgress(50)
      setCurrentStep(`${analyzerOptions.find(a => a.value === selectedAnalyzer)?.label}で政策分析中...`)

      const analysisResponse = await fetch('/api/analyze-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: scrapedData.content,
          url,
          analyzer: selectedAnalyzer
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('AI分析に失敗しました')
      }

      const analysisData = await analysisResponse.json()

      // Step 3: Complete
      setProgress(100)
      setCurrentStep('分析完了')

      const newResult: AnalysisResult = {
        id: Date.now().toString(),
        url,
        candidateName: analysisData.candidateName,
        policies: analysisData.policies,
        summary: analysisData.summary,
        analyzer: selectedAnalyzer,
        timestamp: new Date(),
        status: 'success'
      }

      setResults(prev => [newResult, ...prev])
      setUrl('')

    } catch (error: any) {
      setError(error.message)
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const getAnalyzerIcon = (analyzer: string) => {
    const option = analyzerOptions.find(a => a.value === analyzer)
    return option ? option.icon : Bot
  }

  const getAnalyzerLabel = (analyzer: string) => {
    const option = analyzerOptions.find(a => a.value === analyzer)
    return option ? option.label : analyzer
  }

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            URL分析
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">候補者サイトURL</label>
              <Input
                type="url"
                placeholder="https://example.com/candidate-policies"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">AI分析エンジン選択</label>
              <Select 
                value={selectedAnalyzer} 
                onValueChange={(value: 'gemini' | 'claude' | 'perplexity') => setSelectedAnalyzer(value)}
                disabled={isAnalyzing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {analyzerOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={!url || isAnalyzing || !isValidUrl(url)}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  AI分析を開始
                </>
              )}
            </Button>
          </div>

          {/* Progress Section */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{currentStep}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              分析結果 ({results.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => {
                const AnalyzerIcon = getAnalyzerIcon(result.analyzer)
                return (
                  <div key={result.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {result.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {result.candidateName && (
                          <p className="text-lg font-semibold">{result.candidateName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <AnalyzerIcon className="h-3 w-3" />
                          {getAnalyzerLabel(result.analyzer)}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.timestamp.toLocaleString('ja-JP')}
                        </Badge>
                      </div>
                    </div>

                    {result.summary && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm">{result.summary}</p>
                      </div>
                    )}

                    {result.policies && result.policies.length > 0 && (
                      <Tabs defaultValue="policies" className="w-full">
                        <TabsList>
                          <TabsTrigger value="policies">政策一覧 ({result.policies.length})</TabsTrigger>
                          <TabsTrigger value="analysis">分析詳細</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="policies" className="space-y-2">
                          {result.policies.slice(0, 3).map((policy, index) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{policy.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    policy.impact === 'high' ? 'destructive' :
                                    policy.impact === 'medium' ? 'default' : 'secondary'
                                  }>
                                    {policy.impact === 'high' ? '高影響' :
                                     policy.impact === 'medium' ? '中影響' : '低影響'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {policy.feasibilityScore}%
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>カテゴリ: {policy.category}</span>
                                <span>期間: {policy.timeframe}</span>
                              </div>
                            </div>
                          ))}
                          {result.policies.length > 3 && (
                            <p className="text-sm text-muted-foreground text-center">
                              他 {result.policies.length - 3} 件の政策
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="analysis">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                  {result.policies.length}
                                </div>
                                <div className="text-sm text-muted-foreground">政策数</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {Math.round(result.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / result.policies.length)}%
                                </div>
                                <div className="text-sm text-muted-foreground">平均実現可能性</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                  {result.policies.filter(p => p.impact === 'high').length}
                                </div>
                                <div className="text-sm text-muted-foreground">高影響政策</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {new Set(result.policies.map(p => p.category)).size}
                                </div>
                                <div className="text-sm text-muted-foreground">政策分野</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}