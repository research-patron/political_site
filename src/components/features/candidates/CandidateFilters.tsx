"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import { CandidateFilters as CandidateFiltersType } from '@/types'

interface CandidateFiltersProps {
  filters: CandidateFiltersType
  onFiltersChange: (filters: CandidateFiltersType) => void
}

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

const electionTypes = [
  { value: '衆議院', label: '衆議院選挙' },
  { value: '参議院', label: '参議院選挙' },
  { value: '知事', label: '知事選挙' },
  { value: '市長', label: '市長選挙' },
  { value: '県議会', label: '県議会選挙' },
  { value: '市議会', label: '市議会選挙' },
]

const commonParties = [
  '自由民主党', '立憲民主党', '日本維新の会', '公明党', '国民民主党',
  '日本共産党', 'れいわ新選組', '社会民主党', 'NHK党', '無所属'
]

const statusOptions = [
  { value: 'incumbent', label: '現職' },
  { value: 'newcomer', label: '新人' },
  { value: 'former', label: '元職' },
]

export function CandidateFilters({ filters, onFiltersChange }: CandidateFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof CandidateFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const toggleParty = (party: string) => {
    const currentParties = filters.party || []
    const newParties = currentParties.includes(party)
      ? currentParties.filter(p => p !== party)
      : [...currentParties, party]
    
    updateFilter('party', newParties.length > 0 ? newParties : undefined)
  }

  const toggleStatus = (status: 'incumbent' | 'newcomer' | 'former') => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    updateFilter('status', newStatuses.length > 0 ? newStatuses : undefined)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  )

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  ).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                クリア
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '折りたたむ' : '展開'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">都道府県</label>
            <Select
              value={filters.prefecture || 'all'}
              onValueChange={(value) => updateFilter('prefecture', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {prefectures.map((pref) => (
                  <SelectItem key={pref} value={pref}>
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">選挙種別</label>
            <Select
              value={filters.electionType || 'all'}
              onValueChange={(value) => updateFilter('electionType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {electionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Political Parties */}
            <div>
              <label className="text-sm font-medium mb-3 block">政党・会派</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {commonParties.map((party) => (
                  <label
                    key={party}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.party?.includes(party) || false}
                      onCheckedChange={() => toggleParty(party)}
                    />
                    <span className="text-sm">{party}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-3 block">立候補者区分</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <label
                    key={status.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.status?.includes(status.value as any) || false}
                      onCheckedChange={() => toggleStatus(status.value as any)}
                    />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.prefecture && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.prefecture}
                  <X 
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('prefecture', undefined)}
                  />
                </Badge>
              )}
              {filters.electionType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {electionTypes.find(t => t.value === filters.electionType)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('electionType', undefined)}
                  />
                </Badge>
              )}
              {filters.party?.map((party) => (
                <Badge key={party} variant="secondary" className="flex items-center gap-1">
                  {party}
                  <X 
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleParty(party)}
                  />
                </Badge>
              ))}
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="flex items-center gap-1">
                  {statusOptions.find(s => s.value === status)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleStatus(status)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}