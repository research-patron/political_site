"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { User, BarChart3, MessageCircle } from "lucide-react"
import { Candidate } from "@/types"
import { calculateAverageFeasibility, getStatusLabel, getInitials } from "@/lib/utils"

interface CandidateCardProps {
  candidate: Candidate
  onClick?: () => void
  showActions?: boolean
}

export function CandidateCard({ candidate, onClick, showActions = true }: CandidateCardProps) {
  const avgFeasibility = calculateAverageFeasibility(candidate.policies || [])
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${onClick ? 'hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {candidate.age}歳 | {candidate.party}
              </p>
              <p className="text-xs text-muted-foreground">
                {candidate.prefecture} {candidate.electionType}
              </p>
            </div>
          </div>
          <Badge 
            variant={candidate.status === 'incumbent' ? 'default' : 'secondary'}
            className="shrink-0"
          >
            {getStatusLabel(candidate.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {candidate.slogan && (
          <p className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
            "{candidate.slogan}"
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>平均実現可能性</span>
            <span className="font-semibold">{avgFeasibility}%</span>
          </div>
          <Progress value={avgFeasibility} className="h-2" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            公約 {candidate.policies?.length || 0}項目
          </Badge>
          {candidate.isAnalyzedByAI && (
            <Badge variant="secondary" className="text-xs">
              AI分析済
            </Badge>
          )}
          {candidate.achievements && candidate.achievements.length > 0 && (
            <Badge variant="outline" className="text-xs">
              実績 {candidate.achievements.length}件
            </Badge>
          )}
        </div>
        
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                // Navigate to candidate detail
              }}
            >
              <User className="h-4 w-4 mr-1" />
              詳細
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                // Navigate to comparison
              }}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              比較
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                // Navigate to comments
              }}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              議論
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}