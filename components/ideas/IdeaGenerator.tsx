'use client'

import { useState, useRef, useEffect } from 'react'
import { Message } from '@/types'

const SYSTEM_PROMPT = `Du er en erfaren AI-automatiserings- og forretningskonsulent hos Lauto.
Din opgave er at hjælpe med at identificere og diskutere løsninger på virksomheders procesudfordringer.

Fokuser på praktiske automation-løsninger som:
- N8N (workflow-automation)
- Make (tidligere Integromat)
- Zapier
- AI-agenter og LLM-integrationer
- Custom scripts og API-integrationer
- CRM-systemer og procesoptimering

Stil opklarende spørgsmål, identificér rodårsager og foreslå konkrete løsninger.
Svar på dansk. Vær direkte og praktisk.`

export default function IdeaGenerator() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, system: SYSTEM_PROMPT, stream: true }),
    })

    if (!response.body) { setLoading(false); return }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let assistantText = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistantText += decoder.decode(value, { stream: true })
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: assistantText }
        return updated
      })
    }

    setLoading(false)
  }

  function handleClear() {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat-historik */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
        {messages.length === 0 && (
          <div className="text-white/30 text-sm text-center py-12">
            <p className="text-4xl mb-3">🤖</p>
            <p>Beskriv en virksomheds procesudfordringer,</p>
            <p>og jeg hjælper med at finde automation-løsninger.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-white text-black rounded-br-sm'
                  : 'bg-white/10 text-white/90 rounded-bl-sm'
              }`}
            >
              {msg.content || (
                <span className="opacity-50 animate-pulse">Tænker...</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 pt-4">
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-white/30 hover:text-white/60 text-xs mb-2 transition-colors"
          >
            Ryd samtale
          </button>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
            placeholder="Beskriv udfordringen eller processen..."
            rows={3}
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/30 resize-none transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 bg-white/10 hover:bg-white/20 disabled:opacity-40 rounded-xl text-white transition-colors self-end py-3"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
