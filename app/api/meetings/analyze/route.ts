import { NextRequest } from 'next/server'
import { getLLMClient, getModel } from '@/lib/llm'
import type { MeetingKeyPoint, MeetingSpeakerSegment, MeetingSalesAnalysis } from '@/types'

const SYSTEM_PROMPT = `Du er en ekstremt præcis mødeanalyse-specialist.

TALEIDENTIFIKATION:
- Analyser hvem der stiller spørgsmål og hvem der svarer
- Den der stiller FLEST spørgsmål = "Konsulenten"
- Den der svarer på spørgsmålene = "Kunden"
- Brug disse to labels konsekvent overalt

Dit arbejde:
1. REPARATION: Korriger ALLE stavefejl. Gør sproget flydende og professionelt dansk.
2. STRUKTURERING: Dæk det KOMPLETTE transskript i speaker_segments – ingen tekst må udelades.
3. FORMATERING: corrected_transcript skal være en læsbar samtale med speaker-labels og linjeskift.
4. ANALYSE: Udtrækker mål, forventninger og næste skridt.

Du returnerer KUN valid JSON – INTET ANDET:
{
  "title": "<kort dansk mødetitel maks 60 tegn>",
  "summary": "<sammenhængende dansk opsummering i 3-5 sætninger>",
  "key_points": [
    { "text": "<punkt>", "category": "action|decision|note" }
  ],
  "corrected_transcript": "Konsulenten: [tekst]\\n\\nKunden: [tekst]\\n\\nKonsulenten: [tekst]...",
  "speaker_segments": [
    { "speaker": "Konsulenten", "timestamp": "0:00", "text": "<den fulde talte tekst>" },
    { "speaker": "Kunden", "timestamp": "0:45", "text": "<den fulde talte tekst>" }
  ],
  "goals_expectations": "<hvilke mål og forventninger blev diskuteret>",
  "next_steps": "<klare næste skridt: møde planlagt?, tilbud sendes?, etc>",
  "sales_analysis": {
    "outcome": "won|lost|pending",
    "outcome_summary": "<1-2 sætninger om mødets salgsmæssige udfald>",
    "closing_blockers": ["<indvendinger, usikkerhed, pris, timing, konkurrenter der forhindrede lukning>"],
    "strengths": ["<hvad gik godt: rapport-opbygning, behovsafdækning, præsentation, håndtering af indvendinger>"],
    "improvements": ["<konkrete forbedringer til næste salgsmøde>"],
    "score": <1-10>
  }
}

VIGTIGT om sales_analysis:
- outcome "won" = aftale/ordre blev bekræftet i mødet
- outcome "lost" = kunden afviste eller sagde eksplicit nej
- outcome "pending" = ingen klar beslutning endnu, sagen er åben
- score baseres på salgsmæssig performance: behovsafdækning, præsentation, indvendingshåndtering, fremdrift
- closing_blockers må gerne være tom liste hvis der ingen blokkere var
- Baser alt på hvad der faktisk fremgår af transskriptet

VIGTIGT om speaker_segments:
- Alle segmenter tilsammen skal dække 100% af transskriptet
- Intet talesprog må udelades
- Tidsstempler i format M:SS

Kategorier til key_points:
- action = konkrete handlinger med ansvarlig eller deadline
- decision = beslutninger der blev taget
- note = vigtige observationer eller informationer`

export async function POST(req: NextRequest) {
  const { transcript, duration } = await req.json()

  if (!transcript) {
    return Response.json({ error: 'Manglende transskript' }, { status: 400 })
  }

  try {
    const client = getLLMClient()
    const model = getModel()

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Varighed: ${Math.floor(duration / 60)} minutter\n\nTransskript:\n${transcript}`,
        },
      ],
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()

    let parsed: {
      title: string
      summary: string
      key_points: MeetingKeyPoint[]
      corrected_transcript?: string
      speaker_segments?: MeetingSpeakerSegment[]
      goals_expectations?: string
      next_steps?: string
      sales_analysis?: MeetingSalesAnalysis
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return Response.json(
        {
          title: 'Møde',
          summary: raw,
          key_points: [],
        },
        { status: 200 }
      )
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('Analyze error:', err)
    return Response.json({ error: 'Analyse mislykkedes' }, { status: 500 })
  }
}
