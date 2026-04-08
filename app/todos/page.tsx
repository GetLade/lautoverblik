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
    { label: 'Daglig',    value: 'daily' },
    { label: 'Ugentlig',  value: 'weekly' },
    { label: 'Rettelser', value: 'fixes' },
  ]

  const counts = {
    daily:  todos.filter(t => t.type === 'daily'  && !t.completed).length,
    weekly: todos.filter(t => t.type === 'weekly' && !t.completed).length,
    fixes:  todos.filter(t => t.type === 'fixes'  && !t.completed).length,
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium text-[--accent] uppercase tracking-wide mb-1.5">Opgaver</p>
        <h1 className="text-2xl font-semibold text-[--text-primary] tracking-tight">Opgaveliste</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1 bg-[--bg-surface] border border-[--border-subtle] rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-all duration-150 cursor-pointer
              ${activeTab === tab.value
                ? 'bg-[--bg-elevated] text-[--text-primary] shadow-sm'
                : 'text-[--text-muted] hover:text-[--text-secondary]'
              }
            `}
          >
            {tab.label}
            {counts[tab.value] > 0 && (
              <span className={`
                inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold
                ${activeTab === tab.value ? 'bg-[--accent]/20 text-[--accent]' : 'bg-white/5 text-[--text-muted]'}
              `}>
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 rounded-xl bg-[--bg-surface] animate-pulse border border-[--border-subtle]" />
          ))}
        </div>
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
