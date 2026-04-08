'use client'

import { useState } from 'react'
import IdeaCapture from '@/components/ideas/IdeaCapture'
import IdeaHistory from '@/components/ideas/IdeaHistory'

export default function IdeaCapturePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-[--accent] uppercase tracking-wide mb-1.5">Voice</p>
        <h1 className="text-2xl font-semibold text-[--text-primary] tracking-tight">Idé-capture</h1>
        <p className="text-[--text-muted] text-sm mt-1.5">Optag din idé – AI formaterer og vurderer den.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <IdeaCapture onIdeaSaved={() => setRefreshTrigger((t) => t + 1)} />
        </div>
        <div className="w-full md:w-80 shrink-0">
          <IdeaHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
