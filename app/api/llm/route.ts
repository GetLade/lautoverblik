import { NextRequest } from 'next/server'
import { getLLMClient, getModel } from '@/lib/llm'
import { Message } from '@/types'

export async function POST(req: NextRequest) {
  const { messages, system, stream: shouldStream = false } = await req.json() as {
    messages: Message[]
    system?: string
    stream?: boolean
  }

  const client = getLLMClient()
  const model = getModel()

  if (shouldStream) {
    const stream = await client.chat.completions.create({
      model,
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        ...messages,
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const response = await client.chat.completions.create({
    model,
    messages: [
      ...(system ? [{ role: 'system' as const, content: system }] : []),
      ...messages,
    ],
  })

  return Response.json({ content: response.choices[0].message.content })
}
