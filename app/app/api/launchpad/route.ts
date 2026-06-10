import { NextRequest } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
  const { idea, industry, market } = await req.json()
  const g = getGroq()
  const sys = `You are a senior startup advisor specialising in Southeast Asian markets. Give brutally honest, specific, data-informed feedback. Never generic. Respond ONLY with valid JSON:
{"viabilityScore":72,"verdict":"one sentence honest verdict","marketOpportunity":{"size":"estimated SEA market size","demandSignals":["signal 1","signal 2"],"timingVerdict":"Good","timingReason":"one sentence"},"competitors":{"existing":["name 1","name 2"],"gap":"what gap exists","saturation":"Low"},"firstCustomer":{"profile":"specific person","whereToFind":"specific place","whatTheyCareAbout":"top concerns"},"topRisks":[{"title":"risk","why":"why matters","mitigation":"one action"},{"title":"","why":"","mitigation":""},{"title":"","why":"","mitigation":""}],"firstSevenDays":["action 1","action 2","action 3"]}`
  const stream = await g.chat.completions.create({
    model: MODEL, temperature: 0.4, stream: true,
    messages: [{ role:'system', content:sys }, { role:'user', content:`Idea: ${idea}\nIndustry: ${industry}\nMarket: ${market}` }]
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
