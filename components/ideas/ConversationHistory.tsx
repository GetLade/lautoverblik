'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'
import { Conversation } from '@/types'

interface Props {
  refreshTrigger?: number
  onLoad?: (conversation: Conversation) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export default function ConversationHistory({ refreshTrigger, onLoad }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function fetchConversations() {
    const { data } = await getSupabase()
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
    setConversations((data as Conversation[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()
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
    await getSupabase().from('conversations').delete().in('id', [...selectedIds])
    setSelectedIds(new Set())
    setExpandedId(null)
    await fetchConversations()
    setDeleting(false)
  }

  const selectMode = selectedIds.size > 0

  if (loading) {
    return (
      <div className="text-white/30 text-sm text-center py-8 animate-pulse">
        Henter samtaler…
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-white/30 text-sm text-center py-8">
        Ingen gemte samtaler endnu
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">
          Samtaler ({conversations.length})
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

      {conversations.map((conv) => {
        const isOpen = expandedId === conv.id
        const isSelected = selectedIds.has(conv.id)
        const isMenuOpen = menuOpenId === conv.id
        const userMsgCount = conv.messages.filter((m) => m.role === 'user').length

        return (
          <div
            key={conv.id}
            className={`bg-white/5 rounded-xl overflow-hidden border transition-colors ${
              isSelected
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Hoved-række */}
            <div className="flex items-center gap-3 px-3 py-3">
              {selectMode ? (
                <button
                  onClick={() => toggleSelect(conv.id)}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  {isSelected && <span className="text-xs leading-none">✓</span>}
                </button>
              ) : (
                <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/40 text-xs">
                  {userMsgCount}
                </span>
              )}

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => !selectMode && setExpandedId(isOpen ? null : conv.id)}
              >
                <p className="text-white/80 text-sm leading-snug truncate">
                  {conv.title}
                </p>
                <p className="text-white/30 text-xs mt-0.5">
                  {formatDate(conv.created_at)}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {!selectMode && (
                  <span
                    className="text-white/30 text-xs cursor-pointer hover:text-white/60 px-1"
                    onClick={() => setExpandedId(isOpen ? null : conv.id)}
                  >
                    {isOpen ? '▲' : '▼'}
                  </span>
                )}

                <div className="relative" ref={isMenuOpen ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(isMenuOpen ? null : conv.id)
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
                        className="absolute right-0 top-8 z-10 bg-zinc-800 border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                      >
                        {onLoad && (
                          <button
                            onClick={() => {
                              setMenuOpenId(null)
                              onLoad(conv)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
                          >
                            Genåbn
                          </button>
                        )}
                        <button
                          onClick={() => markForDelete(conv.id)}
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

            {/* Udvidet: vis beskeder */}
            <AnimatePresence initial={false}>
              {isOpen && !selectMode && (
                <motion.div
                  key="messages"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/10 pt-3 max-h-72 overflow-y-auto">
                    {conv.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-white/20 text-white/90'
                              : 'bg-white/5 text-white/70'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
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
