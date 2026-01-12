'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Loader2 } from 'lucide-react'

export function TranscriptUpload() {
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length

  async function handleUpload() {
    if (!transcript.trim() || wordCount < 20) {
      setError('Transcript must contain at least 20 words')
      return
    }

    setProcessing(true)
    setProgress(0)
    setError(null)

    // Simulate progress for perceived speed
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 500)

    try {
      // TODO: Replace with actual API call to FastAPI backend
      const response = await fetch('/api/transcripts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript_text: transcript,
          meeting_date: new Date().toISOString().split('T')[0],
          meeting_type: 'wip',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process transcript')
      }

      const result = await response.json()

      setProgress(100)
      clearInterval(progressInterval)

      // Redirect to review page
      setTimeout(() => {
        router.push(`/dashboard/review/${result.transcript_id}`)
      }, 500)
    } catch (err) {
      clearInterval(progressInterval)
      setProcessing(false)
      setProgress(0)
      setError(
        err instanceof Error ? err.message : 'Failed to process transcript'
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black-card p-8 border-2 border-border-subtle">
        <h2 className="text-xl font-bold text-orange-accent uppercase mb-6">
          Upload WIP Meeting Transcript
        </h2>

        <Textarea
          placeholder="Paste your meeting transcript here...

Example:
'Alright let's go through the projects. Jess, what's happening with Legos?'
'Legos is in production now, I've got about 15 hours on it this week...'
'Great. And Tommy, you're jam packed this week right?'
'Yeah, completely overallocated on the Coke project...'"
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value)
            setError(null)
          }}
          rows={15}
          disabled={processing}
        />

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-white-dim text-xs uppercase tracking-wide">
              {wordCount} words
            </p>
            {wordCount > 0 && wordCount < 20 && (
              <p className="text-yellow-electric text-xs uppercase">
                Min 20 words required
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!transcript.trim() || wordCount < 20 || processing}
            size="lg"
          >
            {processing ? 'Processing...' : 'Analyze Transcript'}
          </Button>
        </div>

        {/* Progress indicator */}
        {processing && (
          <div className="mt-6 p-4 bg-black-deep border-2 border-orange-accent">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-5 h-5 text-orange-accent animate-spin" />
              <div>
                <p className="text-white-full font-bold uppercase text-sm">
                  Processing Transcript
                </p>
                <p className="text-white-muted text-xs mt-1">
                  Extracting projects, assignments, and capacity signals...
                </p>
              </div>
            </div>
            <div className="bg-black-ink h-2 overflow-hidden">
              <div
                className="bg-orange-accent h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-orange-accent text-xs mt-2 text-right font-bold">
              {progress}%
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-black-deep border-2 border-red-hot">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-hot flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-hot font-bold uppercase text-sm">
                  Extraction Failed
                </p>
                <p className="text-white-muted text-sm mt-1">{error}</p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-4"
                  onClick={() => setError(null)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-black-card p-6 border-2 border-border-subtle">
        <h3 className="text-sm font-bold text-white-muted uppercase mb-4">
          What Gets Extracted
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-orange-accent font-bold uppercase text-xs mb-2">
              Projects
            </p>
            <p className="text-white-dim">
              Names, status, phases, and current milestones
            </p>
          </div>
          <div>
            <p className="text-orange-accent font-bold uppercase text-xs mb-2">
              Assignments
            </p>
            <p className="text-white-dim">
              Who&apos;s working on what with estimated hours
            </p>
          </div>
          <div>
            <p className="text-orange-accent font-bold uppercase text-xs mb-2">
              Capacity
            </p>
            <p className="text-white-dim">
              Workload signals, availability, and overallocation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
