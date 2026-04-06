'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import type { Meeting, MeetingKeyPoint } from '@/types'
import { downloadMeetingPDF, formatDuration } from '@/lib/meetingPdf'

interface Props {
  refreshTrigger?: number
}

const CATEGORY_COLORS: Record<MeetingKeyPoint['category'], string> = {
  action: 'text-emerald-400',
  decision: 'text-amber-400',
  note: 'text-sky-400',
}

const CATEGORY_LABELS: Record<MeetingKeyPoint['category'], string> = {
  action: 'Handling',
  decision: 'Beslutning',
  note: 'Note',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function MeetingHistory({ refreshTrigger }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTranscriptId, setShowTranscriptId] = useState<string | null>(null)
  const [showSpeakersId, setShowSpeakersId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function fetchMeetings() {
    const { data } = await getSupabase()
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })
    setMeetings((data as Meeting[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMeetings()
  }, [refreshTrigger])

  // Luk menu ved klik udenfor
  useEffect(() => {
    if (!menuOpenId) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function markForDelete(id: string) {
    setMenuOpenId(null)
    setSelectedIds((prev) => new Set([...prev, id]))
  }

  function cancelSelection() {
    setSelectedIds(new Set())
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    setDeleting(true)
    await getSupabase().from('meetings').delete().in('id', [...selectedIds])
    setSelectedIds(new Set())
    setExpandedId(null)
    await fetchMeetings()
    setDeleting(false)
  }

  const selectMode = selectedIds.size > 0

  if (loading) {
    return (
      <div className="text-white/30 text-sm text-center py-8 animate-pulse">
        Henter møder…
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="text-white/30 text-sm text-center py-8">
        Ingen gemte møder endnu
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">
          Gemte møder ({meetings.length})
        </h2>
        {selectMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelSelection}
              className="text-white/40 text-xs hover:text-white/70 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Sletter…' : `Slet (${selectedIds.size})`}
            </button>
          </div>
        )}
      </div>

      {meetings.map((meeting) => {
        const isOpen = expandedId === meeting.id
        const isSelected = selectedIds.has(meeting.id)
        const isMenuOpen = menuOpenId === meeting.id
        const transcriptOpen = showTranscriptId === meeting.id
        const speakersOpen = showSpeakersId === meeting.id

        return (
          <div
            key={meeting.id}
            className={`bg-white/5 rounded-xl overflow-hidden border transition-colors ${
              isSelected
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Hoved-række */}
            <div className="flex items-center gap-3 px-3 py-3">
              {/* Checkbox i select-mode, ellers varighed-badge */}
              {selectMode ? (
                <button
                  onClick={() => toggleSelect(meeting.id)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  {isSelected && <span className="text-xs leading-none">✓</span>}
                </button>
              ) : (
                <span className="shrink-0 text-xs font-mono font-medium w-9 h-9 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/50">
                  {formatDuration(meeting.duration)}
                </span>
              )}

              {/* Titel + dato */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => !selectMode && setExpandedId(isOpen ? null : meeting.id)}
              >
                <p className="text-white/80 text-sm leading-snug truncate">{meeting.title}</p>
                <p className="text-white/30 text-xs mt-0.5">{formatDate(meeting.created_at)}</p>
              </div>

              {/* Handlingsknapper */}
              <div className="shrink-0 flex items-center gap-1">
                {!selectMode && (
                  <span
                    className="text-white/30 text-xs cursor-pointer hover:text-white/60 px-1"
                    onClick={() => setExpandedId(isOpen ? null : meeting.id)}
                  >
                    {isOpen ? '▲' : '▼'}
                  </span>
                )}

                {/* Menu-knap */}
                <div className="relative" ref={isMenuOpen ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(isMenuOpen ? null : meeting.id)
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors text-sm"
                  >
                    ⋮
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-8 z-10 bg-zinc-800 border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[130px]"
                      >
                        <button
                          onClick={() => {
                            setMenuOpenId(null)
                            downloadMeetingPDF(meeting)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition-colors"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => markForDelete(meeting.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Fjern
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Udvidet detalje */}
            <AnimatePresence initial={false}>
              {isOpen && !selectMode && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-4 border-t border-white/10 pt-3">
                    {/* Opsummering */}
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1.5">
                        Opsummering
                      </p>
                      <p className="text-white/70 text-xs leading-relaxed">{meeting.summary}</p>
                    </div>

                    {/* Centrale punkter */}
                    {meeting.key_points.length > 0 && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
                          Centrale punkter
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {meeting.key_points.map((kp, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span
                                className={`text-xs mt-0.5 shrink-0 font-medium ${CATEGORY_COLORS[kp.category]}`}
                              >
                                {CATEGORY_LABELS[kp.category]}
                              </span>
                              <span className="text-white/60 text-xs">{kp.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mål og forventninger */}
                    {meeting.goals_expectations && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1.5">
                          Mål og forventninger
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed">
                          {meeting.goals_expectations}
                        </p>
                      </div>
                    )}

                    {/* Næste skridt */}
                    {meeting.next_steps && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1.5">
                          Næste skridt
                        </p>
                        <p className="text-white/60 text-xs leading-relaxed">
                          {meeting.next_steps}
                        </p>
                      </div>
                    )}

                    {/* Salgsvurdering */}
                    {meeting.sales_analysis && (
                      <div className="border border-white/10 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-white/40 text-xs uppercase tracking-wider">Salgsvurdering</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                meeting.sales_analysis.outcome === 'won'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : meeting.sales_analysis.outcome === 'lost'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {meeting.sales_analysis.outcome === 'won' ? 'Vundet' : meeting.sales_analysis.outcome === 'lost' ? 'Tabt' : 'Afventer'}
                            </span>
                            <span className="text-white/40 text-xs">{meeting.sales_analysis.score}/10</span>
                          </div>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed">{meeting.sales_analysis.outcome_summary}</p>
                        {meeting.sales_analysis.strengths.length > 0 && (
                          <div>
                            <p className="text-white/40 text-xs mb-1">Styrker</p>
                            <ul className="space-y-0.5">
                              {meeting.sales_analysis.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-400/80">
                                  <span className="shrink-0">+</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meeting.sales_analysis.improvements.length > 0 && (
                          <div>
                            <p className="text-white/40 text-xs mb-1">Forbedringsområder</p>
                            <ul className="space-y-0.5">
                              {meeting.sales_analysis.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-400/80">
                                  <span className="shrink-0">→</span>
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {meeting.sales_analysis.closing_blockers.length > 0 && (
                          <div>
                            <p className="text-white/40 text-xs mb-1">Lukning-blokkere</p>
                            <ul className="space-y-0.5">
                              {meeting.sales_analysis.closing_blockers.map((b, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-red-400/80">
                                  <span className="shrink-0">!</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Talersegmenter */}
                    {meeting.speaker_segments && meeting.speaker_segments.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setShowSpeakersId(speakersOpen ? null : meeting.id)
                          }
                          className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
                        >
                          <span>{speakersOpen ? '▼' : '▶'}</span>
                          Talersegmenter ({meeting.speaker_segments.length})
                        </button>
                        <AnimatePresence>
                          {speakersOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <ul className="space-y-2 mt-2">
                                {meeting.speaker_segments.map((seg, i) => (
                                  <li key={i} className="flex flex-col gap-0.5">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-semibold text-amber-400">
                                        {seg.speaker}
                                      </span>
                                      <span className="text-xs text-white/30">{seg.timestamp}</span>
                                    </div>
                                    <p className="text-white/50 text-xs leading-relaxed">
                                      {seg.text}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Transskription (sammenklappeligt) */}
                    <div>
                      <button
                        onClick={() =>
                          setShowTranscriptId(transcriptOpen ? null : meeting.id)
                        }
                        className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
                      >
                        <span>{transcriptOpen ? '▼' : '▶'}</span>
                        Fuld transskription
                      </button>
                      <AnimatePresence>
                        {transcriptOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <p className="text-white/30 text-xs leading-relaxed mt-2 whitespace-pre-wrap">
                              {meeting.corrected_transcript || meeting.transcript}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Download PDF */}
                    <button
                      onClick={() => downloadMeetingPDF(meeting)}
                      className="self-start flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 text-xs transition-colors"
                    >
                      ⬇️ Download PDF
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
