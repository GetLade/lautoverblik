'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Trash2, User } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Customer, TimeEntry } from '@/types'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHours(seconds: number) {
  const h = seconds / 3600
  return `${h.toFixed(1)} t`
}

function dayLabel(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'I dag'
  if (date.toDateString() === yesterday.toDateString()) return 'I går'
  return date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'short' })
}

const STORAGE_KEY = 'lauto-active-timer'

interface ActiveTimer {
  startedAt: string
  description: string
  customerId: string
}

export default function TimeTracker() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)

  // Timer state
  const [isRunning, setIsRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState('')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadData()
    // Restore active timer from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const { startedAt: sa, description: desc, customerId: cid } = JSON.parse(saved) as ActiveTimer
      setIsRunning(true)
      setStartedAt(new Date(sa))
      setDescription(desc)
      setCustomerId(cid)
    }
  }, [])

  // Live elapsed counter
  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!isRunning) setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, startedAt])

  async function loadData() {
    const supabase = getSupabase()
    const [{ data: customersData }, { data: entriesData }] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase
        .from('time_entries')
        .select('*, customer:customers(name)')
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(100),
    ])
    setCustomers(customersData ?? [])
    setEntries(entriesData ?? [])
    setLoadingEntries(false)
  }

  function handleStart() {
    if (!description.trim()) return
    const now = new Date()
    setStartedAt(now)
    setIsRunning(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ startedAt: now.toISOString(), description, customerId }))
  }

  async function handleStop() {
    if (!startedAt) return
    const endedAt = new Date()
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)

    setIsRunning(false)
    localStorage.removeItem(STORAGE_KEY)

    const { data, error } = await getSupabase()
      .from('time_entries')
      .insert({
        description: description.trim(),
        customer_id: customerId || null,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select('*, customer:customers(name)')
      .single()

    if (!error && data) setEntries(prev => [data as TimeEntry, ...prev])

    setDescription('')
    setCustomerId('')
    setStartedAt(null)
  }

  async function handleDeleteEntry(entryId: string) {
    await getSupabase().from('time_entries').delete().eq('id', entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  // Group entries by date
  const grouped: Record<string, TimeEntry[]> = {}
  entries.forEach(entry => {
    const date = entry.started_at.split('T')[0]
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(entry)
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Timer card */}
      <div className="p-6 bg-[--bg-surface] border border-[--border-subtle] rounded-2xl">
        {/* Elapsed display */}
        <div className="text-center mb-5">
          <p className={`text-5xl font-mono font-semibold tracking-tight tabular-nums ${isRunning ? 'text-[--text-primary]' : 'text-[--text-muted]'}`}>
            {formatDuration(elapsed)}
          </p>
          {isRunning && (
            <p className="text-xs text-emerald-400 mt-1.5 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Kører siden {startedAt?.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-3 mb-4">
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Hvad arbejder du på?"
            disabled={isRunning}
            className="w-full px-4 py-3 bg-[--bg-elevated] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none transition-colors disabled:opacity-60"
          />
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-muted]" />
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              disabled={isRunning}
              className="w-full pl-9 pr-4 py-3 bg-[--bg-elevated] border border-[--border-subtle] hover:border-[--border-default] focus:border-[--accent]/40 rounded-xl text-sm text-[--text-primary] outline-none transition-colors disabled:opacity-60 appearance-none cursor-pointer"
            >
              <option value="">Ingen kunde</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Start / Stop */}
        {isRunning ? (
          <button
            onClick={handleStop}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl text-sm transition-colors cursor-pointer"
          >
            <Square size={15} strokeWidth={2.5} />Stop & gem
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
          >
            <Play size={15} strokeWidth={2.5} />Start timer
          </button>
        )}
      </div>

      {/* History */}
      <div>
        <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wide mb-3">Historik</p>
        {loadingEntries ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[--bg-surface] rounded-2xl animate-pulse" />)}</div>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center py-10 text-[--text-muted] text-sm">Ingen tidsregistreringer endnu</p>
        ) : (
          Object.entries(grouped).map(([date, dayEntries]) => {
            const totalSeconds = dayEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0)
            return (
              <div key={date} className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[--text-secondary] capitalize">{dayLabel(date)}</p>
                  <p className="text-xs text-[--text-muted]">{formatHours(totalSeconds)} total</p>
                </div>
                <div className="space-y-2">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-[--bg-surface] border border-[--border-subtle] rounded-xl group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[--text-primary] truncate">{entry.description}</p>
                        {entry.customer && (
                          <p className="text-xs text-[--text-muted] mt-0.5 flex items-center gap-1">
                            <User size={10} />{entry.customer.name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-mono text-[--text-secondary] flex-shrink-0 tabular-nums">
                        {formatDuration(entry.duration_seconds ?? 0)}
                      </span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-500/8 transition-all cursor-pointer flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
