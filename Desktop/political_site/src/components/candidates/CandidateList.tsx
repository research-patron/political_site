import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Users, BarChart3 } from 'lucide-react';
import { Candidate } from '@/types';

interface CandidateListProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedForComparison: string[];
  onToggleComparison: (candidateId: string) => void;
  onShowComparison: () => void;
}

export function CandidateList({ 
  candidates, 
  onSelectCandidate, 
  selectedForComparison,
  onToggleComparison,
  onShowComparison
}: CandidateListProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Comparison Button */}
      {selectedForComparison.length > 1 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">候補者比較</h3>
                <p className="text-sm text-gray-600">
                  {selectedForComparison.length}名が選択されています
                </p>
              </div>
              <Button onClick={onShowComparison} className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                比較する
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Cards */}
      <div className="space-y-4">
        {candidates.map((candidate) => {
          const avgScore = Math.round(
            candidate.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / candidate.policies.length
          );
          
          const isSelected = selectedForComparison.includes(candidate.id);
          const canSelect = selectedForComparison.length < 3 || isSelected;

          return (
            <Card 
              key={candidate.id} 
              className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{candidate.name}</CardTitle>
                      <span className="text-sm text-gray-500">({candidate.age}歳)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{candidate.party}</Badge>
                      <Badge 
                        variant={candidate.status === 'incumbent' ? 'default' : 'secondary'}
                      >
                        {candidate.status === 'incumbent' ? '現職' : '新人'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{candidate.slogan}</p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleComparison(candidate.id)}
                      disabled={!canSelect}
                      className="w-5 h-5 text-primary"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Overall Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">総合実現可能性</span>
                    <span className="text-lg font-bold text-primary">{avgScore}%</span>
                  </div>
                  <Progress value={avgScore} className="h-2" />
                </div>

                {/* Policy Categories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">主要政策分野</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(candidate.policies.map(p => p.category))).map(category => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category === 'economy' ? '経済' :
                         category === 'education' ? '教育' :
                         category === 'agriculture' ? '農業' :
                         category === 'labor' ? '労働' :
                         category === 'healthcare' ? '医療' :
                         category === 'environment' ? '環境' :
                         category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Top Policies Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">主要政策</h4>
                  <div className="space-y-2">
                    {candidate.policies.slice(0, 2).map(policy => (
                      <div key={policy.id} className="flex items-center justify-between text-sm">
                        <span className="flex-1 truncate">{policy.title}</span>
                        <Badge 
                          variant={policy.impact === 'high' ? 'default' : 'secondary'}
                          className="ml-2 text-xs"
                        >
                          {policy.feasibilityScore}%
                        </Badge>
                      </div>
                    ))}
                    {candidate.policies.length > 2 && (
                      <div className="text-xs text-gray-500">
                        他 {candidate.policies.length - 2} 件の政策
                      </div>
                    )}
                  </div>
                </div>

                {/* View Details Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onSelectCandidate(candidate)}
                >
                  詳細を見る
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">候補者比較機能</h4>
              <p className="text-sm text-blue-700">
                最大3名まで選択して政策を比較できます。チェックボックスで候補者を選択してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}