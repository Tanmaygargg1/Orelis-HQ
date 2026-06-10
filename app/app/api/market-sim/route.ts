import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { action, industry, market, decision, newsContext, bizContext } = await req.json()
  const g = getGroq()

  if (action === 'news') {
    const c = await g.chat.completions.create({
      model: MODEL, temperature: 0.6, max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a SEA business intelligence analyst. Generate 6 realistic, current-sounding market news headlines and briefs for a ${industry} business operating in ${market || 'Southeast Asia'}. Make them specific, plausible, and relevant to today's business environment.\n\nReturn ONLY valid JSON:\n{"news":[{"id":"1","headline":"Short punchy headline","summary":"2-sentence summary with specific data point","impact":"positive","tag":"Funding"},{"id":"2","headline":"","summary":"","impact":"positive","tag":"Technology"},{"id":"3","headline":"","summary":"","impact":"negative","tag":"Regulation"},{"id":"4","headline":"","summary":"","impact":"neutral","tag":"Economy"},{"id":"5","headline":"","summary":"","impact":"positive","tag":"Consumer"},{"id":"6","headline":"","summary":"","impact":"negative","tag":"Competitor"}],"marketSentiment":"bullish","sentimentReason":"one sentence"}`
      }]
    })
    try {
      const raw = c.choices[0].message.content || '{}'
      const clean = raw.replace(/```json|```/g, '').trim()
      return NextResponse.json(JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1)))
    } catch { return NextResponse.json({ news: [] }) }
  }

  if (action === 'simulate') {
    const sys = `You are a business strategy simulator for SEA markets. Given a specific business and their decision, simulate the realistic outcome against current market conditions. Be specific — use numbers relevant to their stage and size. Return ONLY valid JSON with these exact keys: immediateEffect, revenueImpact, riskLevel (Low|Medium|High), timeToResult, probabilityOfSuccess (integer 0-100), bestCase, worstCase, keyDependencies (array of 3 strings), recommendation, nextAction, marketAlignment`

    const c = await g.chat.completions.create({
      model: MODEL, temperature: 0.4, max_tokens: 800,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Industry: ${industry}\nMarket: ${market}\n${bizContext ? `\nBusiness:\n${bizContext}\n` : ''}Decision to test: ${decision}\n\nCurrent market conditions:\n${newsContext || 'General SEA market conditions'}` }
      ]
    })
    try {
      const raw = c.choices[0].message.content || '{}'
      const clean = raw.replace(/```json|```/g, '').trim()
      return NextResponse.json(JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1)))
    } catch { return NextResponse.json({}) }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
