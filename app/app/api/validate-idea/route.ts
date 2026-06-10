import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { stage, idea, industry, market, answers } = await req.json()
  const g = getGroq()

  // Stage 1: generate follow-up questions
  if (stage === 'questions') {
    const res = await g.chat.completions.create({
      model: MODEL, temperature: 0.4, max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are a startup advisor. A founder described this idea: "${idea}" (Industry: ${industry}, Market: ${market}).
Generate 4 follow-up questions to deeply understand their idea before giving a validation report. Mix MCQ and open-ended.
Return ONLY valid JSON:
{"questions":[
  {"id":"q1","type":"mcq","question":"What is your primary revenue model?","options":["Subscription","One-time purchase","Marketplace commission","Freemium","Other"]},
  {"id":"q2","type":"open","question":"Who specifically is your first customer? Describe them in one sentence.","options":null},
  {"id":"q3","type":"mcq","question":"How have you validated demand so far?","options":["Talked to 10+ potential customers","Have a waitlist","Have paying customers","Have not validated yet","Other research"]},
  {"id":"q4","type":"open","question":"What is the one thing that must be true for this to work?","options":null}
]}`
      }]
    })
    try {
      const raw = res.choices[0].message.content || '{}'
      const clean = raw.replace(/```json|```/g,'').trim()
      return NextResponse.json(JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}')+1)))
    } catch { return NextResponse.json({ questions: [] }) }
  }

  // Stage 2: full validation report
  const answerBlock = answers?.map((a: {q:string;a:string}) => `Q: ${a.q}\nA: ${a.a}`).join('\n\n') || ''
  const sys = `You are a senior startup advisor specialising in Southeast Asian markets. You are BRUTALLY HONEST and STRICT. Never inflate scores. Score 0-30 for vague, unvalidated, or generic ideas with no clear differentiation. Score 31-50 for ideas with a real problem but weak execution plan. Score 51-70 for solid ideas with some validation. Score 71-85 only for ideas with clear differentiation, evidence of demand, and a realistic path. Score 86+ only for ideas with paying customers or strong market proof. If the founder gave vague or nonsensical input, score below 25 and say so directly. Never give a middle-of-the-road score to avoid hurting feelings. JSON only:
{"viabilityScore":72,"verdict":"one sentence honest verdict","marketOpportunity":{"size":"estimated SEA market size","demandSignals":["signal 1","signal 2"],"timingVerdict":"Good","timingReason":"one sentence"},"competitors":{"existing":["name 1","name 2"],"gap":"what gap exists","saturation":"Low"},"firstCustomer":{"profile":"specific person","whereToFind":"specific channel","whatTheyCareAbout":"top concerns"},"topRisks":[{"title":"risk","why":"why matters","mitigation":"one action"},{"title":"","why":"","mitigation":""},{"title":"","why":"","mitigation":""}],"firstSevenDays":["action 1","action 2","action 3"],"keyInsight":"one paragraph insight based on their specific answers that most advisors would miss"}`

  const stream = await g.chat.completions.create({
    model: MODEL, temperature: 0.4, stream: true,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Idea: ${idea}\nIndustry: ${industry}\nMarket: ${market}\n\nFounder answers:\n${answerBlock}` }
    ]
  })
  const enc = new TextEncoder()
  return new Response(new ReadableStream({
    async start(c) {
      for await (const chunk of stream) { const t = chunk.choices[0]?.delta?.content||''; if(t) c.enqueue(enc.encode(t)) }
      c.close()
    }
  }), { headers: { 'Content-Type': 'text/plain' } })
}
