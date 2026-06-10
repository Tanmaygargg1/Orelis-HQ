import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  const g = getGroq()
  const c = await g.chat.completions.create({
    model: MODEL, temperature: 0.1, max_tokens: 400,
    messages: [{ role:'user', content:`Extract financial metrics. Return ONLY JSON (null if not found):\n{"monthlyRevenue":null,"pricePerCustomer":null,"newCustomersMonth":null,"churnRate":null,"fixedCosts":null,"cac":null,"startingCash":null,"teamSize":null}\n\nDocument:\n${content.slice(0,4000)}` }]
  })
  try {
    const raw = c.choices[0].message.content || '{}'
    return NextResponse.json(JSON.parse(raw.replace(/```json|```/g,'').trim()))
  } catch { return NextResponse.json({}) }
}
