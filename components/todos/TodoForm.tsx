'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Todo, TodoType } from '@/types'

interface Props {
  type: TodoType
  onAdd: (todo: Todo) => void
}

export default function TodoForm({ type, onAdd }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)

    const { data, error } = await getSupabase()
      .from('todos')
      .insert({ title: value.trim(), type, completed: false })
      .select()
      .single()

    if (!error && data) {
      onAdd(data as Todo)
      setValue('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
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
    </form>
  )
}
