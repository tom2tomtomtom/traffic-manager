import { PageHeader } from '@/components/layouts/page-header'
import { createClient } from '@/lib/supabase/server'
import { TranscriptsList } from '@/components/features/transcripts-list'

export default async function TranscriptsPage() {
  const supabase = await createClient()

  const { data: transcripts, error } = await supabase
    .from('transcripts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transcripts:', error)
  }

  return (
    <div>
      <PageHeader
        title="Transcripts"
        description="View all processed meeting transcripts and their extractions."
      />

      <div className="mt-8">
        <TranscriptsList initialTranscripts={transcripts || []} />
      </div>
    </div>
  )
}
