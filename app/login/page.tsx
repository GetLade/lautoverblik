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
    <div className="w-full max-w-sm px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white text-center">LautoOverblik</h1>
          <p className="text-gray-400 text-center mt-2">Indtast pinkode</p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
          disabled={loading}
          autoFocus
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={pin.length !== 4 || loading}
          className="w-full py-3 bg-white text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
        >
          {loading ? 'Logger ind...' : 'Log ind'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <Suspense fallback={<div className="text-white">Indlæser...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
