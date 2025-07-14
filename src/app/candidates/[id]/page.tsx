import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'

const CandidateDetailClient = dynamic(
  () => import('@/components/features/candidates/CandidateDetailClient').then(mod => ({ default: mod.CandidateDetailClient })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">候補者情報を読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

// Static params generation for export
export async function generateStaticParams() {
  // Return sample candidate IDs for static generation
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

interface CandidateDetailPageProps {
  params: {
    id: string
  }
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  return <CandidateDetailClient candidateId={params.id} />
}