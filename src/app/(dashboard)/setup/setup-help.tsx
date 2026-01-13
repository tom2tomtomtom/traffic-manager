'use client'

import { PageHelp } from '@/components/ui/page-help'

export function SetupHelp() {
  return (
    <PageHelp title="How to Use Setup">
      <p className="text-white-full font-bold mb-2">Quick Entry Format:</p>
      <ul className="list-disc list-inside space-y-1 mb-4">
        <li>
          <code className="bg-black-deep px-1">Legos 15</code> → 15 hours this week
        </li>
        <li>
          <code className="bg-black-deep px-1">Legos 15/40</code> → 15h this week, 40h total estimate
        </li>
      </ul>

      <p className="text-white-full font-bold mb-2">Workflow:</p>
      <ol className="list-decimal list-inside space-y-1 mb-4">
        <li>Click a team member on the left</li>
        <li>Type project name + hours in the quick entry box</li>
        <li>Press Enter to add</li>
        <li>Click &quot;Save & Continue&quot; when done</li>
        <li>System auto-advances to next person</li>
      </ol>

      <p className="text-white-full font-bold mb-2">Tips:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>New projects are created automatically</li>
        <li>Fuzzy matching finds existing projects</li>
        <li>Remove entries by clicking ×</li>
        <li>Edit hours inline before saving</li>
      </ul>
    </PageHelp>
  )
}
