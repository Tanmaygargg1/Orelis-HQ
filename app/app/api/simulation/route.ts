import { NextRequest } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
  const { inputs, scenarios } = await req.json()
  const g = getGroq()
  const sys = `You are a financial analyst specialising in Southeast Asian startups. BRUTALLY HONEST — never soften numbers. If unit economics are broken, say they are broken. If the business will run out of cash, say so. Use real SEA benchmarks. Do not round viabilityStatus to "Promising" when data says "Not Viable". JSON only:
{"verdict":"2-3 sentence assessment","viabilityStatus":"Viable","breakEvenMonth":8,"runwayMonths":14,"ltvCacRatio":3.2,"whatWorks":["strength 1","strength 2","strength 3"],"whatToFix":[{"issue":"issue","impact":"impact","fix":"specific fix"},{"issue":"","impact":"","fix":""},{"issue":"","impact":"","fix":""}],"thirtyDayPlan":[{"action":"title","description":"2 sentences","outcome":"result"},{"action":"","description":"","outcome":""},{"action":"","description":"","outcome":""}],"seaContext":"2-3 sentences on SEA market comparison"}`
  const stream = await g.chat.completions.create({
    model: MODEL, temperature: 0.3, stream: true,
    messages: [{ role:'system', content:sys }, { role:'user', content:`Inputs: ${JSON.stringify(inputs)}\nBear M24 MRR: $${scenarios.bear}\nBase M24 MRR: $${scenarios.base}\nBull M24 MRR: $${scenarios.bull}\nCash at M24: $${scenarios.cash}` }]
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
