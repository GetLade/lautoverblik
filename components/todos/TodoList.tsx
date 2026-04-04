'use client'

import { AnimatePresence } from 'framer-motion'
import { Todo, TodoType, TodoPriority } from '@/types'
import TodoItem from './TodoItem'
import TodoForm from './TodoForm'

interface Props {
  todos: Todo[]
  type: TodoType
  onAdd: (todo: Todo) => void
  onDelete: (id: string) => void
  onUpdate: (updated: Todo) => void
}

const priorityOrder: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 }

export default function TodoList({ todos, type, onAdd, onDelete, onUpdate }: Props) {
  const filtered = todos
    .filter(t => t.type === type && !t.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return (
    <div>
      {filtered.length === 0 ? (
        <p className="text-white/30 text-sm py-4 text-center">Ingen opgaver endnu 🎉</p>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
      <TodoForm type={type} onAdd={onAdd} />
    </div>
  )
}
