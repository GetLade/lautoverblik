import Link from 'next/link'
import { CheckSquare, Lightbulb, Mic, ClipboardList, ArrowRight, Users, Timer } from 'lucide-react'

const features = [
  {
    href: '/todos',
    icon: CheckSquare,
    title: 'Opgaveliste',
    description: 'Daglige og ugentlige to-dos med animation ved færdiggørelse',
    accent: '#22d3ee',
    bg: 'rgba(34,211,238,0.06)',
    border: 'rgba(34,211,238,0.12)',
  },
  {
    href: '/crm',
    icon: Users,
    title: 'CRM',
    description: 'Kundeoversigt med GitHub repos, noter og filer tilknyttet',
    accent: '#f472b6',
    bg: 'rgba(244,114,182,0.06)',
    border: 'rgba(244,114,182,0.12)',
  },
  {
    href: '/time-tracking',
    icon: Timer,
    title: 'Tidsregistrering',
    description: 'Start/stop timer pr. kunde – se daglige og ugentlige totaler',
    accent: '#fbbf24',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.12)',
  },
  {
    href: '/meetings',
    icon: ClipboardList,
    title: 'Mødeoptager',
    description: 'Optag møder – AI transskriberer og opsummerer automatisk',
    accent: '#fb923c',
    bg: 'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.12)',
  },
  {
    href: '/idea-generator',
    icon: Lightbulb,
    title: 'Idégenerator',
    description: 'Diagnosticér procesudfordringer og find automation-løsninger',
    accent: '#a78bfa',
    bg: 'rgba(167,139,250,0.06)',
    border: 'rgba(167,139,250,0.12)',
  },
  {
    href: '/idea-capture',
    icon: Mic,
    title: 'Idé-capture',
    description: 'Indtal dine idéer – AI formaterer og vurderer dem',
    accent: '#34d399',
    bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.12)',
  },
]

export default function Home() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'God morgen' : hour < 18 ? 'God dag' : 'God aften'

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm font-medium text-[--accent] mb-2 tracking-wide uppercase">Dashboard</p>
        <h1 className="text-3xl font-semibold text-[--text-primary] tracking-tight">{greeting}</h1>
        <p className="text-[--text-muted] mt-1.5 text-sm">Hvad vil du arbejde på i dag?</p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 gap-3">
        {features.map(f => {
          const Icon = f.icon
          return (
            <Link
              key={f.href}
              href={f.href}
              style={{ background: f.bg, borderColor: f.border }}
              className="group border rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.01] hover:brightness-110 cursor-pointer"
            >
              {/* Icon badge */}
              <div
                style={{ color: f.accent, background: `${f.accent}18` }}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Icon size={20} strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h2 className="text-[--text-primary] font-medium text-sm">{f.title}</h2>
                <p className="text-[--text-muted] text-xs mt-0.5 leading-relaxed">{f.description}</p>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={16}
                className="text-[--text-muted] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
