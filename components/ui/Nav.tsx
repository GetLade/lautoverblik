'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Overblik', emoji: '🏠' },
  { href: '/todos', label: 'Opgaver', emoji: '✅' },
  { href: '/idea-generator', label: 'Idégenerator', emoji: '🤖' },
  { href: '/idea-capture', label: 'Idé-capture', emoji: '🎤' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/10 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-1">
        <span className="text-white font-bold mr-4">Lauto</span>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
              pathname === link.href
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <span>{link.emoji}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
