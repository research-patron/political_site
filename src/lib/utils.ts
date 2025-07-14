import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分前`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}時間前`
  } else {
    return `${Math.floor(diffInSeconds / 86400)}日前`
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateAverageFeasibility(policies: Array<{ feasibilityScore: number }>): number {
  if (policies.length === 0) return 0
  const sum = policies.reduce((acc, policy) => acc + policy.feasibilityScore, 0)
  return Math.round(sum / policies.length)
}

export function getStatusLabel(status: 'incumbent' | 'newcomer' | 'former'): string {
  switch (status) {
    case 'incumbent':
      return '現職'
    case 'newcomer':
      return '新人'
    case 'former':
      return '元職'
    default:
      return '未設定'
  }
}

export function getEvaluationLabel(key: string): string {
  switch (key) {
    case 'technical':
      return '技術的実現性'
    case 'political':
      return '政治的実現性'
    case 'financial':
      return '財政的実現性'
    case 'timeline':
      return '実施期間'
    default:
      return key
  }
}