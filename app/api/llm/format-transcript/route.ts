import { NextRequest } from 'next/server'
import { getLLMClient, getModel } from '@/lib/llm'

export async function POST(req: NextRequest) {
  const { transcript } = await req.json() as { transcript: string }

  const client = getLLMClient()
  const model = getModel()

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `Du formaterer taleindtastninger til sammenhængende, velformuleret tekst på dansk.
Fjern: ø-lyde, "øhm", "altså", "ligesom", "sådan set", unødvendige gentagelser.
Bevar: den originale mening og alle konkrete detaljer.
Svar KUN med den formaterede tekst – ingen forklaring, ingen intro.`,
      },
      {
        role: 'user',
        content: transcript,
      },
    ],
  })

  return Response.json({ text: response.choices[0].message.content })
}
