import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { name, base64 } = await req.json()
    const buffer = Buffer.from(base64, 'base64')

    // Step 1: Extract raw text from PDF using pdf-parse (free, no external API)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse/lib/pdf-parse.js')
    const parsed = await pdfParse(buffer)
    const rawText = parsed.text || ''

    if (!rawText.trim()) {
      return NextResponse.json({
        text: `[PDF: ${name}] — no readable text found (scanned/image PDF not supported)`,
        preview: 'No text could be extracted. The PDF may be scanned or image-based.',
        pageCount: parsed.numpages || 0,
      })
    }

    // Step 2: Use Groq to convert raw extracted text into clean markdown
    // This normalises whitespace, fixes encoding artifacts, restores structure
    const groq = getGroq()
    const cleanResult = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Convert this raw PDF-extracted text into clean, structured markdown. 
Preserve all numbers, financial figures, dates, names, and key data exactly.
Fix spacing/encoding issues. Use ## for sections, **bold** for key terms, tables where relevant.
Do NOT summarise — output the full cleaned content.

RAW TEXT (first 6000 chars):
${rawText.slice(0, 6000)}`
      }]
    })

    const markdown = cleanResult.choices[0]?.message?.content || rawText.slice(0, 4000)

    return NextResponse.json({
      text: markdown,
      preview: markdown.slice(0, 600),
      pageCount: parsed.numpages || 0,
      charCount: rawText.length,
    })
  } catch (e: any) {
    console.error('PDF extract error:', e?.message)
    return NextResponse.json({
      text: '[PDF] — extraction failed. Check pdf-parse is installed.',
      preview: `Error: ${e?.message || 'unknown'}`,
      pageCount: 0,
    })
  }
}
