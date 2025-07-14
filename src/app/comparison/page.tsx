import dynamic from 'next/dynamic'

const ComparisonPageClient = dynamic(
  () => import('@/components/features/comparison/ComparisonPageClient').then(mod => ({ default: mod.ComparisonPageClient })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-8 bg-primary rounded animate-pulse" />
          <h1 className="text-3xl font-bold">候補者・政策比較</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    )
  }
)

export default function ComparisonPage() {
  return <ComparisonPageClient />
}