"use client"

import { cn } from '@/lib/utils'

interface FeasibilityIndicatorProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function FeasibilityIndicator({ 
  score, 
  size = 'md', 
  showLabel = false, 
  className 
}: FeasibilityIndicatorProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 border-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 border-orange-600 bg-orange-50'
    return 'text-red-600 border-red-600 bg-red-50'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '高実現性'
    if (score >= 60) return '中実現性'
    if (score >= 40) return '低実現性'
    return '実現困難'
  }

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full border-2 flex items-center justify-center font-bold',
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        {score}%
      </div>
      {showLabel && (
        <span className={cn(
          'font-medium',
          getScoreColor(score).split(' ')[0] // テキストカラーのみ適用
        )}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  )
}