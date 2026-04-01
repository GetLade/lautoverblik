import IdeaCapture from '@/components/ideas/IdeaCapture'

export default function IdeaCapturePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Idé-capture</h1>
      <p className="text-white/40 text-sm mb-8">Optag din idé – AI formaterer og vurderer den.</p>
      <IdeaCapture />
    </div>
  )
}
