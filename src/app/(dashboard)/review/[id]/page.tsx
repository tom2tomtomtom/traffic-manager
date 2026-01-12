import { PageHeader } from '@/components/layouts/page-header'
import { ExtractionReview } from '@/components/features/extraction-review'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the transcript with extracted data
  const { data: transcript, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !transcript) {
    notFound()
  }

  return (
    <div>
      <PageHeader
        title="Review Extraction"
        description={`Review extracted data from ${
          transcript.meeting_type?.toUpperCase() || 'WIP'
        } meeting on ${new Date(transcript.meeting_date).toLocaleDateString()}`}
      />

      <div className="mt-8">
        <ExtractionReview transcript={transcript} />
      </div>
    </div>
  )
}
