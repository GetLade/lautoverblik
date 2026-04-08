'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Lightbulb, Mic, ClipboardList, Users, Timer } from 'lucide-react'

const links = [
  { href: '/',                label: 'Overblik',     icon: LayoutDashboard },
  { href: '/todos',           label: 'Opgaver',       icon: CheckSquare },
  { href: '/crm',             label: 'CRM',           icon: Users },
  { href: '/time-tracking',   label: 'Tid',           icon: Timer },
  { href: '/meetings',        label: 'Møder',         icon: ClipboardList },
  { href: '/idea-generator',  label: 'Idégenerator',  icon: Lightbulb },
  { href: '/idea-capture',    label: 'Idé-capture',   icon: Mic },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[--border-subtle] bg-[--bg-base]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1">
        <span className="text-[--text-primary] font-semibold text-sm tracking-tight mr-4 select-none">
          Lauto
        </span>
        <div className="flex items-center gap-0.5">
          {links.map(link => {
            const Icon = link.icon
            const active = link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer
                  ${active
                    ? 'text-[--text-primary] bg-white/[0.08]'
                    : 'text-[--text-muted] hover:text-[--text-secondary] hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? 'text-[--accent]' : ''}
                />
                <span className="hidden md:inline">{link.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-px bg-[--accent] rounded-full opacity-60" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
