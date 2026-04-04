'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Todo, TodoType, TodoPriority } from '@/types'

interface Props {
  type: TodoType
  onAdd: (todo: Todo) => void
}

const priorityOptions: { label: string; value: TodoPriority; color: string }[] = [
  { label: 'Høj', value: 'high', color: 'bg-red-500' },
  { label: 'Mellem', value: 'medium', color: 'bg-yellow-500' },
  { label: 'Lav', value: 'low', color: 'bg-white/30' },
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
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Tilføj opgave..."
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-lg text-white transition-colors"
        >
          +
        </button>
      </div>
      <div className="flex gap-2">
        {priorityOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPriority(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              priority === opt.value
                ? 'bg-white/15 text-white'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>
    </form>
  )
}
