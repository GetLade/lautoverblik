import Link from 'next/link'

const features = [
  {
    href: '/todos',
    emoji: '✅',
    title: 'Opgaveliste',
    description: 'Daglige og ugentlige to-dos med animation',
    color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  },
  {
    href: '/idea-generator',
    emoji: '🤖',
    title: 'Idégenerator',
    description: 'Diagnosticér procesudfordringer og find automation-løsninger',
    color: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
  },
  {
    href: '/idea-capture',
    emoji: '🎤',
    title: 'Idé-capture',
    description: 'Indtal dine idéer – AI formaterer og vurderer dem',
    color: 'from-sky-500/10 to-sky-500/5 border-sky-500/20',
  },
  {
    href: '/meetings',
    emoji: '📋',
    title: 'Mødeoptager',
    description: 'Optag møder – AI transskriberer og opsummerer automatisk',
    color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  },
]

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">God dag 👋</h1>
        <p className="text-white/40 mt-1">Hvad vil du arbejde på i dag?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {features.map(f => (
          <Link
            key={f.href}
            href={f.href}
            className={`bg-gradient-to-br ${f.color} border rounded-2xl p-6 flex items-start gap-4 hover:brightness-110 transition-all`}
          >
            <span className="text-3xl">{f.emoji}</span>
            <div>
              <h2 className="text-white font-semibold">{f.title}</h2>
              <p className="text-white/50 text-sm mt-0.5">{f.description}</p>
            </div>
            <span className="ml-auto text-white/20 self-center text-xl">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
