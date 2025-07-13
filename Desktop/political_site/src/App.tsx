import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Users, BarChart3, MessageCircle } from 'lucide-react';
import { Candidate, AppState } from '@/types';
import { mockCandidates } from '@/data/candidates';
import { CandidateList } from '@/components/candidates/CandidateList';
import { CandidateDetail } from '@/components/candidates/CandidateDetail';
import { ComparisonView } from '@/components/candidates/ComparisonView';
import { AnalysisView } from '@/components/analysis/AnalysisView';
import { HomeView } from '@/components/layout/HomeView';

function App() {
  const [appState, setAppState] = useState<AppState>({
    activeTab: 'home',
    selectedCandidate: null,
    showComparison: false,
    selectedCandidatesForComparison: [],
    comments: {},
    showDetailModal: null
  });

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const selectCandidate = (candidate: Candidate) => {
    updateAppState({ 
      selectedCandidate: candidate, 
      activeTab: 'candidates' 
    });
  };

  const toggleCandidateForComparison = (candidateId: string) => {
    const selected = appState.selectedCandidatesForComparison;
    if (selected.includes(candidateId)) {
      updateAppState({
        selectedCandidatesForComparison: selected.filter(id => id !== candidateId)
      });
    } else if (selected.length < 3) {
      updateAppState({
        selectedCandidatesForComparison: [...selected, candidateId]
      });
    }
  };

  const renderContent = () => {
    if (appState.selectedCandidate) {
      return (
        <CandidateDetail
          candidate={appState.selectedCandidate}
          onBack={() => updateAppState({ selectedCandidate: null })}
          onShowDetailModal={(policy) => updateAppState({ showDetailModal: policy })}
          onCloseDetailModal={() => updateAppState({ showDetailModal: null })}
          showDetailModal={appState.showDetailModal}
        />
      );
    }

    if (appState.showComparison) {
      const selectedCandidates = mockCandidates.filter(c => 
        appState.selectedCandidatesForComparison.includes(c.id)
      );
      return (
        <ComparisonView
          candidates={selectedCandidates}
          onBack={() => updateAppState({ showComparison: false })}
        />
      );
    }

    switch (appState.activeTab) {
      case 'home':
        return (
          <HomeView
            candidates={mockCandidates}
            onSelectCandidate={selectCandidate}
          />
        );
      case 'candidates':
        return (
          <CandidateList
            candidates={mockCandidates}
            onSelectCandidate={selectCandidate}
            selectedForComparison={appState.selectedCandidatesForComparison}
            onToggleComparison={toggleCandidateForComparison}
            onShowComparison={() => updateAppState({ showComparison: true })}
          />
        );
      case 'analysis':
        return <AnalysisView candidates={mockCandidates} />;
      case 'discussion':
        return (
          <div className="p-6 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">議論・コメント機能</h2>
            <p className="text-gray-600">この機能は開発中です。</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <h1 className="text-xl font-bold text-center">政治家評価プラットフォーム</h1>
          <p className="text-center text-sm opacity-90 mt-1">山形県参議院選挙 2025</p>
        </div>

        {/* Main Content */}
        <div className="pb-16">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <Tabs 
          value={appState.activeTab} 
          onValueChange={(value) => updateAppState({ 
            activeTab: value, 
            selectedCandidate: null, 
            showComparison: false 
          })}
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md"
        >
          <TabsList className="w-full h-16 bg-white border-t border-gray-200 rounded-none">
            <TabsTrigger 
              value="home" 
              className="flex-1 flex flex-col items-center gap-1 data-[state=active]:bg-primary/10"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">ホーム</span>
            </TabsTrigger>
            <TabsTrigger 
              value="candidates" 
              className="flex-1 flex flex-col items-center gap-1 data-[state=active]:bg-primary/10"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">候補者</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex-1 flex flex-col items-center gap-1 data-[state=active]:bg-primary/10"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">分析</span>
            </TabsTrigger>
            <TabsTrigger 
              value="discussion" 
              className="flex-1 flex flex-col items-center gap-1 data-[state=active]:bg-primary/10"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">議論</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

export default App;