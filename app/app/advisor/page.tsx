'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BASE_PATH } from '@/lib/config'

type Msg = { role:'user'|'assistant'; content:string }
type Context = { name:string; what:string; stage:string; revenue:string; challenge:string; industry:string }

const stages = ['Idea','Pre-revenue','Early revenue','Growing','Established']
const industries = ['E-commerce','SaaS','Services','F&B','Other']
const quickActions = ['What should I focus on this week?','What\'s holding my growth back?','How do I get my first 10 customers?']

export default function Advisor() {
  const [ctx, setCtx] = useState<Context>({ name:'', what:'', stage:'Idea', revenue:'', challenge:'', industry:'SaaS' })
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(true)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bizProfile, setBizProfile] = useState<any>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sc = localStorage.getItem('orelis-ctx')
    const sm = localStorage.getItem('orelis-msgs')
    const bp = localStorage.getItem('orelis-biz-profile')
    if (bp) { const p = JSON.parse(bp); setBizProfile(p); if (!sc) { setCtx({name:p.name||'',what:p.description||'',stage:p.stage||'Idea',revenue:p.mrr||'',challenge:p.challenge||'',industry:p.industry||'SaaS'}); setSaved(true); setEditing(false) } }
    if (sc) { setCtx(JSON.parse(sc)); setSaved(true); setEditing(false) }
    if (sm) setMsgs(JSON.parse(sm))
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, loading])

  function saveCtx() { localStorage.setItem('orelis-ctx', JSON.stringify(ctx)); setSaved(true); setEditing(false); setShowSidebar(false) }

  async function send(text?: string) {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role:'user', content }]
    setMsgs(newMsgs); setLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/advisor`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages: newMsgs, context: saved ? ctx : null, bizProfile }) })
      let reply = ''
      const reader = res.body!.getReader(); const dec = new TextDecoder()
      const all: Msg[] = [...newMsgs, { role:'assistant', content:'' }]
      setMsgs([...all])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        all[all.length-1] = { role:'assistant', content:reply }
        setMsgs([...all])
      }
      localStorage.setItem('orelis-msgs', JSON.stringify(all))
    } catch { setMsgs(m=>[...m,{role:'assistant',content:'Something went wrong. Check your API key.'}]) }
    setLoading(false)
  }

  function renderMsg(content: string) {
    return content.split('\n').map((line,i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-t1 mb-1">{line.slice(2,-2)}</p>
      if (line.startsWith('- ')) return <p key={i} className="text-t2 flex gap-2 mb-0.5"><span className="gold-text">·</span>{line.slice(2)}</p>
      if (line.trim() === '') return <div key={i} className="h-2"/>
      return <p key={i} className="text-t2 mb-1">{line}</p>
    })
  }

  const SidebarContent = () => (
    <div className="space-y-3">
      <div>
        <div className="label-gold mb-1">Your Business</div>
        <h2 className="text-[20px] font-bold gradient-gold">Advisor</h2>
      </div>
      {editing ? (
        <div className="space-y-3">
          <input className="input-field text-[13px]" placeholder="Business name" value={ctx.name} onChange={e=>setCtx({...ctx,name:e.target.value})}/>
          <textarea className="input-field text-[13px] resize-none" rows={3} placeholder="What do you do? (2-3 sentences)" value={ctx.what} onChange={e=>setCtx({...ctx,what:e.target.value})}/>
          <div className="label-sm">Stage</div>
          <div className="flex flex-wrap gap-1.5">{stages.map(s=><button key={s} className={`pill text-[11px] ${ctx.stage===s?'active':''}`} onClick={()=>setCtx({...ctx,stage:s})}>{s}</button>)}</div>
          <input className="input-field text-[13px]" placeholder="Monthly revenue (optional)" value={ctx.revenue} onChange={e=>setCtx({...ctx,revenue:e.target.value})}/>
          <textarea className="input-field text-[13px] resize-none" rows={2} placeholder="Biggest challenge" value={ctx.challenge} onChange={e=>setCtx({...ctx,challenge:e.target.value})}/>
          <div className="label-sm">Industry</div>
          <div className="flex flex-wrap gap-1.5">{industries.map(i=><button key={i} className={`pill text-[11px] ${ctx.industry===i?'active':''}`} onClick={()=>setCtx({...ctx,industry:i})}>{i}</button>)}</div>
          <button className="btn-gold w-full py-2.5 text-[13px]" onClick={saveCtx}>Save Context</button>
        </div>
      ) : (
        <div className="card p-4 space-y-2">
          <p className="text-[14px] font-bold text-t1">{ctx.name||'Your Business'}</p>
          <p className="text-[12px] text-t2">{ctx.what}</p>
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="badge badge-gold">{ctx.stage}</span>
            <span className="badge badge-blue">{ctx.industry}</span>
          </div>
          {ctx.revenue && <p className="text-[12px] text-t3">Revenue: {ctx.revenue}</p>}
          <button className="btn-ghost w-full py-2 text-[12px] mt-2" onClick={()=>setEditing(true)}>Edit</button>
        </div>
      )}
      {msgs.length > 0 && (
        <button className="btn-ghost w-full py-2 text-[12px]" onClick={()=>{ setMsgs([]); localStorage.removeItem('orelis-msgs') }}>
          Clear Chat
        </button>
      )}
    </div>
  )

  return (
    <div className="h-[calc(100vh-52px)] flex flex-col sm:flex-row">
      {/* Mobile header bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3" style={{borderBottom:'1px solid #111',background:'#000'}}>
        <div>
          <div className="label-gold text-[10px]">Your Business</div>
          <div className="text-[15px] font-bold gradient-gold">AI Advisor</div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="badge badge-gold">Context set</span>}
          <button onClick={()=>setShowSidebar(s=>!s)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
            style={{background:'rgba(200,169,110,0.1)',border:'1px solid rgba(200,169,110,0.2)',color:'#C8A96E'}}>
            {showSidebar?'✕ Close':'◈ Context'}
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="sm:hidden absolute left-0 right-0 z-30 p-4 overflow-y-auto"
            style={{top:52+52,background:'rgba(0,0,0,0.98)',backdropFilter:'blur(20px)',border:'1px solid #1C1C1C',borderTop:'none',maxHeight:'60vh'}}>
            <SidebarContent/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden sm:block w-64 shrink-0 p-5 overflow-y-auto" style={{borderRight:'1px solid #111'}}>
        <SidebarContent/>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {msgs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
              <div className="text-4xl opacity-20 gold-text">◎</div>
              <p className="text-t3 text-[13px]">Ask anything about your business.<br/>Specific, SEA-focused advice.</p>
            </div>
          )}
          {msgs.map((m,i)=>(
            <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
              {m.role==='user' ? (
                <div className="max-w-[80%] px-4 py-2.5 rounded-xl text-[14px] font-medium"
                  style={{background:'rgba(200,169,110,0.15)',border:'1px solid rgba(200,169,110,0.25)',color:'#F0F0F5'}}>
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[90%] sm:max-w-[80%] card p-4 text-[14px]" style={{lineHeight:1.7}}>
                  {renderMsg(m.content)}
                  {loading && i===msgs.length-1 && m.content==='' && (
                    <div className="flex gap-1.5 mt-1">
                      {[0,1,2].map(j=>(<motion.div key={j} className="w-1.5 h-1.5 rounded-full" style={{background:'#8888AA'}} animate={{scale:[1,.3,1]}} transition={{duration:.8,repeat:Infinity,delay:j*.15}}/>))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        <div className="px-4 pt-2 pb-1 flex gap-2 flex-wrap" style={{borderTop:'1px solid #111'}}>
          {quickActions.map((q,i)=>(
            <button key={i} className="pill text-[11px]" onClick={()=>send(q)}>{q}</button>
          ))}
        </div>

        <div className="p-3 sm:p-4 flex gap-2 sm:gap-3">
          <textarea className="input-field flex-1 resize-none text-[14px]" rows={2}
            placeholder="Ask anything about your business…"
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }}/>
          <button className="btn-gold px-4 self-end py-2 text-[14px]" onClick={()=>send()} disabled={loading}>→</button>
        </div>
      </div>
    </div>
  )
}
