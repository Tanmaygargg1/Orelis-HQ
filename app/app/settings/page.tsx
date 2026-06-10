'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BASE_PATH } from '@/lib/config'

type BizProfile = {
  name: string; description: string; industry: string; market: string
  mrr: string; customers: string; stage: string; team: string; challenge: string
}
type DocMeta = { id: string; name: string; uploadedAt: string; pageCount: number; charCount: number; preview: string }

const EMPTY: BizProfile = { name:'',description:'',industry:'SaaS',market:'Singapore',mrr:'',customers:'',stage:'Early Revenue',team:'',challenge:'' }
const INDUSTRIES = ['SaaS','E-Commerce','Fintech','F&B','Edtech','Logistics','Healthcare','Other']
const MARKETS = ['Singapore','Indonesia','Malaysia','Philippines','Thailand','Vietnam','SEA (all)']
const STAGES = ['Pre-revenue','Early Revenue','$10k–$100k MRR','$100k+ MRR']

export default function Settings() {
  const [profile, setProfile] = useState<BizProfile>(EMPTY)
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [tab, setTab] = useState<'profile'|'docs'>('profile')
  const [expandedPreview, setExpandedPreview] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${BASE_PATH}/api/user/profile`).then(r=>r.json()).then(d => {
      if (d.bizProfile) setProfile({...EMPTY,...d.bizProfile})
    }).catch(()=>{})
    fetch(`${BASE_PATH}/api/auth/me`).then(r=>r.json()).then(d => {
      if (d.user?.documents) setDocs(d.user.documents)
    }).catch(()=>{})
  }, [])

  function upd(k: keyof BizProfile, v: string) { setProfile(p => ({...p, [k]: v})) }

  async function save() {
    await fetch(`${BASE_PATH}/api/user/profile`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(profile) })
    // Also keep in localStorage for quick access across pages
    localStorage.setItem('orelis-biz-profile', JSON.stringify({...profile, lastUpdated: new Date().toLocaleString()}))
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  async function handleFiles(fl: FileList | null) {
    if (!fl) return
    setUploading(true)
    for (const file of Array.from(fl)) {
      setUploadMsg(`Processing ${file.name}…`)
      let text = '', preview = '', pageCount = 0, charCount = 0
      if (file.type === 'application/pdf') {
        const b64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res((reader.result as string).split(',')[1])
          reader.onerror = () => rej(new Error('Read failed'))
          reader.readAsDataURL(file)
        })
        const resp = await fetch(`${BASE_PATH}/api/extract-pdf`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: file.name, base64: b64 }) })
        const data = await resp.json()
        text = data.text || ''; preview = data.preview || ''; pageCount = data.pageCount || 0; charCount = data.charCount || 0
      } else {
        text = await file.text(); text = text.slice(0, 8000); preview = text.slice(0, 600); charCount = text.length
      }
      // Save to server
      const res = await fetch(`${BASE_PATH}/api/user/documents`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: file.name, text, preview, pageCount, charCount }) })
      const saved = await res.json()
      if (saved.doc) setDocs(d => [...d, saved.doc])
    }
    setUploadMsg(''); setUploading(false)
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Delete this document?')) return
    await fetch(`${BASE_PATH}/api/user/documents`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ docId }) })
    setDocs(d => d.filter(x => x.id !== docId))
  }

  const complete = [profile.name, profile.description, profile.mrr, profile.challenge].filter(Boolean).length
  const pct = Math.round((complete / 4) * 100)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="label-gold mb-1">Business Tools</div>
        <h2 className="text-[26px] sm:text-[28px] font-bold mb-1 gradient-gold">Business Profile</h2>
        <p className="text-t3 text-[13px]">Set your context once — used across Advisor, Growth & Simulation.</p>
      </div>

      <div className="card p-4 mb-5 flex items-center gap-4">
        <div className="flex-1 h-1.5 rounded-full" style={{background:'#1A1A2E'}}>
          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:'linear-gradient(90deg,#C8A96E,#E8C98E)'}}/>
        </div>
        <span className="text-[12px] text-t3 shrink-0">{pct}% complete</span>
      </div>

      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{background:'#0A0A16',border:'1px solid #1A1A2E'}}>
        {(['profile','docs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize"
            style={{background:tab===t?'rgba(200,169,110,0.15)':'transparent',color:tab===t?'#C8A96E':'#8888AA',border:tab===t?'1px solid rgba(200,169,110,0.25)':'1px solid transparent'}}>
            {t === 'profile' ? '◈ Profile' : `⬡ Documents ${docs.length > 0 ? `(${docs.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
          <div className="card p-5">
            <div className="label-sm mb-4">Core Info</div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-t3 mb-1 block">Business Name</label>
                <input className="input-field" placeholder="e.g. Acme SaaS" value={profile.name} onChange={e=>upd('name',e.target.value)}/>
              </div>
              <div>
                <label className="text-[11px] text-t3 mb-1 block">What does your business do?</label>
                <textarea className="input-field resize-none" rows={3} placeholder="B2B SaaS for Indonesian SMEs…" value={profile.description} onChange={e=>upd('description',e.target.value)}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-t3 mb-2 block">Industry</label>
                  <div className="flex flex-wrap gap-1.5">
                    {INDUSTRIES.map(i => (
                      <button key={i} onClick={()=>upd('industry',i)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                        style={{background:profile.industry===i?'rgba(200,169,110,0.15)':'#0A0A16',border:`1px solid ${profile.industry===i?'#C8A96E':'#1A1A2E'}`,color:profile.industry===i?'#C8A96E':'#444466'}}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-t3 mb-2 block">Primary Market</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKETS.map(m => (
                      <button key={m} onClick={()=>upd('market',m)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                        style={{background:profile.market===m?'rgba(200,169,110,0.15)':'#0A0A16',border:`1px solid ${profile.market===m?'#C8A96E':'#1A1A2E'}`,color:profile.market===m?'#C8A96E':'#444466'}}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="label-sm mb-4">Metrics</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {k:'mrr',label:'Current MRR (USD)',ph:'e.g. 12000'},
                {k:'customers',label:'Active Customers',ph:'e.g. 45'},
                {k:'team',label:'Team Size',ph:'e.g. 4'},
              ].map(f => (
                <div key={f.k}>
                  <label className="text-[11px] text-t3 mb-1 block">{f.label}</label>
                  <input className="input-field" placeholder={f.ph} value={(profile as any)[f.k]} onChange={e=>upd(f.k as keyof BizProfile,e.target.value)}/>
                </div>
              ))}
              <div>
                <label className="text-[11px] text-t3 mb-2 block">Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button key={s} onClick={()=>upd('stage',s)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{background:profile.stage===s?'rgba(200,169,110,0.15)':'#0A0A16',border:`1px solid ${profile.stage===s?'#C8A96E':'#1A1A2E'}`,color:profile.stage===s?'#C8A96E':'#444466'}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="label-sm mb-3">Biggest Current Challenge</div>
            <textarea className="input-field resize-none" rows={2}
              placeholder="e.g. Churn is 8%/month and we can't figure out why…"
              value={profile.challenge} onChange={e=>upd('challenge',e.target.value)}/>
          </div>

          <button onClick={save} className="btn-gold w-full py-3 text-[14px] font-bold">
            {saved ? '✓ Saved — Active across all business tools' : '◈ Save Business Profile'}
          </button>
        </motion.div>
      )}

      {tab === 'docs' && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
          <div className="card p-5">
            <div className="label-gold mb-1">Upload Business Documents</div>
            <p className="text-[12px] text-t3 mb-4" style={{lineHeight:1.6}}>
              Upload PDFs, pitch decks, financial models. The AI will read the full content and use it in Advisor, Simulation, and Growth Trajectory.
            </p>
            <label className="flex flex-col items-center justify-center p-8 rounded-xl cursor-pointer transition-all"
              style={{border:'2px dashed rgba(200,169,110,0.3)',background:'rgba(200,169,110,0.03)'}}>
              <input type="file" multiple accept=".txt,.csv,.pdf,.md" className="hidden"
                onChange={e => handleFiles(e.target.files)} disabled={uploading}/>
              <div className="text-3xl mb-2 gold-text">⬆</div>
              <div className="text-[13px] font-semibold gold-text mb-1">
                {uploading ? (uploadMsg || 'Processing…') : 'Drop files or click to upload'}
              </div>
              <div className="text-[11px] text-t3">PDF, TXT, CSV, MD · AI reads full content</div>
            </label>
          </div>

          {docs.length > 0 && (
            <div className="card p-5">
              <div className="label-sm mb-3">Uploaded Documents ({docs.length})</div>
              <div className="space-y-3">
                {docs.map(doc => (
                  <div key={doc.id}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{background:'#0A0A16',border:'1px solid #1A1A2E'}}>
                      <span className="gold-text text-[15px]">◈</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-t1 font-medium truncate">{doc.name}</div>
                        <div className="flex gap-3 mt-0.5">
                          {doc.pageCount > 0 && <span className="text-[10px] text-t3">{doc.pageCount} pages</span>}
                          {doc.charCount > 0 && <span className="text-[10px] text-t3">{(doc.charCount/1000).toFixed(1)}k chars</span>}
                          <span className="text-[10px] text-success">✓ Extracted</span>
                        </div>
                      </div>
                      <button onClick={() => setExpandedPreview(expandedPreview===doc.id?null:doc.id)}
                        className="text-[11px] px-2 py-1 rounded" style={{color:'#6E8EDA',border:'1px solid rgba(110,142,218,0.2)',background:'rgba(110,142,218,0.05)'}}>
                        {expandedPreview===doc.id?'Hide':'Preview'}
                      </button>
                      <button onClick={() => deleteDoc(doc.id)} className="text-danger text-[11px] px-2 py-1 rounded" style={{border:'1px solid rgba(224,92,92,0.2)',background:'rgba(224,92,92,0.05)'}}>
                        ✕
                      </button>
                    </div>
                    {expandedPreview === doc.id && (
                      <div className="mx-3 rounded-b-lg px-3 py-3 text-[11px] font-mono" style={{background:'#050510',border:'1px solid #1A1A2E',borderTop:'none',color:'#8888AA',lineHeight:1.7,maxHeight:200,overflow:'auto'}}>
                        {doc.preview}{doc.preview?.length >= 600 ? '\n\n[… truncated — full content sent to AI]' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {docs.length === 0 && (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3 opacity-20 gold-text">⬡</div>
              <p className="text-t3 text-[13px]">No documents uploaded yet.<br/>Upload PDFs and the AI will read the full content.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
