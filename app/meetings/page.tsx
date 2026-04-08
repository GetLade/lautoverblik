'use client'

import { useState } from 'react'
import MeetingRecorder from '@/components/meetings/MeetingRecorder'
import MeetingHistory from '@/components/meetings/MeetingHistory'

export default function MeetingsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-[--accent] uppercase tracking-wide mb-1.5">Møder</p>
        <h1 className="text-2xl font-semibold text-[--text-primary] tracking-tight">Mødeoptager</h1>
        <p className="text-[--text-muted] text-sm mt-1.5">
          Optag dit møde – AI transskriberer, opsummerer og fremhæver centrale punkter.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0">
          <MeetingRecorder onMeetingSaved={() => setRefreshTrigger((t) => t + 1)} />
        </div>
        <div className="w-full md:w-80 shrink-0">
          <MeetingHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
