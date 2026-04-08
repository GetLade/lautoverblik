import TimeTracker from '@/components/time/TimeTracker'

export default function TimeTrackingPage() {
  return (
    <div className="px-4 py-10">
      <div className="mb-8 max-w-2xl mx-auto">
        <p className="text-xs font-medium text-[--accent] uppercase tracking-wide mb-1.5">Timer</p>
        <h1 className="text-2xl font-semibold text-[--text-primary] tracking-tight">Tidsregistrering</h1>
        <p className="text-[--text-muted] text-sm mt-1.5">
          Start en timer per opgave – tilknyt en kunde og se daglige totaler.
        </p>
      </div>
      <TimeTracker />
    </div>
  )
}
