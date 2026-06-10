import { NextRequest } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
  const { ideaName, ideaDescription, messages } = await req.json()
  const g = getGroq()
  const sys = `You are an expert startup advisor helping a founder develop their idea: "${ideaName}". Description: "${ideaDescription}". Ask probing questions to help them think deeper. Be direct, specific, and SEA-focused. Keep responses concise (2-3 sentences max). Uncover assumptions, suggest validation steps, and challenge weak points.`
  const stream = await g.chat.completions.create({
    model: MODEL, temperature: 0.6, max_tokens: 300, stream: true,
    messages: [{ role: 'system', content: sys }, ...messages]
  })
  const enc = new TextEncoder()
  return new Response(new ReadableStream({
    async start(c) {
      for await (const chunk of stream) {
        const t = chunk.choices[0]?.delta?.content || ''
        if (t) c.enqueue(enc.encode(t))
      }
      c.close()
    }
  }), { headers: { 'Content-Type': 'text/plain' } })

  } catch (e: any) {
    console.error('Route error:', e?.message)
    return new Response(JSON.stringify({ error: e?.message || 'AI service error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
