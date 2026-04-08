import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/ui/Nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'LautoOverblik',
  description: 'Internt dashboard til Lauto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${inter.variable} h-full`}>
      <body className="min-h-dvh text-[--text-primary] antialiased">
        <Nav />
        <main className="pt-[57px]">{children}</main>
      </body>
    </html>
  )
}
