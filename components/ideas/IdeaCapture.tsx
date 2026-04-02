'use client'

import { useState, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Idea, IdeaEvaluation } from '@/types'

interface Props {
  onIdeaSaved?: () => void
}

export default function IdeaCapture({ onIdeaSaved }: Props) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [formatted, setFormatted] = useState('')
  const [evaluation, setEvaluation] = useState<IdeaEvaluation | null>(null)
  const [stage, setStage] = useState<'idle' | 'recorded' | 'formatting' | 'evaluating' | 'done'>('idle')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition
    if (!SR) {
      alert('Din browser understøtter ikke taleindtastning. Prøv Chrome.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.lang = 'da-DK'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    let finalTranscript = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalTranscript += result[0].transcript + ' '
        else interim += result[0].transcript
      }
      setTranscript(finalTranscript + interim)
    }

    recognition.start()
    setRecording(true)
    setStage('idle')
    setTranscript('')
    setFormatted('')
    setEvaluation(null)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
    setStage('recorded')
  }

  async function processIdea() {
    if (!transcript.trim()) return

    // 1. Formater transcript
    setStage('formatting')
    const fmtRes = await fetch('/api/llm/format-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
    const { text } = await fmtRes.json()
    setFormatted(text)

    // 2. Evaluer idé
    setStage('evaluating')
    const evalRes = await fetch('/api/llm/evaluate-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const evalData: IdeaEvaluation = await evalRes.json()
    setEvaluation(evalData)

    // 3. Gem i Supabase
    await getSupabase().from('ideas').insert({
      raw_transcript: transcript,
      formatted_text: text,
      ai_evaluation: evalData,
    })

    setStage('done')
    onIdeaSaved?.()
  }

  function reset() {
    setStage('idle')
    setTranscript('')
    setFormatted('')
    setEvaluation(null)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Optag-knap */}
      <div className="flex flex-col items-center gap-4 py-8">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all shadow-lg ${
            recording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {recording ? '⏹' : '🎤'}
        </button>
        <p className="text-white/50 text-sm">
          {recording ? 'Optager... Tryk for at stoppe' : 'Tryk for at optage din idé'}
        </p>
      </div>

      {/* Rå transcript */}
      {transcript && (
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/40 text-xs mb-2">Rå transskription</p>
          <p className="text-white/70 text-sm">{transcript}</p>
        </div>
      )}

      {/* Handlingsknapper */}
      {stage === 'recorded' && (
        <div className="flex gap-3">
          <button
            onClick={processIdea}
            className="flex-1 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
          >
            Behandl idé ✨
          </button>
          <button
            onClick={reset}
            className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Prøv igen
          </button>
        </div>
      )}

      {/* Status */}
      {(stage === 'formatting' || stage === 'evaluating') && (
        <div className="text-center text-white/50 animate-pulse">
          {stage === 'formatting' ? '✍️ Formaterer tekst...' : '🧠 Evaluerer idé...'}
        </div>
      )}

      {/* Resultat */}
      {stage === 'done' && evaluation && (
        <div className="flex flex-col gap-4">
          {/* Formateret tekst */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-2">Formateret idé</p>
            <p className="text-white/90">{formatted}</p>
          </div>

          {/* Score */}
          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className={`text-4xl font-bold ${
              evaluation.score >= 7 ? 'text-green-400' :
              evaluation.score >= 4 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {evaluation.score}/10
            </div>
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    evaluation.score >= 7 ? 'bg-green-400' :
                    evaluation.score >= 4 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${evaluation.score * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pros / Cons / Improvements */}
          <div className="grid grid-cols-1 gap-3">
            {evaluation.pros.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-400 text-xs font-medium mb-2">Fordele</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.pros.map((p, i) => (
                    <li key={i} className="text-white/80 text-sm flex gap-2">
                      <span className="text-green-400">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.cons.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-xs font-medium mb-2">Udfordringer</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.cons.map((c, i) => (
                    <li key={i} className="text-white/80 text-sm flex gap-2">
                      <span className="text-red-400">−</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.improvements.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-xs font-medium mb-2">Forbedringsidéer</p>
                <ul className="flex flex-col gap-1">
                  {evaluation.improvements.map((imp, i) => (
                    <li key={i} className="text-white/80 text-sm flex gap-2">
                      <span className="text-blue-400">→</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={reset}
            className="py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm"
          >
            Optag ny idé
          </button>
        </div>
      )}
    </div>
  )
}
