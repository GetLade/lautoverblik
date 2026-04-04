'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Todo, TodoType } from '@/types'
import TodoList from '@/components/todos/TodoList'

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [activeTab, setActiveTab] = useState<TodoType>('daily')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTodos() {
      const { data } = await getSupabase()
        .from('todos')
        .select('*')
        .eq('completed', false)
        .order('created_at', { ascending: true })
      if (data) setTodos(data as Todo[])
      setLoading(false)
    }
    fetchTodos()
  }, [])

  function handleAdd(todo: Todo) {
    setTodos(prev => [...prev, todo])
  }

  function handleDelete(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function handleUpdate(updated: Todo) {
    setTodos(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const tabs: { label: string; value: TodoType }[] = [
    { label: 'Daglig', value: 'daily' },
    { label: 'Ugentlig', value: 'weekly' },
    { label: 'Rettelser', value: 'fixes' },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Opgaveliste</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/15'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/40">Indlæser...</p>
      ) : (
        <TodoList
          todos={todos}
          type={activeTab}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
