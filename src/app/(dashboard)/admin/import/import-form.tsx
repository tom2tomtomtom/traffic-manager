'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

interface ImportResults {
  teamMembers: { created: number; updated: number }
  projects: { created: number }
  assignments: { created: number; skipped: number }
  errors: string[]
}

export function ImportForm() {
  const [teamFile, setTeamFile] = useState<File | null>(null)
  const [projectFile, setProjectFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleImport = async () => {
    if (!teamFile || !projectFile) {
      toast.error('Please select both CSV files')
      return
    }

    setImporting(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('teamCsv', teamFile)
      formData.append('projectCsv', projectFile)

      const response = await fetch('/api/import/forecast', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
        toast.success('Import completed successfully')
        router.refresh()
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team CSV */}
        <div className="bg-black-card border-2 border-border-subtle p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-orange-accent mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Team Export CSV
          </h3>
          <p className="text-white-dim text-sm mb-4">
            Export from Forecast: Team view with capacity data
          </p>

          <label className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer transition-all',
            teamFile ? 'border-green-500 bg-green-500/10' : 'border-border-subtle hover:border-orange-accent'
          )}>
            <input
              type="file"
              accept=".csv"
              onChange={e => setTeamFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {teamFile ? (
              <>
                <Check className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-white-full font-medium">{teamFile.name}</span>
                <span className="text-white-dim text-xs mt-1">Click to change</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-white-dim mb-2" />
                <span className="text-white-muted">Click to upload</span>
                <span className="text-white-dim text-xs mt-1">forecast-team-export-*.csv</span>
              </>
            )}
          </label>
        </div>

        {/* Project CSV */}
        <div className="bg-black-card border-2 border-border-subtle p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-orange-accent mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Project Export CSV
          </h3>
          <p className="text-white-dim text-sm mb-4">
            Export from Forecast: Project view with assignments
          </p>

          <label className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer transition-all',
            projectFile ? 'border-green-500 bg-green-500/10' : 'border-border-subtle hover:border-orange-accent'
          )}>
            <input
              type="file"
              accept=".csv"
              onChange={e => setProjectFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {projectFile ? (
              <>
                <Check className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-white-full font-medium">{projectFile.name}</span>
                <span className="text-white-dim text-xs mt-1">Click to change</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-white-dim mb-2" />
                <span className="text-white-muted">Click to upload</span>
                <span className="text-white-dim text-xs mt-1">forecast-project-export-*.csv</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Import Button */}
      <div className="flex justify-center">
        <button
          onClick={handleImport}
          disabled={!teamFile || !projectFile || importing}
          className={cn(
            'px-8 py-4 font-bold uppercase text-sm transition-all',
            'bg-orange-accent text-black-ink hover:bg-orange-accent/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {importing ? 'Importing...' : 'Import Data'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-black-card border-2 border-green-500/50 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-green-500 mb-4 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Import Complete
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-black-deep p-4 text-center">
              <p className="text-3xl font-bold text-orange-accent">
                {results.teamMembers.created + results.teamMembers.updated}
              </p>
              <p className="text-white-dim text-xs uppercase mt-1">Team Members</p>
              <p className="text-white-dim text-xs">
                ({results.teamMembers.created} new, {results.teamMembers.updated} updated)
              </p>
            </div>

            <div className="bg-black-deep p-4 text-center">
              <p className="text-3xl font-bold text-orange-accent">
                {results.projects.created}
              </p>
              <p className="text-white-dim text-xs uppercase mt-1">Projects Created</p>
            </div>

            <div className="bg-black-deep p-4 text-center">
              <p className="text-3xl font-bold text-orange-accent">
                {results.assignments.created}
              </p>
              <p className="text-white-dim text-xs uppercase mt-1">Assignments</p>
              <p className="text-white-dim text-xs">
                ({results.assignments.skipped} skipped)
              </p>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-hot/10 border-2 border-red-hot/50 p-4 mt-4">
              <p className="text-red-hot text-sm font-bold uppercase mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errors ({results.errors.length})
              </p>
              <ul className="text-white-dim text-xs space-y-1 max-h-32 overflow-y-auto">
                {results.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-white-muted text-sm">
              View imported data on the{' '}
              <a href="/capacity" className="text-orange-accent hover:underline">
                Capacity Dashboard
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-black-card border-2 border-border-subtle p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white-dim mb-4">
          How to Export from Forecast
        </h3>
        <ol className="list-decimal list-inside text-white-dim text-sm space-y-2">
          <li>Go to Forecast → Team view</li>
          <li>Set date range to include current week</li>
          <li>Click Export → Download CSV (this is the Team file)</li>
          <li>Go to Forecast → Projects view</li>
          <li>Same date range, Export → Download CSV (this is the Project file)</li>
          <li>Upload both files above</li>
        </ol>

        <div className="mt-4 p-4 bg-black-deep border-2 border-yellow-electric/30">
          <p className="text-yellow-electric text-xs font-bold uppercase mb-1">Note</p>
          <p className="text-white-dim text-xs">
            Internal/non-billable projects (Time Off, Non-Billable, etc.) are automatically filtered out.
            Only assignments with hours in the current week are imported.
          </p>
        </div>
      </div>
    </div>
  )
}
