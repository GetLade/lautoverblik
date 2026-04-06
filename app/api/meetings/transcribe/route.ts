import { NextRequest } from 'next/server'
import { getLLMClient } from '@/lib/llm'
import { toFile } from 'openai'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) {
    return Response.json({ error: 'Ingen lydfil modtaget' }, { status: 400 })
  }

  const MAX_SIZE = 24 * 1024 * 1024 // 24MB
  if (audio.size > MAX_SIZE) {
    return Response.json(
      { error: 'Optagelsen er for stor til at behandle. Maksimum er 24 MB.' },
      { status: 413 }
    )
  }

  try {
    const client = getLLMClient()
    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const file = await toFile(buffer, audio.name, { type: audio.type })

    const result = await client.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'da',
      response_format: 'text',
    })

    return Response.json({ transcript: result })
  } catch (err) {
    console.error('Transcription error:', err)
    return Response.json({ error: 'Transskription mislykkedes' }, { status: 500 })
  }
}
