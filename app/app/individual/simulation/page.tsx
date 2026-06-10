'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts'
import { BASE_PATH } from '@/lib/config'

type GameState = 'idle'|'running'|'event'|'result'
type Choice = { label:string; effect:string; explanation:string; revMod:number; churnMod:number; correct:boolean }
type Event = { id:string; month:number; title:string; scenario:string; choices:Choice[] }
type ChartPoint = { month:number; revenue:number; cash:number }
type Idea = { id:string; title:string; description:string; industry:string; market:string; report?:any }
type DecisionResult = { verdict:string; probability:number; revenueImpact:string; timeframe:string; risks:string[]; opportunities:string[]; recommendation:string }

const EVENTS: Event[] = [
  { id:'viral', month:4, title:'🚀 Viral Moment on TikTok',
    scenario:'A 30-second TikTok about your concept hit 800k views. 200 inbound inquiries. You have 2 people and $18k left. What do you do?',
    choices:[
      { label:'Hire 3 people immediately', effect:'Triples headcount burn', explanation:'Hiring before validating whether inquiries convert is dangerous. Viral attention rarely equals paying customers. You\'ll burn cash fast.', revMod:1.05, churnMod:1.4, correct:false },
      { label:'Waitlist + personally message top 50', effect:'+15% conversion, stays lean', explanation:'Correct. Viral moments are for learning. Personal outreach to 50 qualified leads teaches you your customer while converting at higher rates than any paid channel.', revMod:1.35, churnMod:0.8, correct:true },
      { label:'Run paid ads to amplify momentum', effect:'High CAC before unit economics known', explanation:'Spending money to amplify organic traffic before you know your unit economics is a classic burn mistake.', revMod:1.2, churnMod:1.2, correct:false },
    ]},
  { id:'competitor', month:7, title:'⚔️ Funded Competitor Launches',
    scenario:'A YC-backed competitor launched with 3× your features, $2M raised, and a PR blitz. Your early interest is dropping. What\'s your move?',
    choices:[
      { label:'Match their features fast', effect:'Scope creep, quality tanks', explanation:'Competing on features against a funded team is a losing game. You\'ll always be behind and ship bugs.', revMod:0.8, churnMod:1.5, correct:false },
      { label:'Double down on one niche they ignore', effect:'Depth beats breadth', explanation:'Correct. Funded competitors go broad. Your edge is depth. Find the 20% of the market they don\'t care about and dominate it completely.', revMod:1.1, churnMod:0.75, correct:true },
      { label:'Drop price 30% to compete', effect:'Margin destroyed', explanation:'Price wars kill startups. You signal your product isn\'t worth more and attract customers who leave for anyone cheaper.', revMod:0.7, churnMod:1.0, correct:false },
    ]},
  { id:'crisis', month:10, title:'🔥 Team Crisis — Co-founder Leaves',
    scenario:'Your technical co-founder just resigned. You have 3 months of runway. The product needs major work. Investors are watching.',
    choices:[
      { label:'Pause everything, recruit replacement', effect:'3 months lost, runway burns', explanation:'Pausing kills momentum. Investors interpret silence as death. You need to keep shipping even imperfectly.', revMod:0.6, churnMod:1.3, correct:false },
      { label:'Cut scope to what you can ship alone + hire contractor', effect:'Ships slower but stays alive', explanation:'Correct. Reduce scope ruthlessly. A contractor covers critical gaps. Keep shipping. Investors respect execution under pressure.', revMod:0.9, churnMod:0.9, correct:true },
      { label:'Raise emergency bridge from current angels', effect:'Buys time but dilution', explanation:'Possible, but raising in crisis is expensive. Only valid if you have warm relationships. The equity cost is high.', revMod:1.0, churnMod:1.0, correct:false },
    ]},
  { id:'socialmedia', month:13, title:'📱 Social Media Crisis',
    scenario:'A Twitter thread goes viral claiming your product has a major privacy flaw — it\'s partially true but exaggerated. 50k impressions. Journalists are emailing.',
    choices:[
      { label:'Go silent and fix quietly', effect:'Silence = guilt in public perception', explanation:'Silence is the worst response. It confirms the worst version of the story and lets others define the narrative.', revMod:0.7, churnMod:1.6, correct:false },
      { label:'Post honest response: what\'s true, what\'s not, your fix timeline', effect:'Trust maintained', explanation:'Correct. Transparency wins. Acknowledge the partial truth immediately, clarify the exaggeration, commit to a specific fix date. Early responders almost always recover faster.', revMod:0.95, churnMod:0.85, correct:true },
      { label:'Hire a PR firm and issue formal press release', effect:'Slow, expensive, sounds defensive', explanation:'Corporate PR on a startup crisis sounds tone-deaf. Direct, personal communication from the founder outperforms agency responses every time.', revMod:0.85, churnMod:1.1, correct:false },
    ]},
  { id:'regulation', month:16, title:'⚖️ New Regulation Hits Your Market',
    scenario:'Your target market just announced regulations requiring you to obtain a license — 6-month process, $15k cost, legal review needed. You weren\'t expecting this.',
    choices:[
      { label:'Ignore it and keep operating', effect:'Legal risk, existential', explanation:'Operating without compliance is a single point of failure. Regulators can force shutdown overnight, destroying all user trust and potentially personal liability.', revMod:1.0, churnMod:1.5, correct:false },
      { label:'Pivot to adjacent market that isn\'t regulated', effect:'Delays but de-risks', explanation:'Valid short-term. But pivoting too fast abandons traction. Only do this if the regulatory burden is genuinely unworkable within your capital constraints.', revMod:0.85, churnMod:0.9, correct:false },
      { label:'Start compliance process now + communicate proactively to users', effect:'Costs time but builds trust', explanation:'Correct. Starting immediately puts you ahead of competitors. Proactive user communication about compliance actually builds trust — users prefer compliant products.', revMod:0.9, churnMod:0.7, correct:true },
    ]},
  { id:'naturaldisaster', month:19, title:'🌊 Regional Market Disruption',
    scenario:'A major flood has hit your primary market (Jakarta) for 3 weeks. 40% of your user base is affected. Infrastructure is down. Payments are failing.',
    choices:[
      { label:'Pause billing for affected users automatically', effect:'Short-term cost, long-term retention', explanation:'Correct. Proactively pausing billing for affected users costs you 3 weeks of revenue but generates enormous loyalty. Users remember who helped them during a crisis.', revMod:0.85, churnMod:0.5, correct:true },
      { label:'Continue normal operations — it\'s a temporary issue', effect:'Churn spike when users return', explanation:'Charging users who couldn\'t access your product during a disaster is a reputation destroyer in SEA markets, where community trust is paramount.', revMod:1.0, churnMod:1.8, correct:false },
      { label:'Offer 50% discount for the next month', effect:'Partial goodwill, lower trust than free pause', explanation:'A discount signals you\'re still billing during a crisis. A full pause signals you\'re on their side. The difference matters.', revMod:0.9, churnMod:0.9, correct:false },
    ]},
  { id:'fundraise', month:22, title:'💰 Series A Offer: 22% for $800k',
    scenario:'A local VC offers $800k for 22% equity. You have 6 months runway. Your MRR is $18k growing 12% MoM. Should you take it?',
    choices:[
      { label:'Accept — need the runway', effect:'Expensive dilution at wrong time', explanation:'22% at $800k implies $3.6M pre-money. At $18k MRR × 12 = $216k ARR, that\'s a 16× ARR multiple — fair. But 22% is aggressive. You have leverage. Negotiate.', revMod:1.2, churnMod:0.95, correct:false },
      { label:'Counter: 12% for $800k or 22% for $1.5M', effect:'Better cap table or more capital', explanation:'Correct. Your growth rate gives you leverage. A 12% counteroffer ($6.6M pre-money, 30× ARR) is aggressive but reasonable for 12% MoM growth. If they won\'t budge, take the deal — 22% is painful but $800k is real.', revMod:1.15, churnMod:0.9, correct:true },
      { label:'Decline and raise from angels instead', effect:'Slower but preserves equity', explanation:'Valid if you have warm angel relationships. But 6 months is not enough runway to play this safely. Angels close slower than VCs.', revMod:1.0, churnMod:1.0, correct:false },
    ]},
]

function buildData(events: {month:number;revMod:number;churnMod:number}[], idea?: Idea|null): ChartPoint[] {
  const base = idea ? 1500 : 3000
  let revenue = base, customers = base/50, cash = 20000
  const data: ChartPoint[] = []
  for (let m = 1; m <= 24; m++) {
    const ev = events.find(e=>e.month===m)
    const rm = ev?.revMod||1, cm = ev?.churnMod||1
    customers = customers*(1-(0.05*cm))+10*rm
    revenue = Math.round(customers*50*rm)
    cash = cash + revenue - 3200
    data.push({ month:m, revenue, cash })
  }
  return data
}

const f$ = (n:number) => n>=1000?`$${(n/1000).toFixed(1)}k`:`$${n}`

export default function IndSim() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [month, setMonth] = useState(0)
  const [data, setData] = useState<ChartPoint[]>([])
  const [applied, setApplied] = useState<{month:number;revMod:number;churnMod:number}[]>([])
  const [currentEv, setCurrentEv] = useState<Event|null>(null)
  const [selectedChoice, setSelectedChoice] = useState<number|null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [log, setLog] = useState<{month:number;event:string;choice:string;correct:boolean}[]>([])
  const [xp, setXp] = useState(0)
  const timerRef = useRef<NodeJS.Timeout|null>(null)

  // Idea linking
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<Idea|null>(null)
  const [showIdeaPicker, setShowIdeaPicker] = useState(false)

  // AI decision tester
  const [decision, setDecision] = useState('')
  const [decResult, setDecResult] = useState<DecisionResult|null>(null)
  const [decLoading, setDecLoading] = useState(false)
  const [decisionHistory, setDecisionHistory] = useState<{decision:string;result:DecisionResult}[]>([])

  useEffect(() => {
    const s = localStorage.getItem('orelis-launchpad-ideas')
    if (s) setIdeas(JSON.parse(s))
  }, [])

  function startGame() {
    setGameState('running'); setMonth(0); setData([]); setApplied([]); setLog([]); setCorrectCount(0); setXp(0)
    tick(1, [], [])
  }

  function tick(m:number, evs:{month:number;revMod:number;churnMod:number}[], lg:typeof log) {
    const next = EVENTS.find(e=>e.month===m && !evs.find(a=>a.month===m))
    if (next) { setMonth(m); setGameState('event'); setCurrentEv(next); setSelectedChoice(null); setShowResult(false); return }
    setData([...buildData(evs, selectedIdea).slice(0, m)]); setMonth(m)
    if (m >= 24) { setGameState('result'); return }
    timerRef.current = setTimeout(() => tick(m+1, evs, lg), 100)
  }

  function choose(i:number) {
    if (!currentEv || selectedChoice !== null) return
    setSelectedChoice(i); setShowResult(true)
    const ch = currentEv.choices[i]
    if (ch.correct) setCorrectCount(c=>c+1)
    setXp(x=>x+(ch.correct?100:25))
    const newEvs = [...applied, {month:currentEv.month, revMod:ch.revMod, churnMod:ch.churnMod}]
    setApplied(newEvs)
    const newLog = [...log, {month:currentEv.month, event:currentEv.title, choice:ch.label, correct:ch.correct}]
    setLog(newLog)
    setData(buildData(newEvs, selectedIdea).slice(0, currentEv.month))
  }

  function continueGame() {
    if (!currentEv) return
    const m = currentEv.month + 1
    setGameState('running'); setCurrentEv(null); setSelectedChoice(null); setShowResult(false)
    timerRef.current = setTimeout(() => tick(m, applied, log), 100)
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setGameState('idle'); setData([]); setMonth(0)
  }

  async function runDecision() {
    if (!decision.trim()) return
    setDecLoading(true); setDecResult(null)
    const ctx = selectedIdea ? `Idea being tested: "${selectedIdea.title}" — ${selectedIdea.description} (${selectedIdea.industry}, ${selectedIdea.market})` : 'General business concept'
    try {
      const res = await fetch(`${BASE_PATH}/api/advisor`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[{role:'user',content:`Simulate this specific decision for my concept: "${decision}". Context: ${ctx}. Respond ONLY as valid JSON with no markdown: {"verdict":"2 sentences","probability":65,"revenueImpact":"+20% over 6 months","timeframe":"3-6 months","risks":["risk1","risk2","risk3"],"opportunities":["opp1","opp2","opp3"],"recommendation":"one concrete next action"}`}]
        })
      })
      let text = ''
      const reader = res.body!.getReader(), dec = new TextDecoder()
      while (true) { const {done,value} = await reader.read(); if(done)break; text+=dec.decode(value) }
      const clean = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}')+1))
      setDecResult(parsed)
      setDecisionHistory(h=>[{decision, result:parsed}, ...h].slice(0,5))
    } catch {}
    setDecLoading(false)
  }

  const finalRev = data[data.length-1]?.revenue || 0
  const finalCash = data[data.length-1]?.cash || 0
  const pct = Math.round((correctCount/EVENTS.length)*100)
  const grade = pct>=80?'A':pct>=65?'B':pct>=50?'C':'D'
  const gradeColor = pct>=80?'#4CAF7D':pct>=65?'#6E8EDA':pct>=50?'#F59E0B':'#E05C5C'

  // Decision impact chart — shows projected revenue trajectory for entered decisions
  const decisionChartData = decisionHistory.slice().reverse().map((d,i)=>({
    name: `D${i+1}`,
    label: d.decision.slice(0,20),
    probability: d.result.probability,
    fill: d.result.probability>=65?'#4CAF7D':d.result.probability>=40?'#F59E0B':'#E05C5C'
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="label-sm mb-1" style={{color:'#6E8EDA'}}>Individual — Simulation</div>
          <h2 className="text-[26px] sm:text-[28px] font-bold gradient-blue">Market Simulator</h2>
          <p className="text-t3 text-[13px] mt-1">Run a 24-month sim or test your idea decisions with AI forecasting.</p>
        </div>
        <div className="flex items-center gap-2">
          {gameState!=='idle' && (
            <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{background:'transparent',border:'1px solid #333',color:'#999'}}>
              ← Back
            </button>
          )}
          {gameState!=='idle'&&<div className="card px-3 py-2 text-center"><div className="label-sm mb-0.5">Month</div><div className="text-[20px] font-black" style={{color:'#6E8EDA'}}>{month}</div></div>}
          <div className="card px-3 py-2 text-center"><div className="label-sm mb-0.5">XP</div><div className="text-[20px] font-black gold-text">{xp}</div></div>
        </div>
      </div>

      {/* IDLE */}
      {gameState==='idle' && (
        <div className="space-y-5">
          {/* Idea selector */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="label-sm" style={{color:'#6E8EDA'}}>Link an Idea from Launchpad</div>
              {selectedIdea && (
                <button onClick={()=>setSelectedIdea(null)} className="text-[11px] text-danger">✕ Unlink</button>
              )}
            </div>
            {selectedIdea ? (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(110,142,218,0.08)',border:'1px solid rgba(110,142,218,0.2)'}}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{background:'#6E8EDA'}}/>
                <div>
                  <div className="text-[14px] font-bold" style={{color:'#6E8EDA'}}>{selectedIdea.title}</div>
                  <div className="text-[11px] text-t3">{selectedIdea.industry} · {selectedIdea.market}</div>
                </div>
                {selectedIdea.report && <div className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded" style={{background:'rgba(76,175,125,0.1)',color:'#4CAF7D'}}>Score: {selectedIdea.report.viabilityScore}</div>}
              </div>
            ) : (
              <div>
                {ideas.length === 0 ? (
                  <p className="text-[12px] text-t3">No ideas in your Launchpad yet. Add one in the Launchpad section first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ideas.map(idea=>(
                      <button key={idea.id} onClick={()=>setSelectedIdea(idea)}
                        className="px-3 py-2 rounded-xl text-[12px] font-medium transition-all"
                        style={{background:'#0A0A16',border:'1px solid #1A1A2E',color:'#8888AA'}}>
                        {idea.title}
                        {idea.report && <span className="ml-2 text-[10px]" style={{color:'#4CAF7D'}}>{idea.report.viabilityScore}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {selectedIdea && (
              <p className="text-[11px] text-t3 mt-2">The simulation will use this idea's market and stage as baseline. Decisions are calibrated to this concept.</p>
            )}
          </div>

          {/* Simulation start */}
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4 opacity-30" style={{color:'#6E8EDA'}}>⬡</div>
            <h3 className="text-[18px] font-bold mb-2" style={{color:'#6E8EDA'}}>24-Month Simulation</h3>
            <p className="text-t2 text-[13px] max-w-md mx-auto mb-5" style={{lineHeight:1.75}}>
              {EVENTS.length} real business events across growth, crisis, social media, regulation, and fundraising. Make decisions. The AI explains why you were right or wrong.
            </p>
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto mb-6">
              {[['7','Events'],['24','Months'],['Crisis','Included'],['AI','Scoring']].map(([v,l])=>(
                <div key={l} className="card p-2.5 text-center"><div className="text-[16px] font-black" style={{color:'#6E8EDA'}}>{v}</div><div className="text-t3 text-[10px]">{l}</div></div>
              ))}
            </div>
            <button className="px-10 py-3 rounded-xl text-[15px] font-bold" style={{background:'linear-gradient(135deg,#6E8EDA,#A8C4F0)',color:'#000'}} onClick={startGame}>
              ▶ Start {selectedIdea ? `"${selectedIdea.title}"` : 'Generic'} Simulation
            </button>
          </div>

          {/* AI Decision Tester */}
          <div className="card p-5" style={{border:'1px solid rgba(110,142,218,0.25)'}}>
            <div className="label-sm mb-1" style={{color:'#6E8EDA'}}>⚡ AI Decision Forecaster</div>
            <p className="text-[12px] text-t3 mb-4">
              {selectedIdea ? `Testing decisions for: "${selectedIdea.title}"` : 'Link an idea above to test decisions specific to your concept.'}
            </p>
            <textarea className="input-field text-[13px] resize-none mb-3" rows={3}
              placeholder={selectedIdea ? `e.g. "Launch ${selectedIdea.title} with freemium model in Indonesia, $3k marketing budget..."` : 'e.g. "Launch with freemium model in Indonesia, $3k marketing budget..."'}
              value={decision} onChange={e=>setDecision(e.target.value)}/>
            <button className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all mb-4"
              style={{background:'linear-gradient(135deg,#6E8EDA,#A8C4F0)',color:'#000',opacity:decLoading||!decision.trim()?0.5:1}}
              onClick={runDecision} disabled={decLoading||!decision.trim()}>
              {decLoading?'Forecasting…':'▶ Forecast This Decision'}
            </button>

            {decResult && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-3">
                {/* Main verdict */}
                <div className="p-4 rounded-xl" style={{background:'rgba(110,142,218,0.06)',border:'1px solid rgba(110,142,218,0.15)'}}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="label-sm" style={{color:'#6E8EDA'}}>Forecast</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-t3">Success probability:</span>
                      <span className="text-[14px] font-black" style={{color:decResult.probability>=65?'#4CAF7D':decResult.probability>=40?'#F59E0B':'#E05C5C'}}>{decResult.probability}%</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-t1" style={{lineHeight:1.7}}>{decResult.verdict}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-3"><div className="label-sm mb-1">Revenue Impact</div><div className="text-[15px] font-black text-t1">{decResult.revenueImpact}</div></div>
                  <div className="card p-3"><div className="label-sm mb-1">Timeframe</div><div className="text-[15px] font-black text-t1">{decResult.timeframe}</div></div>
                </div>

                {/* Risks + Opps */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-3">
                    <div className="label-sm mb-2 text-danger">Risks</div>
                    {decResult.risks.map((r,i)=><p key={i} className="text-[11px] text-t2 mb-1 flex gap-1.5"><span className="text-danger shrink-0">✕</span>{r}</p>)}
                  </div>
                  <div className="card p-3">
                    <div className="label-sm mb-2 text-success">Opportunities</div>
                    {decResult.opportunities.map((o,i)=><p key={i} className="text-[11px] text-t2 mb-1 flex gap-1.5"><span className="text-success shrink-0">✓</span>{o}</p>)}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-3 rounded-xl" style={{background:'rgba(110,142,218,0.06)',border:'1px solid rgba(110,142,218,0.15)'}}>
                  <div className="label-sm mb-1" style={{color:'#6E8EDA'}}>Next Move</div>
                  <p className="text-[13px] text-t1">{decResult.recommendation}</p>
                </div>
              </motion.div>
            )}

            {/* Decision history chart */}
            {decisionHistory.length > 1 && (
              <div className="mt-4">
                <div className="label-sm mb-3 text-t3">Decision History — Success Probability</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={decisionChartData} margin={{top:0,right:0,left:0,bottom:0}}>
                    <XAxis dataKey="name" tick={{fill:'#444466',fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fill:'#444466',fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v:any)=>[`${v}%`,'Probability']} contentStyle={{background:'#0F0F1A',border:'1px solid #1A1A2E',borderRadius:8,fontSize:11}}/>
                    <ReferenceLine y={65} stroke="#4CAF7D" strokeDasharray="3 3"/>
                    <Bar dataKey="probability" radius={[4,4,0,0]}>
                      {decisionChartData.map((d,i)=><Cell key={i} fill={d.fill} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHART during game */}
      {(gameState==='running'||gameState==='event'||gameState==='result') && data.length>0 && (
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label-sm mb-0.5">
                {selectedIdea ? `${selectedIdea.title} — Revenue Trajectory` : 'Revenue — 24 Month Simulation'}
              </div>
              <div className="text-[11px] text-t3">Decisions affect this curve in real time</div>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-t3">MRR: <span className="font-bold" style={{color:'#6E8EDA'}}>{f$(finalRev)}</span></span>
              <span className="text-t3">Cash: <span className="font-bold" style={{color:finalCash>0?'#4CAF7D':'#E05C5C'}}>{f$(finalCash)}</span></span>
              {gameState!=='result' && <button onClick={cancel} className="btn-ghost px-3 py-1.5 text-[12px]">✕ Cancel</button>}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{top:5,right:10,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6E8EDA" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6E8EDA" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E"/>
              <XAxis dataKey="month" tickFormatter={v=>`M${v}`} tick={{fill:'#444466',fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>f$(v)} tick={{fill:'#444466',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={(v:any,n:any)=>[f$(v),n]} contentStyle={{background:'#0F0F1A',border:'1px solid #1A1A2E',borderRadius:8,fontSize:11}}/>
              <Area type="monotone" dataKey="revenue" name="MRR" stroke="#6E8EDA" strokeWidth={2.5} fill="url(#gRev)"/>
              <Area type="monotone" dataKey="cash" name="Cash" stroke="#4CAF7D" strokeWidth={1.5} fill="url(#gCash)"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* EVENT */}
      <AnimatePresence>
      {gameState==='event' && currentEv && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="card p-6 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="label-sm" style={{color:'#6E8EDA'}}>Month {currentEv.month}</span>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{background:'rgba(110,142,218,0.1)',color:'#6E8EDA'}}>Event</span>
          </div>
          <h3 className="text-[20px] font-bold text-t1 mb-2">{currentEv.title}</h3>
          <p className="text-[14px] text-t2 mb-5" style={{lineHeight:1.75}}>{currentEv.scenario}</p>
          <div className="space-y-2.5">
            {currentEv.choices.map((ch,i)=>{
              const isSelected = selectedChoice===i
              const isCorrect = ch.correct && showResult
              const isWrong = isSelected && !ch.correct && showResult
              return (
                <div key={i}>
                  <button onClick={()=>choose(i)} disabled={selectedChoice!==null}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{background:isCorrect?'rgba(76,175,125,0.1)':isWrong?'rgba(224,92,92,0.1)':isSelected?'rgba(110,142,218,0.1)':'#0A0A16',border:`1px solid ${isCorrect?'#4CAF7D':isWrong?'#E05C5C':isSelected?'#6E8EDA':'#1A1A2E'}`}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-t1">{ch.label}</span>
                      {showResult && isSelected && <span className="text-[11px] font-bold" style={{color:ch.correct?'#4CAF7D':'#E05C5C'}}>{ch.effect}</span>}
                    </div>
                    {showResult && (isSelected || isCorrect) && <p className="text-[12px] text-t2 mt-1.5" style={{lineHeight:1.6}}>{ch.explanation}</p>}
                  </button>
                </div>
              )
            })}
          </div>
          {showResult && (
            <button className="w-full py-3 rounded-xl text-[14px] font-bold mt-4"
              style={{background:'linear-gradient(135deg,#6E8EDA,#A8C4F0)',color:'#000'}}
              onClick={continueGame}>Continue Simulation →</button>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* RESULT */}
      {gameState==='result' && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-4">
          <div className="card p-8 text-center">
            <div className="label-sm mb-2" style={{color:'#6E8EDA'}}>Simulation Complete</div>
            <div className="text-[56px] font-black mb-2" style={{color:gradeColor,letterSpacing:'-2px'}}>{grade}</div>
            <p className="text-t3 text-[14px] mb-5">{correctCount} / {EVENTS.length} correct decisions · {xp} XP</p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-5">
              {[{l:'Final MRR',v:f$(finalRev),c:'#6E8EDA'},{l:'Cash',v:f$(finalCash),c:finalCash>0?'#4CAF7D':'#E05C5C'},{l:'Score',v:`${pct}%`,c:gradeColor}].map(m=>(
                <div key={m.l} className="card p-3"><div className="label-sm mb-1">{m.l}</div><div className="text-[18px] font-black" style={{color:m.c}}>{m.v}</div></div>
              ))}
            </div>
            <button className="px-8 py-3 rounded-xl text-[14px] font-bold" style={{background:'linear-gradient(135deg,#6E8EDA,#A8C4F0)',color:'#000'}} onClick={()=>{setGameState('idle');setData([])}}>Try Again</button>
          </div>
          {log.length>0 && (
            <div className="card p-5">
              <div className="label-sm mb-3 text-t3">Decision Log</div>
              <div className="space-y-2">
                {log.map((d,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:d.correct?'rgba(76,175,125,0.05)':'rgba(224,92,92,0.05)',border:`1px solid ${d.correct?'rgba(76,175,125,0.15)':'rgba(224,92,92,0.15)'}`}}>
                    <span style={{color:d.correct?'#4CAF7D':'#E05C5C'}}>{d.correct?'✓':'✗'}</span>
                    <div><p className="text-[11px] text-t3 mb-0.5">M{d.month} — {d.event}</p><p className="text-[13px] text-t1">{d.choice}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
