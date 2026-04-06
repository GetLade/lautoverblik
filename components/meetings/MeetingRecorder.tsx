'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import type { MeetingKeyPoint, MeetingSalesAnalysis, MeetingSpeakerSegment } from '@/types'
import { downloadMeetingPDF, formatDuration } from '@/lib/meetingPdf'

type Stage = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'analyzing' | 'done'

interface Props {
  onMeetingSaved?: () => void
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

export default function MeetingRecorder({ onMeetingSaved }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [keyPoints, setKeyPoints] = useState<MeetingKeyPoint[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [correctedTranscript, setCorrectedTranscript] = useState<string>('')
  const [speakerSegments, setSpeakerSegments] = useState<MeetingSpeakerSegment[]>([])
  const [goalsExpectations, setGoalsExpectations] = useState<string>('')
  const [nextSteps, setNextSteps] = useState<string>('')
  const [salesAnalysis, setSalesAnalysis] = useState<MeetingSalesAnalysis | null>(null)
  const [showSpeakers, setShowSpeakers] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)

  // Advar brugeren hvis de navigerer væk under optagelse
  useEffect(() => {
    if (stage !== 'recording') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [stage])

  async function startRecording() {
    setError(null)

    if (!window.MediaRecorder) {
      setError('Din browser understøtter ikke lydoptagelse. Prøv Chrome eller Safari.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // iOS Safari bruger mp4/aac, Chrome/Android bruger webm/opus
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        audioBlobRef.current = blob
        stream.getTracks().forEach((t) => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        if (wakeLockRef.current) {
          wakeLockRef.current.release().catch(() => {})
          wakeLockRef.current = null
        }
        setStage('recorded')
      }

      // Hent data hvert 10. sekund for at undgå memory buildup ved lange optagelser
      recorder.start(10_000)
      mediaRecorderRef.current = recorder
      setStage('recording')

      // Hold skærmen tændt (Wake Lock)
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch {
          // Wake Lock er valgfri — fejl her er ikke kritisk
        }
      }

      let elapsed = 0
      timerRef.current = setInterval(() => {
        elapsed++
        setDuration(elapsed)
      }, 1000)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Adgang til mikrofon nægtet. Tjek browser-tilladelser.')
      } else {
        setError('Kunne ikke starte optagelse. Prøv igen.')
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  async function processRecording() {
    const audioBlob = audioBlobRef.current
    if (!audioBlob) return
    setError(null)

    const MAX_SIZE = 24 * 1024 * 1024
    if (audioBlob.size > MAX_SIZE) {
      setError('Optagelsen er for stor til at behandle. Maksimum er 24 MB.')
      return
    }

    // 1. Transskriber
    setStage('transcribing')
    const formData = new FormData()
    const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'
    formData.append('audio', audioBlob, `meeting.${ext}`)

    const transcribeRes = await fetch('/api/meetings/transcribe', {
      method: 'POST',
      body: formData,
    })

    if (!transcribeRes.ok) {
      const data = await transcribeRes.json().catch(() => ({}))
      setError(data.error ?? 'Transskription mislykkedes. Prøv igen.')
      setStage('recorded')
      return
    }

    const { transcript: rawTranscript } = await transcribeRes.json()
    setTranscript(rawTranscript)

    // 2. Analyser
    setStage('analyzing')
    const analyzeRes = await fetch('/api/meetings/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: rawTranscript, duration }),
    })

    if (!analyzeRes.ok) {
      const data = await analyzeRes.json().catch(() => ({}))
      setError(data.error ?? 'Analyse mislykkedes. Prøv igen.')
      setStage('recorded')
      return
    }

    const {
      title: genTitle,
      summary: genSummary,
      key_points,
      corrected_transcript,
      speaker_segments,
      goals_expectations,
      next_steps,
      sales_analysis,
    } = await analyzeRes.json()
    setTitle(genTitle)
    setSummary(genSummary)
    setKeyPoints(key_points ?? [])
    setCorrectedTranscript(corrected_transcript ?? '')
    setSpeakerSegments(speaker_segments ?? [])
    setGoalsExpectations(goals_expectations ?? '')
    setNextSteps(next_steps ?? '')
    setSalesAnalysis(sales_analysis ?? null)

    // 3. Gem i Supabase
    const { data: saved } = await getSupabase()
      .from('meetings')
      .insert({
        title: genTitle,
        transcript: rawTranscript,
        summary: genSummary,
        key_points: key_points ?? [],
        duration,
        corrected_transcript: corrected_transcript ?? undefined,
        speaker_segments: speaker_segments ?? undefined,
        goals_expectations: goals_expectations ?? undefined,
        next_steps: next_steps ?? undefined,
        sales_analysis: sales_analysis ?? undefined,
      })
      .select('id')
      .single()

    if (saved) setSavedId(saved.id)
    onMeetingSaved?.()
    setStage('done')
  }

  function reset() {
    setStage('idle')
    setDuration(0)
    setTranscript('')
    setSummary('')
    setKeyPoints([])
    setTitle('')
    setError(null)
    setShowTranscript(false)
    setSavedId(null)
    setCorrectedTranscript('')
    setSpeakerSegments([])
    setGoalsExpectations('')
    setNextSteps('')
    setSalesAnalysis(null)
    setShowSpeakers(false)
    audioBlobRef.current = null
  }

  async function handleDownloadPDF() {
    if (!savedId) return
    await downloadMeetingPDF({
      id: savedId,
      title,
      transcript,
      summary,
      key_points: keyPoints,
      duration,
      created_at: new Date().toISOString(),
      corrected_transcript: correctedTranscript || undefined,
      speaker_segments: speakerSegments.length > 0 ? speakerSegments : undefined,
      goals_expectations: goalsExpectations || undefined,
      next_steps: nextSteps || undefined,
      sales_analysis: salesAnalysis || undefined,
    })
  }

  const statusText: Partial<Record<Stage, string>> = {
    transcribing: 'Transskriberer optagelse…',
    analyzing: 'Analyserer møde…',
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Optagelses-sektion */}
      <AnimatePresence mode="wait">
        {stage === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <p className="text-white/40 text-sm text-center">
              Sørg for at holde skærmen tændt under optagelse
            </p>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center text-4xl hover:bg-red-500/30 transition-colors"
            >
              🎙️
            </button>
            <p className="text-white/50 text-sm">Tryk for at starte optagelse</p>
          </motion.div>
        )}

        {stage === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <motion.button
              onClick={stopRecording}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-24 h-24 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center text-4xl"
            >
              ⏹️
            </motion.button>
            <p className="font-mono text-3xl text-white tabular-nums">
              {formatDuration(duration)}
            </p>
            <p className="text-red-400 text-sm">Optager… tryk for at stoppe</p>
          </motion.div>
        )}

        {stage === 'recorded' && (
          <motion.div
            key="recorded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <p className="text-white/60 text-sm">
              Optagelse klar — {formatDuration(duration)}
            </p>
            <button
              onClick={processRecording}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white text-sm font-medium transition-colors"
            >
              Transskriber og analyser
            </button>
            <button onClick={reset} className="text-white/30 text-xs hover:text-white/50 transition-colors">
              Slet og optag igen
            </button>
          </motion.div>
        )}

        {(stage === 'transcribing' || stage === 'analyzing') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full"
            />
            <p className="text-white/50 text-sm">{statusText[stage]}</p>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Titel */}
            <div>
              <h2 className="text-white font-semibold text-lg">{title}</h2>
              <p className="text-white/30 text-xs mt-0.5">{formatDuration(duration)}</p>
            </div>

            {/* Opsummering */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Opsummering</p>
              <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
            </div>

            {/* Centrale punkter */}
            {keyPoints.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                  Centrale punkter
                </p>
                <ul className="space-y-2">
                  {keyPoints.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className={`text-xs mt-0.5 shrink-0 font-medium ${CATEGORY_COLORS[kp.category]}`}
                      >
                        {CATEGORY_LABELS[kp.category]}
                      </span>
                      <span className="text-white/70 text-sm">{kp.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mål og forventninger */}
            {goalsExpectations && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Mål og forventninger</p>
                <p className="text-white/70 text-sm leading-relaxed">{goalsExpectations}</p>
              </div>
            )}

            {/* Næste skridt */}
            {nextSteps && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Næste skridt</p>
                <p className="text-white/70 text-sm leading-relaxed">{nextSteps}</p>
              </div>
            )}

            {/* Salgsvurdering */}
            {salesAnalysis && (
              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs uppercase tracking-wider">Salgsvurdering</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        salesAnalysis.outcome === 'won'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : salesAnalysis.outcome === 'lost'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {salesAnalysis.outcome === 'won' ? 'Vundet' : salesAnalysis.outcome === 'lost' ? 'Tabt' : 'Afventer'}
                    </span>
                    <span className="text-white/40 text-xs">{salesAnalysis.score}/10</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{salesAnalysis.outcome_summary}</p>
                {salesAnalysis.strengths.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs mb-1.5">Styrker</p>
                    <ul className="space-y-1">
                      {salesAnalysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-emerald-400/80">
                          <span className="shrink-0 mt-0.5">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {salesAnalysis.improvements.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs mb-1.5">Forbedringsområder</p>
                    <ul className="space-y-1">
                      {salesAnalysis.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-amber-400/80">
                          <span className="shrink-0 mt-0.5">→</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {salesAnalysis.closing_blockers.length > 0 && (
                  <div>
                    <p className="text-white/40 text-xs mb-1.5">Lukning-blokkere</p>
                    <ul className="space-y-1">
                      {salesAnalysis.closing_blockers.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-red-400/80">
                          <span className="shrink-0 mt-0.5">!</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Talersegmenter */}
            {speakerSegments.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSpeakers(!showSpeakers)}
                  className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  <span>{showSpeakers ? '▼' : '▶'}</span>
                  Talersegmenter ({speakerSegments.length})
                </button>
                <AnimatePresence>
                  {showSpeakers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-2 mt-2">
                        {speakerSegments.map((seg, i) => (
                          <li key={i} className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-amber-400">{seg.speaker}</span>
                              <span className="text-xs text-white/30">{seg.timestamp}</span>
                            </div>
                            <p className="text-white/60 text-sm ml-0 leading-relaxed">{seg.text}</p>
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
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                <span>{showTranscript ? '▼' : '▶'}</span>
                Fuld transskription
              </button>
              <AnimatePresence>
                {showTranscript && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="text-white/40 text-xs leading-relaxed mt-2 whitespace-pre-wrap">
                      {correctedTranscript || transcript}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Handlingsknapper */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white text-sm font-medium transition-colors"
              >
                ⬇️ Download PDF
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Nyt møde
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fejlbesked */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-red-400 text-sm text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
