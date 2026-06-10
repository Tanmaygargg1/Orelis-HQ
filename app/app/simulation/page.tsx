'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { BASE_PATH } from '@/lib/config'

type NewsItem = { id:string; headline:string; summary:string; impact:'positive'|'negative'|'neutral'; tag:string }
type SimResult = { immediateEffect:string; revenueImpact:string; riskLevel:string; timeToResult:string; probabilityOfSuccess:number; bestCase:string; worstCase:string; keyDependencies:string[]; recommendation:string; nextAction:string; marketAlignment?:string }
type BizProfile = { name:string; description:string; industry:string; market:string; mrr:string; customers:string; stage:string; challenge:string; rawText:string }

const INDUSTRIES = ['SaaS','E-Commerce','Marketplace','Fintech','F&B','Agency','Consumer App']
const MARKETS = ['Singapore','Indonesia','Malaysia','Philippines','Vietnam','Thailand']
const tagColors: Record<string,string> = { Funding:'#6E8EDA', Regulation:'#F59E0B', Competitor:'#E05C5C', Consumer:'#4CAF7D', Economy:'#C8A96E', Technology:'#A78BFA', Crisis:'#E05C5C', Social:'#6E8EDA' }
const impactColors = { positive:'#4CAF7D', negative:'#E05C5C', neutral:'#8888AA' }

const MODULE_CATEGORIES = [
  { id:'growth', label:'📈 Growth Decisions', desc:'Pricing, hiring, product launches, market expansion', color:'#4CAF7D' },
  { id:'social', label:'📱 Social Media Events', desc:'Viral moments, PR crises, influencer deals, community backlash', color:'#6E8EDA' },
  { id:'crisis', label:'🔥 Crisis & Disruption', desc:'Team problems, cash crunch, product failures, key customer loss', color:'#E05C5C' },
  { id:'market', label:'📊 Market Forces', desc:'Competitor moves, market shifts, regulation, economic changes', color:'#F59E0B' },
  { id:'disaster', label:'🌊 External Shocks', desc:'Natural disasters, pandemics, political instability, supply chain', color:'#A78BFA' },
  { id:'custom', label:'⚡ Custom Decision', desc:'Test any specific thing you\'re thinking of doing', color:'#C8A96E' },
]

export default function BusinessSim() {
  const [industry, setIndustry] = useState('SaaS')
  const [market, setMarket] = useState('Singapore')
  const [news, setNews] = useState<NewsItem[]>([])
  const [sentiment, setSentiment] = useState('')
  const [loadingNews, setLoadingNews] = useState(false)
  const [decision, setDecision] = useState('')
  const [simResult, setSimResult] = useState<SimResult|null>(null)
  const [simulating, setSimulating] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string|null>(null)
  const [bizProfile, setBizProfile] = useState<BizProfile|null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('orelis-biz-profile')
    if (saved) setBizProfile(JSON.parse(saved))
  }, [])

  // Auto-load industry/market from biz profile
  useEffect(() => {
    if (bizProfile?.industry) setIndustry(bizProfile.industry)
    if (bizProfile?.market) setMarket(bizProfile.market)
  }, [bizProfile])

  async function fetchNews() {
    setLoadingNews(true); setNews([]); setSentiment(''); setSimResult(null)
    try {
      const res = await fetch(`${BASE_PATH}/api/market-sim`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'news', industry, market })
      })
      const d = await res.json()
      setNews(d.news||[]); setSentiment(d.marketSentiment||''); setLoaded(true)
    } catch {}
    setLoadingNews(false)
  }

  function getModulePrompt(moduleId: string, decision: string, biz: BizProfile|null): string {
    const bizCtx = biz ? `Business: ${biz.name||'unnamed'}, ${biz.description}, MRR: $${biz.mrr||'unknown'}, Customers: ${biz.customers||'unknown'}, Stage: ${biz.stage}. Challenge: ${biz.challenge}. ${biz.rawText?`Additional context: ${biz.rawText.slice(0,500)}`:''}` : ''
    const newsCtx = news.map(n=>`${n.headline} [${n.impact}]`).join('; ')

    switch(moduleId) {
      case 'social': return `SOCIAL MEDIA SIMULATION. ${bizCtx}. Current market: ${newsCtx}. Decision/scenario: ${decision}. Simulate the social media and PR impact. Be specific about viral potential, reputational risk, platform dynamics in ${market}, and likely community response.`
      case 'crisis': return `CRISIS SIMULATION. ${bizCtx}. Current market: ${newsCtx}. Crisis/problem: ${decision}. Simulate how this crisis unfolds. Include immediate fallout, cash impact, team morale effect, customer churn risk, and recovery timeline.`
      case 'market': return `MARKET FORCES SIMULATION. ${bizCtx}. Current market: ${newsCtx}. Market scenario: ${decision}. Simulate competitive and market impact. Include specific competitor reactions, customer behaviour shift, pricing pressure, and strategic implications.`
      case 'disaster': return `EXTERNAL SHOCK SIMULATION. ${bizCtx}. Current market: ${newsCtx}. External event: ${decision}. Simulate the business impact of this external shock. Include supply chain effects, demand changes, regulatory implications, and survival strategy.`
      default: return `GROWTH DECISION SIMULATION. ${bizCtx}. Current market: ${newsCtx}. Decision: ${decision}.`
    }
  }

  async function simulate() {
    if (!decision.trim()) return
    setSimulating(true); setSimResult(null)
    const bizCtx = bizProfile ? `${bizProfile.name||''} | ${bizProfile.description} | MRR: $${bizProfile.mrr||'?'} | ${bizProfile.customers||'?'} customers | Stage: ${bizProfile.stage} | Challenge: ${bizProfile.challenge}` : ''
    const prompt = selectedModule ? getModulePrompt(selectedModule, decision, bizProfile) : decision
    try {
      const res = await fetch(`${BASE_PATH}/api/market-sim`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'simulate', industry, market, decision: prompt, newsContext: news.map(n=>n.headline).join('; '), bizContext: bizCtx })
      })
      const d = await res.json()
      setSimResult(d)
    } catch {}
    setSimulating(false)
  }

  const riskColor = (r:string) => r==='High'?'#E05C5C':r==='Medium'?'#F59E0B':'#4CAF7D'
  const probColor = (p:number) => p>=65?'#4CAF7D':p>=40?'#F59E0B':'#E05C5C'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="label-gold mb-1">Business Tools</div>
          <h2 className="text-[26px] sm:text-[28px] font-bold mb-1 gradient-gold">Market Simulation</h2>
          <p className="text-t3 text-[13px]">Forecast any decision against live SEA market conditions. Pull from your business profile automatically.</p>
        </div>
        {bizProfile?.name && (
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{background:'#4CAF7D'}}/>
            <span className="text-[12px] text-t2">{bizProfile.name}</span>
          </div>
        )}
      </div>

      {!bizProfile?.name && (
        <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3 text-[12px]" style={{background:'rgba(200,169,110,0.06)',border:'1px solid rgba(200,169,110,0.2)'}}>
          <span className="gold-text">◈</span>
          <span className="text-t2">Set up your <Link href="/settings" className="gold-text underline">Business Profile</Link> once — the AI will use it automatically in all simulations.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Context override if no profile */}
          {!bizProfile?.description && (
            <div className="card p-4">
              <div className="label-sm mb-3">Market Context</div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-t3 mb-1 block">Industry</label>
                  <div className="flex flex-wrap gap-1">
                    {INDUSTRIES.map(i=>(
                      <button key={i} onClick={()=>setIndustry(i)}
                        className="px-2 py-1 rounded text-[10px] transition-all"
                        style={{background:industry===i?'rgba(200,169,110,0.15)':'#0A0A16',border:`1px solid ${industry===i?'#C8A96E':'#1A1A2E'}`,color:industry===i?'#C8A96E':'#444466'}}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-t3 mb-1 block">Market</label>
                  <div className="flex flex-wrap gap-1">
                    {MARKETS.map(m=>(
                      <button key={m} onClick={()=>setMarket(m)}
                        className="px-2 py-1 rounded text-[10px] transition-all"
                        style={{background:market===m?'rgba(200,169,110,0.15)':'#0A0A16',border:`1px solid ${market===m?'#C8A96E':'#1A1A2E'}`,color:market===m?'#C8A96E':'#444466'}}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module selector */}
          <div className="card p-4">
            <div className="label-sm mb-3">Simulation Module</div>
            <div className="space-y-2">
              {MODULE_CATEGORIES.map(mod=>(
                <button key={mod.id} onClick={()=>setSelectedModule(selectedModule===mod.id?null:mod.id)}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={{background:selectedModule===mod.id?`${mod.color}12`:'#0A0A16',border:`1px solid ${selectedModule===mod.id?mod.color:'#1A1A2E'}`}}>
                  <div className="text-[12px] font-semibold mb-0.5" style={{color:selectedModule===mod.id?mod.color:'#8888AA'}}>{mod.label}</div>
                  <div className="text-[10px]" style={{color:'#444466'}}>{mod.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Load news */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="label-sm">Live Market Signals</div>
              {loaded && <span className="text-[10px] text-success">✓ Loaded</span>}
            </div>
            <button onClick={fetchNews} disabled={loadingNews}
              className="btn-gold w-full py-2.5 text-[13px]">
              {loadingNews?'Fetching…':'↻ Load '+market+' Market News'}
            </button>
            {sentiment && <p className="text-[11px] text-t3 mt-2">Market sentiment: <span className="font-semibold" style={{color:sentiment==='bullish'?'#4CAF7D':sentiment==='bearish'?'#E05C5C':'#F59E0B'}}>{sentiment}</span></p>}
          </div>
        </div>

        {/* CENTER + RIGHT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Decision input */}
          <div className="card p-5" style={{border:'1px solid rgba(200,169,110,0.2)'}}>
            <div className="label-sm mb-1 gold-text">
              {selectedModule ? MODULE_CATEGORIES.find(m=>m.id===selectedModule)?.label : '⚡ What are you thinking of doing?'}
            </div>
            <p className="text-[11px] text-t3 mb-3">
              {selectedModule==='social' && 'Describe a social media move, campaign, or potential PR scenario'}
              {selectedModule==='crisis' && 'Describe the crisis or internal problem you\'re facing or anticipating'}
              {selectedModule==='market' && 'Describe a competitor move, market shift, or regulatory change to model'}
              {selectedModule==='disaster' && 'Describe an external shock — flood, political event, supply disruption'}
              {(!selectedModule||selectedModule==='growth'||selectedModule==='custom') && (bizProfile?.name ? `Testing for: ${bizProfile.name}` : 'Be specific — vague inputs get vague outputs')}
            </p>
            <textarea className="input-field text-[13px] resize-none mb-3" rows={4}
              placeholder={
                selectedModule==='social'?'e.g. "Post a LinkedIn breakdown of our unit economics publicly to build credibility..."':
                selectedModule==='crisis'?'e.g. "Our lead engineer just quit and we have a major client demo in 2 weeks..."':
                selectedModule==='market'?'e.g. "A well-funded Singapore competitor just launched a free tier targeting our core segment..."':
                selectedModule==='disaster'?'e.g. "A regional flood has shut down logistics in our primary market for 3 weeks..."':
                bizProfile?.challenge?`Current challenge: ${bizProfile.challenge.slice(0,60)}... What do you want to do about it?`:
                'e.g. "Raise prices 25% and move upmarket to SMEs with 10+ employees..."'
              }
              value={decision} onChange={e=>setDecision(e.target.value)}/>
            <div className="flex gap-2">
              <button className="btn-gold flex-1 py-3 text-[14px] font-bold" onClick={simulate} disabled={simulating||!decision.trim()}>
                {simulating?'Simulating…':'▶ Run Simulation'}
              </button>
              {(simulating||simResult) && (
                <button onClick={()=>{setSimResult(null);setDecision('')}} className="btn-ghost px-4 py-3 text-[13px]">✕ Cancel</button>
              )}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
          {simulating && !simResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card p-8 text-center">
              <div className="text-3xl mb-3 gold-text animate-pulse">◎</div>
              <div className="label-sm mb-1">Simulating against {market} market conditions...</div>
              {bizProfile?.name && <p className="text-[11px] text-t3">Using {bizProfile.name} profile data</p>}
            </motion.div>
          )}

          {simResult && !simulating && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-4">
              {/* Header verdict */}
              <div className="card p-5" style={{borderColor:'rgba(200,169,110,0.25)',background:'linear-gradient(135deg,rgba(200,169,110,0.04),transparent)'}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="label-sm gold-text">Simulation Result</div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-[11px] text-t3 mb-0.5">Success probability</div>
                      <div className="text-[22px] font-black" style={{color:probColor(simResult.probabilityOfSuccess)}}>{simResult.probabilityOfSuccess}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-t3 mb-0.5">Risk</div>
                      <div className="text-[14px] font-black" style={{color:riskColor(simResult.riskLevel)}}>{simResult.riskLevel}</div>
                    </div>
                  </div>
                </div>
                <p className="text-[14px] text-t1" style={{lineHeight:1.75}}>{simResult.immediateEffect}</p>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4"><div className="label-sm mb-1">Revenue Impact</div><div className="text-[16px] font-black text-t1">{simResult.revenueImpact}</div></div>
                <div className="card p-4"><div className="label-sm mb-1">Time to Result</div><div className="text-[16px] font-black text-t1">{simResult.timeToResult}</div></div>
              </div>

              {/* Best / Worst */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4" style={{borderColor:'rgba(76,175,125,0.15)'}}>
                  <div className="label-sm mb-2 text-success">Best Case</div>
                  <p className="text-[12px] text-t2" style={{lineHeight:1.6}}>{simResult.bestCase}</p>
                </div>
                <div className="card p-4" style={{borderColor:'rgba(224,92,92,0.15)'}}>
                  <div className="label-sm mb-2 text-danger">Worst Case</div>
                  <p className="text-[12px] text-t2" style={{lineHeight:1.6}}>{simResult.worstCase}</p>
                </div>
              </div>

              {/* Dependencies */}
              <div className="card p-4">
                <div className="label-sm mb-2 text-t3">Key Dependencies</div>
                <div className="space-y-1">
                  {simResult.keyDependencies?.map((d,i)=>(
                    <p key={i} className="text-[12px] text-t2 flex gap-2"><span className="gold-text shrink-0">·</span>{d}</p>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="card p-5" style={{background:'rgba(200,169,110,0.04)',borderColor:'rgba(200,169,110,0.2)'}}>
                <div className="label-sm mb-2 gold-text">◈ Recommendation</div>
                <p className="text-[14px] text-t1 mb-3" style={{lineHeight:1.75}}>{simResult.recommendation}</p>
                <div className="pt-3" style={{borderTop:'1px solid rgba(200,169,110,0.1)'}}>
                  <div className="label-sm mb-1 text-t3">Next Action</div>
                  <p className="text-[13px] font-semibold text-t1">{simResult.nextAction}</p>
                </div>
              </div>

              <button onClick={()=>{setSimResult(null);setDecision('');setSelectedModule(null)}} className="btn-ghost w-full py-2.5 text-[13px]">
                ↺ Simulate Another Decision
              </button>
            </motion.div>
          )}

          {!simulating && !simResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card p-12 text-center">
              <div className="text-4xl mb-4 opacity-20 gold-text">⬡</div>
              <p className="text-t3 text-[13px]" style={{lineHeight:1.75}}>
                {loaded ? 'Market loaded. Select a module and describe your decision.' : 'Pick a simulation module, load market news, then describe what you\'re thinking of doing.'}
              </p>
            </motion.div>
          )}
          </AnimatePresence>

          {/* News feed */}
          {news.length > 0 && (
            <div className="card p-4">
              <div className="label-sm mb-3">{market} Market — {news.length} Signals</div>
              <div className="space-y-2">
                {news.map(item=>(
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl" style={{background:'#0A0A16',border:'1px solid #1A1A2E'}}>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{background:`${impactColors[item.impact]}18`,color:impactColors[item.impact]}}>
                      {item.impact==='positive'?'↑':item.impact==='negative'?'↓':'→'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-t1 mb-1">{item.headline}</p>
                      <p className="text-[11px] text-t3">{item.summary}</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{background:`${tagColors[item.tag]||'#8888AA'}18`,color:tagColors[item.tag]||'#8888AA'}}>
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
