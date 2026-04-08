'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      if (response.ok) {
        router.push(redirect)
      } else {
        setError('Forkert pinkode')
        setPin('')
      }
    } catch (err) {
      setError('Noget gik galt')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[360px] px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[--accent]/15 border border-[--accent]/20 mb-4">
            <span className="w-5 h-5 rounded-full bg-[--accent] block" />
          </div>
          <h1 className="text-xl font-semibold text-[--text-primary]">LautoOverblik</h1>
          <p className="text-[--text-muted] text-sm mt-1">Indtast din pinkode for at fortsætte</p>
        </div>

        <div>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="
              w-full px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em]
              bg-[--bg-surface] border border-[--border-subtle]
              hover:border-[--border-default] focus:border-[--accent]/40
              rounded-xl text-[--text-primary] placeholder:text-[--text-muted]
              placeholder:tracking-normal focus:outline-none
              transition-colors duration-150
            "
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-xs text-center mt-2" role="alert">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pin.length !== 4 || loading}
          className="
            w-full py-3 bg-[--accent] hover:bg-[--accent-hover]
            text-white font-medium rounded-xl text-sm
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 cursor-pointer
          "
        >
          {loading ? 'Logger ind...' : 'Log ind'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--bg-base]">
      <Suspense fallback={<div className="text-[--text-muted] text-sm">Indlæser...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
