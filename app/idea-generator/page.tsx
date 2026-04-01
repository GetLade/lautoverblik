import IdeaGenerator from '@/components/ideas/IdeaGenerator'

export default function IdeaGeneratorPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-6">Idégenerator</h1>
      <div className="flex-1 min-h-0">
        <IdeaGenerator />
      </div>
    </div>
  )
}
