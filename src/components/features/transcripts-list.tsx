'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Calendar, TrendingUp, Trash2, X } from 'lucide-react'
import { ConfidenceBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Transcript {
  id: string
  meeting_date: string
  meeting_type: string | null
  raw_text: string | null
  extraction_confidence: number | null
  approved: boolean | null
  created_at: string
  extracted_data: {
    projects?: unknown[]
    assignments?: unknown[]
  } | null
}

interface TranscriptsListProps {
  initialTranscripts: Transcript[]
}

export function TranscriptsList({ initialTranscripts }: TranscriptsListProps) {
  const [transcripts, setTranscripts] = useState(initialTranscripts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete(id)

    // Show warning toast with undo action
    toast.warning(
      'Are you sure you want to delete this transcript? This cannot be undone.',
      {
        label: 'Delete Anyway',
        onClick: () => confirmDeleteTranscript(id),
      }
    )
  }

  const confirmDeleteTranscript = async (id: string) => {
    setDeletingId(id)
    setConfirmDelete(null)

    try {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      // Remove from local state
      setTranscripts((prev) => prev.filter((t) => t.id !== id))
      toast.success('Transcript deleted')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete transcript')
    } finally {
      setDeletingId(null)
    }
  }

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete(null)
  }

  if (transcripts.length === 0) {
    return (
      <div className="bg-black-card border-2 border-border-subtle p-8 text-center">
        <FileText className="w-12 h-12 text-white-dim mx-auto mb-4" />
        <p className="text-white-muted">No transcripts yet.</p>
        <Link
          href="/upload"
          className="text-orange-accent text-sm uppercase mt-2 inline-block hover:underline"
        >
          Upload your first transcript
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transcripts.map((transcript) => {
        const extracted = transcript.extracted_data
        const isDeleting = deletingId === transcript.id
        const isConfirming = confirmDelete === transcript.id

        return (
          <div
            key={transcript.id}
            className={`relative bg-black-card border-2 border-border-subtle hover:border-orange-accent transition-all ${
              isDeleting ? 'opacity-50' : ''
            }`}
          >
            <Link href={`/review/${transcript.id}`} className="block p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className="w-6 h-6 text-orange-accent mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white-full font-bold uppercase">
                        {transcript.meeting_type?.toUpperCase() || 'WIP'} Meeting
                      </h3>
                      <ConfidenceBadge score={transcript.extraction_confidence || 0} />
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-white-muted text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(transcript.meeting_date).toLocaleDateString()}
                      </span>
                      {extracted && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {extracted.projects?.length || 0} projects,{' '}
                          {extracted.assignments?.length || 0} assignments
                        </span>
                      )}
                    </div>

                    <p className="text-white-dim text-xs mt-3 line-clamp-2">
                      {transcript.raw_text?.substring(0, 150)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-white-dim text-xs">
                    {transcript.approved ? (
                      <span className="text-green-500 uppercase font-bold">Approved</span>
                    ) : (
                      <span className="text-yellow-electric uppercase font-bold">
                        Pending Review
                      </span>
                    )}
                  </div>

                  {/* Delete button */}
                  {isConfirming ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          confirmDeleteTranscript(transcript.id)
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </Button>
                      <button
                        onClick={cancelDelete}
                        className="p-1 text-white-dim hover:text-white-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(e, transcript.id)}
                      className="p-2 text-white-dim hover:text-red-hot transition-colors"
                      title="Delete transcript"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
