'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Idea } from '@/types'

interface Props {
  refreshTrigger?: number
}

function scoreColor(score: number) {
  if (score >= 8) return 'text-green-400 border-green-400/40 bg-green-400/10'
  if (score >= 5) return 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10'
  return 'text-red-400 border-red-400/40 bg-red-400/10'
}

function excerpt(text: string, max = 80) {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

export default function IdeaHistory({ refreshTrigger }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function fetchIdeas() {
    const { data } = await getSupabase()
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })
    setIdeas((data as Idea[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchIdeas()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="text-white/30 text-sm text-center py-8 animate-pulse">
        Henter idéer…
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="text-white/30 text-sm text-center py-8">
        Ingen gemte idéer endnu
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
        Gemte idéer ({ideas.length})
      </h2>
      {ideas.map((idea) => {
        const eval_ = idea.ai_evaluation
        const isOpen = expandedId === idea.id

        return (
          <div
            key={idea.id}
            className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
            onClick={() => setExpandedId(isOpen ? null : idea.id)}
          >
            {/* Hoved-række */}
            <div className="flex items-center gap-3 px-4 py-3">
              {eval_ && (
                <span className={`shrink-0 text-sm font-bold w-9 h-9 flex items-center justify-center rounded-full border ${scoreColor(eval_.score)}`}>
                  {eval_.score}
                </span>
              )}
              <p className="flex-1 text-white/80 text-sm leading-snug">
                {excerpt(idea.formatted_text)}
              </p>
              <span className="shrink-0 text-white/30 text-xs">
                {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Udvidet detalje */}
            <AnimatePresence initial={false}>
              {isOpen && eval_ && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/10 pt-3">
                    {/* Fuld tekst */}
                    <p className="text-white/60 text-xs leading-relaxed">
                      {idea.formatted_text}
                    </p>

                    {eval_.pros.length > 0 && (
                      <div>
                        <p className="text-green-400 text-xs font-medium mb-1">Fordele</p>
                        <ul className="flex flex-col gap-1">
                          {eval_.pros.map((p, i) => (
                            <li key={i} className="text-white/70 text-xs flex gap-2">
                              <span className="text-green-400 shrink-0">+</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {eval_.cons.length > 0 && (
                      <div>
                        <p className="text-red-400 text-xs font-medium mb-1">Udfordringer</p>
                        <ul className="flex flex-col gap-1">
                          {eval_.cons.map((c, i) => (
                            <li key={i} className="text-white/70 text-xs flex gap-2">
                              <span className="text-red-400 shrink-0">−</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {eval_.improvements.length > 0 && (
                      <div>
                        <p className="text-blue-400 text-xs font-medium mb-1">Forbedringsidéer</p>
                        <ul className="flex flex-col gap-1">
                          {eval_.improvements.map((imp, i) => (
                            <li key={i} className="text-white/70 text-xs flex gap-2">
                              <span className="text-blue-400 shrink-0">→</span> {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
