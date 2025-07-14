import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'

const CandidateList = dynamic(
  () => import('@/components/features/candidates/CandidateList').then(mod => ({ default: mod.CandidateList })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">候補者一覧を読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

export default function CandidatesPage() {
  return <CandidateList />
}