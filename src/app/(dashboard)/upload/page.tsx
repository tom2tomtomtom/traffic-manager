import { PageHeader } from '@/components/layouts/page-header'
import { TranscriptUpload } from '@/components/features/transcript-upload'

export default function UploadPage() {
  return (
    <div>
      <PageHeader
        title="Upload Transcript"
        description="Paste your WIP meeting transcript to extract projects, assignments, and capacity data."
      />

      <div className="mt-8">
        <TranscriptUpload />
      </div>
    </div>
  )
}
