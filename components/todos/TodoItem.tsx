'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Todo, TodoPriority } from '@/types'
import { getSupabase } from '@/lib/supabase'

interface Props {
  todo: Todo
  onDelete: (id: string) => void
  onUpdate: (updated: Todo) => void
}

const priorityCycle: TodoPriority[] = ['high', 'medium', 'low']

const priorityStyles: Record<TodoPriority, { dot: string; title: string }> = {
  high:   { dot: 'bg-red-500',    title: 'Høj prioritet' },
  medium: { dot: 'bg-yellow-500', title: 'Mellem prioritet' },
  low:    { dot: 'bg-white/30',   title: 'Lav prioritet' },
}

export default function TodoItem({ todo, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [completing, setCompleting] = useState(false)

  async function handleToggle() {
    if (todo.completed) return
    setCompleting(true)
    setTimeout(async () => {
      await getSupabase().from('todos').update({ completed: true }).eq('id', todo.id)
      onDelete(todo.id)
    }, 600)
  }

  async function handleSaveEdit() {
    if (!editValue.trim()) return
    await getSupabase().from('todos').update({ title: editValue.trim() }).eq('id', todo.id)
    onUpdate({ ...todo, title: editValue.trim() })
    setEditing(false)
  }

  async function handleDelete() {
    await getSupabase().from('todos').delete().eq('id', todo.id)
    onDelete(todo.id)
  }

  async function handleCyclePriority() {
    const current = priorityCycle.indexOf(todo.priority)
    const next = priorityCycle[(current + 1) % priorityCycle.length]
    await getSupabase().from('todos').update({ priority: next }).eq('id', todo.id)
    onUpdate({ ...todo, priority: next })
  }

  const ps = priorityStyles[todo.priority]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={
        completing
          ? { opacity: 0, x: 120, backgroundColor: '#22c55e' }
          : { opacity: 1, x: 0, backgroundColor: '#ffffff00' }
      }
      exit={{ opacity: 0, x: 120 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 group"
    >
      {/* Tjek-boks */}
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          completing ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-green-400'
        }`}
      >
        {completing && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Prioritets-prik */}
      <button
        onClick={handleCyclePriority}
        title={ps.title}
        className="flex-shrink-0 w-2.5 h-2.5 rounded-full transition-transform hover:scale-125"
      >
        <span className={`block w-2.5 h-2.5 rounded-full ${ps.dot}`} />
      </button>

      {/* Titel */}
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 bg-transparent text-white outline-none border-b border-white/30 pb-0.5"
        />
      ) : (
        <span
          className="flex-1 text-white/90 cursor-pointer"
          onDoubleClick={() => setEditing(true)}
        >
          {todo.title}
        </span>
      )}

      {/* Handlinger */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-white/40 hover:text-white/80 transition-colors text-sm"
          title="Rediger"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="text-white/40 hover:text-red-400 transition-colors text-sm"
          title="Slet"
        >
          🗑️
        </button>
      </div>
    </motion.li>
  )
}
