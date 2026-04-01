import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Nav from '@/components/ui/Nav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'LautoOverblik',
  description: 'Internt dashboard til Lauto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0f] text-white antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
