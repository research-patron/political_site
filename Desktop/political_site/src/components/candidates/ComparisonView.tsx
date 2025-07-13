import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, Users } from 'lucide-react';
import { Candidate, PolicyCategory } from '@/types';

interface ComparisonViewProps {
  candidates: Candidate[];
  onBack: () => void;
}

export function ComparisonView({ candidates, onBack }: ComparisonViewProps) {
  if (candidates.length === 0) {
    return (
      <div className="p-4 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">比較する候補者が選択されていません</h2>
        <p className="text-gray-600 mb-4">候補者リストから比較したい候補者を選択してください。</p>
        <Button onClick={onBack}>候補者リストに戻る</Button>
      </div>
    );
  }

  // Get all unique policy categories
  const allCategories = Array.from(
    new Set(candidates.flatMap(c => c.policies.map(p => p.category)))
  ) as PolicyCategory[];

  const categoryNames: Record<PolicyCategory, string> = {
    economy: '経済',
    education: '教育',
    agriculture: '農業',
    labor: '労働',
    healthcare: '医療',
    environment: '環境',
    social: '社会保障'
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 -mt-4">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">候補者比較</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              総合実現可能性スコア
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.map((candidate) => {
                const avgScore = Math.round(
                  candidate.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / candidate.policies.length
                );
                
                return (
                  <div key={candidate.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{candidate.name}</span>
                        <Badge variant="outline" className="text-xs">{candidate.party}</Badge>
                      </div>
                      <span className="text-lg font-bold text-primary">{avgScore}%</span>
                    </div>
                    <Progress value={avgScore} className="h-3" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category-wise Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">分野別比較</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {allCategories.map((category) => {
                const categoryPolicies = candidates.map(candidate => {
                  const policy = candidate.policies.find(p => p.category === category);
                  return {
                    candidate,
                    policy,
                    score: policy?.feasibilityScore || 0
                  };
                });

                return (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-base border-b pb-1">
                      {categoryNames[category]}
                    </h3>
                    <div className="space-y-3">
                      {categoryPolicies.map(({ candidate, policy, score }) => (
                        <div key={candidate.id} className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{candidate.name}</span>
                                <Badge 
                                  variant={policy?.impact === 'high' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {score}%
                                </Badge>
                              </div>
                              {policy ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-800 mb-1">
                                    {policy.title}
                                  </p>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {policy.description}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  この分野の政策はありません
                                </p>
                              )}
                            </div>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Policy Count Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">政策数比較</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-semibold">{candidate.name}</span>
                    <div className="text-xs text-gray-600 mt-1">
                      高影響度: {candidate.policies.filter(p => p.impact === 'high').length}件 |{' '}
                      中影響度: {candidate.policies.filter(p => p.impact === 'medium').length}件 |{' '}
                      低影響度: {candidate.policies.filter(p => p.impact === 'low').length}件
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {candidate.policies.length}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">比較サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {(() => {
                const highestScore = Math.max(...candidates.map(c => 
                  Math.round(c.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / c.policies.length)
                ));
                const topCandidate = candidates.find(c => 
                  Math.round(c.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / c.policies.length) === highestScore
                );
                
                const mostPolicies = Math.max(...candidates.map(c => c.policies.length));
                const policyLeader = candidates.find(c => c.policies.length === mostPolicies);
                
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-900">最高実現可能性:</span>
                      <span className="text-blue-700">
                        {topCandidate?.name} ({highestScore}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-900">最多政策数:</span>
                      <span className="text-blue-700">
                        {policyLeader?.name} ({mostPolicies}件)
                      </span>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-blue-700">
                        各候補者の政策を詳しく比較して、あなたの価値観に最も合う候補者を見つけましょう。
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}