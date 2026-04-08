'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Pencil, Trash2, Check } from 'lucide-react'
import { Todo, TodoPriority } from '@/types'
import { getSupabase } from '@/lib/supabase'

interface Props {
  todo: Todo
  onDelete: (id: string) => void
  onUpdate: (updated: Todo) => void
}

const priorityCycle: TodoPriority[] = ['high', 'medium', 'low']

const priorityConfig: Record<TodoPriority, { dot: string; ring: string; title: string }> = {
  high:   { dot: 'bg-red-500',    ring: 'ring-red-500/30',    title: 'Høj prioritet' },
  medium: { dot: 'bg-amber-400',  ring: 'ring-amber-400/30',  title: 'Mellem prioritet' },
  low:    { dot: 'bg-[--text-muted]', ring: 'ring-white/10',  title: 'Lav prioritet' },
}

export default function TodoItem({ todo, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.title)
  const [completing, setCompleting] = useState(false)

  async function handleToggle() {
    if (todo.completed || completing) return
    setCompleting(true)
    setTimeout(async () => {
      await getSupabase().from('todos').update({ completed: true }).eq('id', todo.id)
      onDelete(todo.id)
    }, 500)
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

  const pc = priorityConfig[todo.priority]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={
        completing
          ? { opacity: 0, x: 40, scale: 0.97 }
          : { opacity: 1, x: 0, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, x: 40, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-[--bg-surface] border border-[--border-subtle] hover:border-[--border-default] transition-colors duration-150"
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        aria-label="Marker som færdig"
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          transition-all duration-150 cursor-pointer
          ${completing
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-[--border-default] hover:border-emerald-400 hover:bg-emerald-400/10'
          }
        `}
      >
        {completing && <Check size={10} strokeWidth={3} className="text-white" />}
      </button>

      {/* Priority dot */}
      <button
        onClick={handleCyclePriority}
        title={pc.title}
        aria-label={pc.title}
        className={`flex-shrink-0 w-2 h-2 rounded-full ring-4 ${pc.dot} ${pc.ring} transition-transform duration-150 hover:scale-150 cursor-pointer`}
      />

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSaveEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="flex-1 bg-transparent text-[--text-primary] outline-none border-b border-[--border-default] pb-0.5 text-sm"
        />
      ) : (
        <span
          className="flex-1 text-[--text-secondary] text-sm cursor-pointer select-none"
          onDoubleClick={() => setEditing(true)}
        >
          {todo.title}
        </span>
      )}

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => setEditing(true)}
          aria-label="Rediger opgave"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[--text-muted] hover:text-[--text-secondary] hover:bg-white/5 transition-colors duration-150 cursor-pointer"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          aria-label="Slet opgave"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[--text-muted] hover:text-red-400 hover:bg-red-400/10 transition-colors duration-150 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.li>
  )
}
