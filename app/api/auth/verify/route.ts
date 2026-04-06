import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const expectedPin = process.env.SITE_PIN?.trim()
    console.log('Received PIN:', JSON.stringify(pin))
    console.log('Expected PIN:', JSON.stringify(expectedPin))
    console.log('Match:', pin === expectedPin)

    // Compare with server-side env var (never exposed to client)
    if (pin === expectedPin) {
      const response = NextResponse.json({ success: true })

      // Set httpOnly cookie (cannot be accessed via JavaScript)
      response.cookies.set('pin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      })

      return response
    }

    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  } catch (error) {
    console.error('PIN verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
