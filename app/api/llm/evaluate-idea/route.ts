import { NextRequest } from 'next/server'
import { getLLMClient, getModel } from '@/lib/llm'

export async function POST(req: NextRequest) {
  const { text } = await req.json() as { text: string }

  const client = getLLMClient()
  const model = getModel()

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `Du er en erfaren forretningsrådgiver og AI-ekspert hos Lauto.
Evaluer idéer objektivt og konstruktivt.
Svar KUN med valid JSON i dette format (ingen markdown, ingen forklaringer udenfor JSON):
{
  "score": <1-10>,
  "pros": ["<fordel 1>", "<fordel 2>", ...],
  "cons": ["<ulempe 1>", "<ulempe 2>", ...],
  "improvements": ["<forbedring 1>", "<forbedring 2>", ...]
}`,
      },
      {
        role: 'user',
        content: `Evaluer denne idé: ${text}`,
      },
    ],
  })

  const content = response.choices[0].message.content ?? '{}'
  // Rens for eventuelle markdown-kodeblokke
  const clean = content.replace(/```json\n?|\n?```/g, '').trim()

  try {
    const evaluation = JSON.parse(clean)
    return Response.json(evaluation)
  } catch {
    return Response.json({ score: 0, pros: [], cons: [], improvements: [] }, { status: 422 })
  }
}
