import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, PieChart, Target } from 'lucide-react';
import { Candidate, PolicyCategory } from '@/types';

interface AnalysisViewProps {
  candidates: Candidate[];
}

export function AnalysisView({ candidates }: AnalysisViewProps) {
  const categoryNames: Record<PolicyCategory, string> = {
    economy: '経済',
    education: '教育',
    agriculture: '農業',
    labor: '労働',
    healthcare: '医療',
    environment: '環境',
    social: '社会保障'
  };

  // Calculate overall statistics
  const totalPolicies = candidates.reduce((sum, c) => sum + c.policies.length, 0);
  const averageFeasibility = Math.round(
    candidates.reduce((acc, c) => {
      const candidateAvg = c.policies.reduce((sum, p) => sum + p.feasibilityScore, 0) / c.policies.length;
      return acc + candidateAvg;
    }, 0) / candidates.length
  );

  // Category analysis
  const categoryAnalysis = Object.keys(categoryNames).map(category => {
    const categoryPolicies = candidates.flatMap(c => 
      c.policies.filter(p => p.category === category)
    );
    
    const avgFeasibility = categoryPolicies.length > 0
      ? Math.round(categoryPolicies.reduce((sum, p) => sum + p.feasibilityScore, 0) / categoryPolicies.length)
      : 0;
    
    const highImpactCount = categoryPolicies.filter(p => p.impact === 'high').length;
    const totalCount = categoryPolicies.length;
    
    return {
      category: category as PolicyCategory,
      name: categoryNames[category as PolicyCategory],
      totalPolicies: totalCount,
      avgFeasibility,
      highImpactCount,
      highImpactRatio: totalCount > 0 ? Math.round((highImpactCount / totalCount) * 100) : 0
    };
  }).filter(item => item.totalPolicies > 0)
    .sort((a, b) => b.avgFeasibility - a.avgFeasibility);

  // Impact distribution
  const impactDistribution = {
    high: candidates.reduce((sum, c) => sum + c.policies.filter(p => p.impact === 'high').length, 0),
    medium: candidates.reduce((sum, c) => sum + c.policies.filter(p => p.impact === 'medium').length, 0),
    low: candidates.reduce((sum, c) => sum + c.policies.filter(p => p.impact === 'low').length, 0),
  };

  // Top performing policies
  const topPolicies = candidates
    .flatMap(c => c.policies.map(p => ({ ...p, candidateName: c.name, candidateColor: c.color })))
    .sort((a, b) => b.feasibilityScore - a.feasibilityScore)
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            全体統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalPolicies}</div>
              <div className="text-sm text-blue-700">総政策数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{averageFeasibility}%</div>
              <div className="text-sm text-green-700">平均実現可能性</div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">全体実現可能性</h4>
            <Progress value={averageFeasibility} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            分野別分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryAnalysis.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.totalPolicies}件
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      高影響度 {item.highImpactRatio}%
                    </span>
                    <span className="font-bold text-primary">{item.avgFeasibility}%</span>
                  </div>
                </div>
                <Progress value={item.avgFeasibility} className="h-2" />
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>政策数: {item.totalPolicies}件</span>
                  <span>高影響度: {item.highImpactCount}件</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Target className="w-5 h-5 mr-2" />
            影響度分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  高影響度
                </span>
                <span className="font-bold">{impactDistribution.high}件</span>
              </div>
              <Progress 
                value={(impactDistribution.high / totalPolicies) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  中影響度
                </span>
                <span className="font-bold">{impactDistribution.medium}件</span>
              </div>
              <Progress 
                value={(impactDistribution.medium / totalPolicies) * 100} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  低影響度
                </span>
                <span className="font-bold">{impactDistribution.low}件</span>
              </div>
              <Progress 
                value={(impactDistribution.low / totalPolicies) * 100} 
                className="h-2" 
              />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-lg font-bold text-red-600">
                  {Math.round((impactDistribution.high / totalPolicies) * 100)}%
                </div>
                <div className="text-gray-600">高影響度</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {Math.round((impactDistribution.medium / totalPolicies) * 100)}%
                </div>
                <div className="text-gray-600">中影響度</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {Math.round((impactDistribution.low / totalPolicies) * 100)}%
                </div>
                <div className="text-gray-600">低影響度</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            実現可能性トップ5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                    <Badge 
                      variant={policy.impact === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {categoryNames[policy.category as PolicyCategory]}
                    </Badge>
                    <Badge 
                      variant={policy.impact === 'high' ? 'destructive' : policy.impact === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {policy.impact === 'high' ? '高影響度' : policy.impact === 'medium' ? '中影響度' : '低影響度'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{policy.feasibilityScore}%</div>
                  <div className="text-xs text-gray-500">実現可能性</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">分析サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700">
            <p>
              <strong>最も実現可能性の高い分野:</strong> {categoryAnalysis[0]?.name} ({categoryAnalysis[0]?.avgFeasibility}%)
            </p>
            <p>
              <strong>政策数が最も多い分野:</strong> {categoryAnalysis.sort((a, b) => b.totalPolicies - a.totalPolicies)[0]?.name} ({categoryAnalysis.sort((a, b) => b.totalPolicies - a.totalPolicies)[0]?.totalPolicies}件)
            </p>
            <p>
              <strong>高影響度政策の割合:</strong> {Math.round((impactDistribution.high / totalPolicies) * 100)}% ({impactDistribution.high}件/{totalPolicies}件)
            </p>
            <div className="pt-2 border-t border-blue-200">
              <p>
                各候補者の政策を多角的に分析し、実現可能性と影響度の観点から評価しています。
                詳細な比較は候補者比較機能をご利用ください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}