'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BASE_PATH } from '@/lib/config'

type ChatMsg = { role: 'user' | 'assistant'; content: string }
type Report = { viabilityScore: number; verdict: string; keyInsight?: string; marketOpportunity: { size: string; demandSignals: string[]; timingVerdict: string; timingReason: string }; competitors: { existing: string[]; gap: string; saturation: string }; firstCustomer: { profile: string; whereToFind: string; whatTheyCareAbout: string }; topRisks: { title: string; why: string; mitigation: string }[]; firstSevenDays: string[] }
type Idea = { id: string; title: string; description: string; industry: string; market: string; date: string; report?: Report; chat: ChatMsg[] }

const INDUSTRIES = ['E-commerce', 'SaaS', 'Services', 'F&B', 'Edtech', 'Fintech', 'Other']
const MARKETS = ['Singapore', 'Indonesia', 'Malaysia', 'Philippines', 'Other SEA']

function ScoreRing({ score }: { score: number }) {
  const r = 38, circ = 2 * Math.PI * r
  const color = score >= 71 ? '#4CAF7D' : score >= 41 ? '#F59E0B' : '#E05C5C'
  return (
    <div className="relative" style={{ width: 90, height: 90 }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#1A1A2E" strokeWidth={6} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-t3">Score</span>
      </div>
    </div>
  )
}

export default function IndividualLaunchpad() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', industry: 'SaaS', market: 'Singapore' })
  const [validating, setValidating] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = localStorage.getItem('orelis-launchpad-ideas')
    if (s) setIdeas(JSON.parse(s))
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected, ideas])

  function persist(next: Idea[]) { setIdeas(next); localStorage.setItem('orelis-launchpad-ideas', JSON.stringify(next)) }

  function deleteIdea(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this idea? This cannot be undone.')) return
    const next = ideas.filter(i => i.id !== id)
    persist(next)
    if (selected === id) setSelected(next[0]?.id || null)
  }

  function addIdea() {
    if (!form.title.trim()) return
    const idea: Idea = { id: String(Date.now()), title: form.title, description: form.description, industry: form.industry, market: form.market, date: new Date().toLocaleDateString(), chat: [] }
    persist([idea, ...ideas]); setSelected(idea.id); setAdding(false); setForm({ title: '', description: '', industry: 'SaaS', market: 'Singapore' })
  }

  const idea = ideas.find(i => i.id === selected)

  async function validate() {
    if (!idea) return
    setValidating(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/validate-idea`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'report', idea: `${idea.title}: ${idea.description}`, industry: idea.industry, market: idea.market, answers: [] })
      })
      let text = ''
      const reader = res.body!.getReader(); const dec = new TextDecoder()
      while (true) { const { done, value } = await reader.read(); if (done) break; text += dec.decode(value) }
      const clean = text.replace(/```json|```/g, '').trim()
      const report: Report = JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1))
      const updated = ideas.map(i => i.id === idea.id ? { ...i, report } : i)
      persist(updated)
    } catch (e) { console.error(e) }
    setValidating(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || !idea || chatLoading) return
    const msg: ChatMsg = { role: 'user', content: chatInput }
    const updatedMsgs = [...idea.chat, msg]
    persist(ideas.map(i => i.id === idea.id ? { ...i, chat: updatedMsgs } : i))
    setChatInput(''); setChatLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/idea-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaName: idea.title, ideaDescription: idea.description, messages: updatedMsgs })
      })
      let reply = ''
      const reader = res.body!.getReader(); const dec = new TextDecoder()
      const withLoading = [...updatedMsgs, { role: 'assistant' as const, content: '' }]
      persist(ideas.map(i => i.id === idea.id ? { ...i, chat: withLoading } : i))
      while (true) {
        const { done, value } = await reader.read(); if (done) break; reply += dec.decode(value)
        const withReply = [...updatedMsgs, { role: 'assistant' as const, content: reply }]
        persist(ideas.map(i => i.id === idea.id ? { ...i, chat: withReply } : i))
        setIdeas(prev => prev.map(i => i.id === selected ? { ...i, chat: withReply } : i))
      }
    } catch (e) { console.error(e) }
    setChatLoading(false)
  }

  return (
    <div className="flex flex-col sm:flex-row h-[calc(100vh-52px)]" style={{ overflow: 'hidden' }}>

      {/* LEFT SIDEBAR — Idea folders */}
      <div className="sm:w-64 sm:shrink-0 flex flex-col" style={{ borderRight: '1px solid #1A1A2E', background: '#0A0A16', maxHeight: selected ? '180px' : undefined }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1A1A2E' }}>
          <div>
            <div className="label-sm" style={{ color: '#6E8EDA' }}>Launchpad</div>
            <p className="text-[12px] text-t3">{ideas.length} ideas</p>
          </div>
          <button className="btn-gold px-3 py-1.5 text-[12px]" onClick={() => setAdding(true)}>+ New</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {ideas.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2 opacity-20" style={{ color: '#6E8EDA' }}>◈</div>
              <p className="text-[12px] text-t3">No ideas yet.<br />Add your first one.</p>
            </div>
          ) : ideas.map(i => (
            <button key={i.id} onClick={() => setSelected(i.id)}
              className="w-full text-left p-4 transition-all group"
              style={{
                borderBottom: '1px solid #1A1A2E',
                background: selected === i.id ? 'rgba(110,142,218,0.1)' : 'transparent',
                borderLeft: `3px solid ${selected === i.id ? '#6E8EDA' : 'transparent'}`
              }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-t1 truncate">{i.title}</p>
                  <p className="text-[10px] text-t3 mt-0.5">{i.industry} · {i.market}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {i.report && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(76,175,125,0.12)', color: '#4CAF7D' }}>
                      {i.report.viabilityScore}
                    </span>
                  )}
                  <button onClick={(e) => deleteIdea(i.id, e)}
                    className="text-[11px] px-1.5 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
                    style={{ color: '#E05C5C', background: 'rgba(224,92,92,0.1)' }}
                    title="Delete idea">
                    ✕
                  </button>
                </div>
              </div>
              {i.chat.length > 0 && <p className="text-[10px] text-t3 mt-1">{i.chat.length} messages</p>}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-5xl mb-4 opacity-20" style={{ color: '#6E8EDA' }}>◈</div>
            <h3 className="text-[20px] font-bold mb-2" style={{ color: '#6E8EDA' }}>Your Idea Launchpad</h3>
            <p className="text-t3 text-[14px] max-w-sm">
              Add an idea, get an AI validation report, and chat with the AI advisor to go deeper.
            </p>
          </div>
        ) : idea ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'rgba(110,142,218,0.1)', color: '#6E8EDA' }}>{idea.industry}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: '#1A1A2E', color: '#8888AA' }}>{idea.market}</span>
                  <span className="text-[10px] text-t3">{idea.date}</span>
                </div>
                <h2 className="text-[26px] font-black text-t1" style={{ letterSpacing: '-0.02em' }}>{idea.title}</h2>
                {idea.description && <p className="text-[14px] text-t2 mt-1">{idea.description}</p>}
              </div>
              {!idea.report && (
                <button className="btn-gold px-5 py-2.5 text-[13px]" onClick={validate} disabled={validating}>
                  {validating ? '⟳ Validating...' : '◎ Validate This Idea'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT — Report */}
              <div>
                {!idea.report && !validating && (
                  <div className="card p-8 text-center" style={{ border: '1px dashed #2A2A40' }}>
                    <div className="text-3xl mb-3 opacity-30" style={{ color: '#6E8EDA' }}>◎</div>
                    <p className="text-[13px] text-t3">Hit Validate to get your AI report.</p>
                  </div>
                )}
                {validating && (
                  <div className="card p-8 text-center">
                    <div className="flex justify-center gap-2 mb-3">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#6E8EDA' }}
                          animate={{ scale: [1, .4, 1] }} transition={{ duration: .8, repeat: Infinity, delay: i * .15 }} />
                      ))}
                    </div>
                    <p className="text-[13px] text-t2">Analysing your idea...</p>
                  </div>
                )}
                {idea.report && (
                  <div className="space-y-3">
                    <div className="card p-5 flex items-center gap-4">
                      <ScoreRing score={idea.report.viabilityScore} />
                      <div>
                        <p className="text-[14px] font-semibold text-t1 mb-1">{idea.report.verdict}</p>
                        {idea.report.keyInsight && <p className="text-[12px] text-t2">{idea.report.keyInsight}</p>}
                      </div>
                    </div>
                    <div className="card p-4">
                      <div className="label-sm mb-2 gold-text">Market</div>
                      <p className="text-[13px] text-t1 font-semibold mb-1">{idea.report.marketOpportunity.size}</p>
                      {idea.report.marketOpportunity.demandSignals.map((s, i) => <p key={i} className="text-[12px] text-t2 flex gap-1.5"><span className="gold-text">·</span>{s}</p>)}
                    </div>
                    <div className="card p-4">
                      <div className="label-sm mb-2 gold-text">First Customer</div>
                      <p className="text-[13px] text-t1 font-semibold mb-1">{idea.report.firstCustomer.profile}</p>
                      <p className="text-[12px] text-t2">Find: {idea.report.firstCustomer.whereToFind}</p>
                    </div>
                    <div className="card p-4">
                      <div className="label-sm mb-2 text-danger">Top Risks</div>
                      {idea.report.topRisks.map((r, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-[12px] font-semibold text-t1">{r.title}</p>
                          <p className="text-[11px] text-success">→ {r.mitigation}</p>
                        </div>
                      ))}
                    </div>
                    <div className="card p-4">
                      <div className="label-sm mb-2 text-success">First 7 Days</div>
                      {idea.report.firstSevenDays.map((a, i) => <p key={i} className="text-[12px] text-t2 mb-1"><span className="gold-text font-bold">{i + 1}.</span> {a}</p>)}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT — Chat */}
              <div className="flex flex-col" style={{ height: 500 }}>
                <div className="label-sm mb-3" style={{ color: '#6E8EDA' }}>Ask the AI Advisor</div>
                <div className="card flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {idea.chat.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <p className="text-[12px] text-t3">Ask anything about this idea.<br />The AI will help you go deeper.</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {["What's the biggest risk?", "Who's my first customer?", "How do I validate this?"].map(q => (
                            <button key={q} className="pill text-[11px]" onClick={() => { setChatInput(q) }}>{q}</button>
                          ))}
                        </div>
                      </div>
                    ) : idea.chat.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%] px-3 py-2 rounded-xl text-[13px]"
                          style={{
                            background: msg.role === 'user' ? 'rgba(110,142,218,0.2)' : '#131320',
                            border: `1px solid ${msg.role === 'user' ? 'rgba(110,142,218,0.3)' : '#1A1A2E'}`,
                            color: '#F0F0F5', lineHeight: 1.65
                          }}>
                          {msg.content || (chatLoading && i === idea.chat.length - 1 ? '...' : '')}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 flex gap-2" style={{ borderTop: '1px solid #1A1A2E' }}>
                    <input className="input-field flex-1 text-[13px]" style={{ padding: '8px 12px', fontSize: 13 }}
                      placeholder="Ask anything about this idea..."
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }} />
                    <button className="btn-gold px-3 py-2 text-[13px]" onClick={sendChat} disabled={chatLoading}>→</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ADD IDEA MODAL */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: .95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .95 }}
              className="card max-w-md w-full mx-6 p-7">
              <h3 className="text-[20px] font-bold mb-5">New Idea</h3>
              <input className="input-field mb-3" placeholder="Idea title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="input-field mb-4 resize-none" rows={3} placeholder="Describe it briefly..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div className="label-sm mb-2">Industry</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {INDUSTRIES.map(i => <button key={i} className={`pill text-[11px] ${form.industry === i ? 'active' : ''}`} onClick={() => setForm({ ...form, industry: i })}>{i}</button>)}
              </div>
              <div className="label-sm mb-2">Market</div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {MARKETS.map(m => <button key={m} className={`pill text-[11px] ${form.market === m ? 'active' : ''}`} onClick={() => setForm({ ...form, market: m })}>{m}</button>)}
              </div>
              <div className="flex gap-3">
                <button className="btn-gold flex-1 py-2.5 text-[13px]" onClick={addIdea}>Add Idea</button>
                <button className="btn-ghost flex-1 py-2.5 text-[13px]" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
