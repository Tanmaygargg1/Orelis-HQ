import { NextRequest } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { messages, context, bizProfile } = await req.json()
    const g = getGroq()

    const profileCtx = bizProfile
      ? `\n\nBUSINESS PROFILE (use this — do not ask the user to repeat it):\nName: ${bizProfile.name||'not set'}\nDescription: ${bizProfile.description||'not set'}\nIndustry: ${bizProfile.industry||'not set'}\nMarket: ${bizProfile.market||'not set'}\nMRR: $${bizProfile.mrr||'unknown'}\nCustomers: ${bizProfile.customers||'unknown'}\nStage: ${bizProfile.stage||'unknown'}\nTeam: ${bizProfile.team||'unknown'}\nChallenge: ${bizProfile.challenge||'not set'}${bizProfile.rawText?`\nAdditional docs: ${bizProfile.rawText.slice(0,1000)}`:''}` : ''

    const ctxStr = context ? `\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context)}` : ''

    const sys = `You are a senior business advisor specialising in Southeast Asian markets. Direct, specific, actionable. Never generic frameworks. Brutally honest — if something is a bad idea, say so clearly. Always end with one concrete action the user can take today.${profileCtx}${ctxStr}`

    const stream = await g.chat.completions.create({
      model: MODEL, temperature: 0.6, max_tokens: 1000, stream: true,
      messages: [{ role:'system', content:sys }, ...messages]
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
    return new Response(JSON.stringify({ error: e?.message||'AI error' }), { status:500, headers:{'Content-Type':'application/json'} })
  }
}
