'use client'

import { useState } from 'react'
import IdeaGenerator from '@/components/ideas/IdeaGenerator'
import ConversationHistory from '@/components/ideas/ConversationHistory'
import { Conversation, Message } from '@/types'

export default function IdeaGeneratorPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loadedMessages, setLoadedMessages] = useState<Message[] | undefined>(undefined)
  const [generatorKey, setGeneratorKey] = useState(0)

  function handleLoad(conv: Conversation) {
    setLoadedMessages(conv.messages)
    setGeneratorKey((k) => k + 1)
  }

  return (
    <div className="px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6">Idégenerator</h1>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        {/* Chat */}
        <div className="flex-1 min-h-0 min-w-0">
          <IdeaGenerator
            key={generatorKey}
            initialMessages={loadedMessages}
            onConversationSaved={() => setRefreshTrigger((t) => t + 1)}
          />
        </div>
        {/* Historik */}
        <div className="w-full md:w-80 shrink-0 overflow-y-auto">
          <ConversationHistory
            refreshTrigger={refreshTrigger}
            onLoad={handleLoad}
          />
        </div>
      </div>
    </div>
  )
}
