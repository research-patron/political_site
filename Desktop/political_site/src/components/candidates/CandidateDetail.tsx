import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Info, Star, BookOpen, Users, BarChart3, TrendingUp } from 'lucide-react';
import { Candidate, Policy } from '@/types';

interface CandidateDetailProps {
  candidate: Candidate;
  onBack: () => void;
  onShowDetailModal: (policy: Policy) => void;
  onCloseDetailModal: () => void;
  showDetailModal: Policy | null;
}

export function CandidateDetail({ 
  candidate, 
  onBack, 
  onShowDetailModal, 
  onCloseDetailModal, 
  showDetailModal 
}: CandidateDetailProps) {
  const avgScore = Math.round(
    candidate.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / candidate.policies.length
  );

  const getPersonalImpact = (policy: Policy) => {
    const impacts = {
      high: { description: '家計に直接的な影響', monthlyAmount: 20000 },
      medium: { description: '中期的な生活改善', monthlyAmount: 8000 },
      low: { description: '長期的な社会影響', monthlyAmount: 3000 },
    };
    return impacts[policy.impact];
  };

  const EvaluationDetailModal = () => {
    if (!showDetailModal) return null;

    return (
      <Dialog open={!!showDetailModal} onOpenChange={onCloseDetailModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">評価詳細分析</DialogTitle>
            <p className="text-sm text-gray-600">{showDetailModal.title}</p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">総合実現可能性</span>
                <span className="text-2xl font-bold text-blue-600">{showDetailModal.feasibilityScore}%</span>
              </div>
              <div className="text-xs text-gray-600">
                技術的({showDetailModal.detailedEvaluation.technical.score}%) + 
                政治的({showDetailModal.detailedEvaluation.political.score}%) + 
                財政的({showDetailModal.detailedEvaluation.financial.score}%) + 
                期間({showDetailModal.detailedEvaluation.timeline.score}%)
              </div>
            </div>

            {/* Detailed Evaluations */}
            {Object.entries(showDetailModal.detailedEvaluation).map(([key, data]) => {
              const icons = {
                technical: <BookOpen className="w-4 h-4 mr-1" />,
                political: <Users className="w-4 h-4 mr-1" />,
                financial: <BarChart3 className="w-4 h-4 mr-1" />,
                timeline: <TrendingUp className="w-4 h-4 mr-1" />
              };

              const titles = {
                technical: '技術的実現性',
                political: '政治的実現性',
                financial: '財政的実現性',
                timeline: '実施期間'
              };

              const colors = {
                technical: '#3B82F6',
                political: '#10B981',
                financial: '#F59E0B',
                timeline: '#8B5CF6'
              };

              return (
                <div key={key} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm flex items-center">
                        {icons[key as keyof typeof icons]}
                        {titles[key as keyof typeof titles]}
                      </span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: colors[key as keyof typeof colors] }}
                      >
                        {data.score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${data.score}%`,
                          backgroundColor: colors[key as keyof typeof colors]
                        }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700">{data.summary}</p>
                  </div>
                  
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {data.report.substring(0, 300)}
                      {data.report.length > 300 && '...'}
                    </p>
                    
                    {data.searchKeywords && data.searchKeywords.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-2">検索キーワード：</p>
                        <div className="flex flex-wrap gap-1">
                          {data.searchKeywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {data.references && data.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-2">参考資料：</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {data.references.slice(0, 3).map((ref, idx) => (
                            <li key={idx}>• {ref}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
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
          <h1 className="text-xl font-bold">候補者詳細</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Candidate Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {candidate.name}
                  <span className="text-base text-gray-500">({candidate.age}歳)</span>
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <Badge variant="outline">{candidate.party}</Badge>
                  <Badge 
                    variant={candidate.status === 'incumbent' ? 'default' : 'secondary'}
                  >
                    {candidate.status === 'incumbent' ? '現職' : '新人'}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm italic">「{candidate.slogan}」</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{avgScore}%</div>
                <div className="text-xs text-gray-500">総合スコア</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2" />
              これまでの実績
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {candidate.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">政策分析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.policies.map((policy) => {
              const impact = getPersonalImpact(policy);
              
              return (
                <div key={policy.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{policy.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <Badge 
                        variant={policy.impact === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        影響度: {policy.impact === 'high' ? '高' : policy.impact === 'medium' ? '中' : '低'}
                      </Badge>
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-2xl font-bold text-primary">{policy.feasibilityScore}%</div>
                      <div className="text-xs text-gray-500">実現可能性</div>
                    </div>
                  </div>
                  
                  <Progress value={policy.feasibilityScore} className="mb-3" />
                  
                  {/* Personal Impact */}
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <h4 className="font-medium text-sm mb-1">あなたへの影響</h4>
                    <p className="text-sm text-gray-700">{impact.description}</p>
                    {impact.monthlyAmount && (
                      <p className="text-sm font-medium text-blue-700">
                        月額換算: 約{impact.monthlyAmount.toLocaleString()}円
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onShowDetailModal(policy)}
                    className="w-full"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    詳細分析を見る
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <EvaluationDetailModal />
    </div>
  );
}