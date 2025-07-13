import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Star, TrendingUp, Users } from 'lucide-react';
import { Candidate } from '@/types';

interface HomeViewProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
}

export function HomeView({ candidates, onSelectCandidate }: HomeViewProps) {
  const topPolicies = candidates
    .flatMap(c => c.policies.map(p => ({ ...p, candidateName: c.name, candidateColor: c.color })))
    .sort((a, b) => b.feasibilityScore - a.feasibilityScore)
    .slice(0, 3);

  const averageFeasibility = Math.round(
    candidates.reduce((acc, c) => 
      acc + c.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / c.policies.length, 0
    ) / candidates.length
  );

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            山形県参議院選挙 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            候補者の公約を客観的に評価・分析し、あなたの投票判断をサポートします。
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{candidates.length}</div>
              <div className="text-xs text-gray-500">候補者</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {candidates.reduce((acc, c) => acc + c.policies.length, 0)}
              </div>
              <div className="text-xs text-gray-500">政策分析</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2" />
            候補者一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {candidates.map((candidate) => {
            const avgScore = Math.round(
              candidate.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / candidate.policies.length
            );
            
            return (
              <div
                key={candidate.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onSelectCandidate(candidate)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{candidate.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {candidate.party}
                    </Badge>
                    <Badge 
                      variant={candidate.status === 'incumbent' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {candidate.status === 'incumbent' ? '現職' : '新人'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{candidate.slogan}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={avgScore} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{avgScore}%</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            実現可能性の高い政策
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topPolicies.map((policy, index) => (
            <div key={policy.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: policy.candidateColor || '#3B82F6' }}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{policy.title}</h4>
                <p className="text-xs text-gray-600">{policy.candidateName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={policy.feasibilityScore} className="flex-1 h-2" />
                  <span className="text-xs font-medium">{policy.feasibilityScore}%</span>
                </div>
              </div>
              <Badge 
                variant={policy.impact === 'high' ? 'default' : policy.impact === 'medium' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {policy.impact === 'high' ? '高' : policy.impact === 'medium' ? '中' : '低'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">全体統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{averageFeasibility}%</div>
            <p className="text-sm text-gray-600">平均実現可能性スコア</p>
            <Progress value={averageFeasibility} className="mt-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}