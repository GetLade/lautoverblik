import type { Meeting, MeetingSalesAnalysis, MeetingSpeakerSegment } from '@/types'

export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export async function downloadMeetingPDF(meeting: Meeting): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const maxWidth = pageWidth - margin * 2
  let y = 20

  // Titel
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(meeting.title, margin, y)
  y += 10

  // Dato + varighed
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  const dateStr = new Date(meeting.created_at).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(`${dateStr}  ·  Varighed: ${formatDuration(meeting.duration)}`, margin, y)
  y += 12
  doc.setTextColor(0)

  // Opsummering
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Opsummering', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const summaryLines = doc.splitTextToSize(meeting.summary, maxWidth)
  doc.text(summaryLines, margin, y)
  y += summaryLines.length * 5 + 12

  // Centrale punkter
  if (meeting.key_points.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Centrale punkter', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    for (const kp of meeting.key_points) {
      const prefix =
        kp.category === 'action' ? '-> ' : kp.category === 'decision' ? 'V  ' : '-  '
      const lines = doc.splitTextToSize(`${prefix}${kp.text}`, maxWidth - 4)
      if (y + lines.length * 5 > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 3
    }
    y += 8
  }

  // Mål og forventninger
  if (meeting.goals_expectations) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.text('Mål og forventninger', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const goalsLines = doc.splitTextToSize(meeting.goals_expectations, maxWidth)
    doc.text(goalsLines, margin, y)
    y += goalsLines.length * 5 + 10
  }

  // Næste skridt
  if (meeting.next_steps) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.text('Næste skridt', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const nextLines = doc.splitTextToSize(meeting.next_steps, maxWidth)
    doc.text(nextLines, margin, y)
    y += nextLines.length * 5 + 10
  }

  // Salgsvurdering
  if (meeting.sales_analysis) {
    const sa: MeetingSalesAnalysis = meeting.sales_analysis
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (y > 260) { doc.addPage(); y = 20 }
    doc.text('Salgsvurdering', margin, y)
    y += 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const outcomeLabel = sa.outcome === 'won' ? 'Vundet' : sa.outcome === 'lost' ? 'Tabt' : 'Afventer'
    doc.text(`Resultat: ${outcomeLabel}  (score: ${sa.score}/10)`, margin, y)
    y += 6

    const summaryLines = doc.splitTextToSize(sa.outcome_summary, maxWidth)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 5

    if (sa.strengths.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Styrker:', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      for (const s of sa.strengths) {
        if (y > 280) { doc.addPage(); y = 20 }
        const lines = doc.splitTextToSize(`+ ${s}`, maxWidth - 4)
        doc.text(lines, margin + 2, y)
        y += lines.length * 5 + 2
      }
      y += 3
    }

    if (sa.improvements.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Forbedringsomrader:', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      for (const imp of sa.improvements) {
        if (y > 280) { doc.addPage(); y = 20 }
        const lines = doc.splitTextToSize(`-> ${imp}`, maxWidth - 4)
        doc.text(lines, margin + 2, y)
        y += lines.length * 5 + 2
      }
      y += 3
    }

    if (sa.closing_blockers.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Lukning-blokkere:', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      for (const b of sa.closing_blockers) {
        if (y > 280) { doc.addPage(); y = 20 }
        const lines = doc.splitTextToSize(`! ${b}`, maxWidth - 4)
        doc.text(lines, margin + 2, y)
        y += lines.length * 5 + 2
      }
      y += 3
    }
    y += 7
  }

  // Talersegmenter
  if (meeting.speaker_segments && meeting.speaker_segments.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.text('Talersegmenter', margin, y)
    y += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    for (const seg of meeting.speaker_segments) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`${seg.speaker} (${seg.timestamp})`, margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(seg.text, maxWidth - 4)
      doc.text(lines, margin + 2, y)
      y += lines.length * 4 + 2
    }
    y += 6
  }

  // Transskription
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  if (y > 260) {
    doc.addPage()
    y = 20
  }
  doc.text('Fuld transskription', margin, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)

  const transcriptText = meeting.corrected_transcript || meeting.transcript
  const transcriptLines = doc.splitTextToSize(transcriptText, maxWidth)
  for (const line of transcriptLines) {
    if (y > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(line, margin, y)
    y += 5
  }

  const safeTitle = meeting.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 40) || 'moede'
  doc.save(`${safeTitle}.pdf`)
}
