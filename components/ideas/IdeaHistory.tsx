'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    await getSupabase().from('ideas').delete().in('id', [...selectedIds])
    setSelectedIds(new Set())
    setExpandedId(null)
    await fetchIdeas()
    setDeleting(false)
  }

  const selectMode = selectedIds.size > 0

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
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">
          Gemte idéer ({ideas.length})
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

      {ideas.map((idea) => {
        const eval_ = idea.ai_evaluation
        const isOpen = expandedId === idea.id
        const isSelected = selectedIds.has(idea.id)
        const isMenuOpen = menuOpenId === idea.id

        return (
          <div
            key={idea.id}
            className={`bg-white/5 rounded-xl overflow-hidden border transition-colors ${
              isSelected
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Hoved-række */}
            <div className="flex items-center gap-3 px-3 py-3">
              {/* Checkbox i select-mode, ellers score-badge */}
              {selectMode ? (
                <button
                  onClick={() => toggleSelect(idea.id)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  {isSelected && <span className="text-xs leading-none">✓</span>}
                </button>
              ) : (
                eval_ && (
                  <span className={`shrink-0 text-sm font-bold w-9 h-9 flex items-center justify-center rounded-full border ${scoreColor(eval_.score)}`}>
                    {eval_.score}
                  </span>
                )
              )}

              {/* Tekst – klikbar for at ekspandere */}
              <p
                className="flex-1 text-white/80 text-sm leading-snug cursor-pointer"
                onClick={() => !selectMode && setExpandedId(isOpen ? null : idea.id)}
              >
                {excerpt(idea.formatted_text)}
              </p>

              {/* Handlingsknapper */}
              <div className="shrink-0 flex items-center gap-1">
                {!selectMode && (
                  <span
                    className="text-white/30 text-xs cursor-pointer hover:text-white/60 px-1"
                    onClick={() => setExpandedId(isOpen ? null : idea.id)}
                  >
                    {isOpen ? '▲' : '▼'}
                  </span>
                )}

                {/* Menu-knap */}
                <div className="relative" ref={isMenuOpen ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(isMenuOpen ? null : idea.id)
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
                        className="absolute right-0 top-8 z-10 bg-zinc-800 border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[120px]"
                      >
                        <button
                          onClick={() => markForDelete(idea.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Fjern
                        </button>
                        <button
                          disabled
                          className="w-full text-left px-4 py-2.5 text-sm text-white/20 cursor-not-allowed"
                        >
                          Rediger
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Udvidet detalje */}
            <AnimatePresence initial={false}>
              {isOpen && !selectMode && eval_ && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/10 pt-3">
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
