'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Todo, TodoType, TodoPriority } from '@/types'

interface Props {
  type: TodoType
  onAdd: (todo: Todo) => void
}

const priorityOptions: { label: string; value: TodoPriority; color: string; active: string }[] = [
  { label: 'Høj',    value: 'high',   color: 'bg-red-500',   active: 'ring-red-500/40 text-red-400' },
  { label: 'Mellem', value: 'medium', color: 'bg-amber-400', active: 'ring-amber-400/40 text-amber-400' },
  { label: 'Lav',    value: 'low',    color: 'bg-[--text-muted]', active: 'ring-white/20 text-[--text-secondary]' },
]

export default function TodoForm({ type, onAdd }: Props) {
  const [value, setValue] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)

    const { data, error } = await getSupabase()
      .from('todos')
      .insert({ title: value.trim(), type, completed: false, priority })
      .select()
      .single()

    if (!error && data) {
      onAdd(data as Todo)
      setValue('')
      setPriority('medium')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2.5">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Tilføj opgave..."
          disabled={loading}
          className="
            flex-1 bg-[--bg-surface] border border-[--border-subtle]
            hover:border-[--border-default] focus:border-[--accent]/40
            rounded-xl px-4 py-2.5 text-sm text-[--text-primary]
            placeholder:text-[--text-muted] outline-none
            transition-colors duration-150 disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          aria-label="Tilføj opgave"
          className="
            w-10 h-10 flex items-center justify-center rounded-xl
            bg-[--accent] hover:bg-[--accent-hover]
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 cursor-pointer flex-shrink-0
          "
        >
          <Plus size={18} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Priority selector */}
      <div className="flex gap-1.5">
        {priorityOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPriority(opt.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-150 cursor-pointer
              ${priority === opt.value
                ? `bg-white/8 ring-1 ${opt.active}`
                : 'bg-transparent text-[--text-muted] hover:text-[--text-secondary] hover:bg-white/4'
              }
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>
    </form>
  )
}
