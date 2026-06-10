'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BASE_PATH } from '@/lib/config'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell
} from 'recharts'

type Inputs = {
  monthlyRevenue: number
  pricePerCustomer: number
  newCustomers: number
  churnRate: number
  fixedCosts: number
  cac: number
  startingCash: number
  teamSize: number
}

type Point = {
  month: number
  bear: number
  base: number
  bull: number
  cash: number
  costs: number
  profit: number
}

type Analysis = {
  verdict: string
  viabilityStatus: string
  breakEvenMonth: number | null
  runwayMonths: number
  ltvCacRatio: number
  whatWorks: string[]
  whatToFix: { issue: string; impact: string; fix: string }[]
  thirtyDayPlan: { action: string; description: string; outcome: string }[]
  seaContext: string
}

const f$ = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` :
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` :
  `$${Math.round(n)}`

function runScenario(inp: Inputs, gf: number, cf: number): number[] {
  let cust = inp.monthlyRevenue / Math.max(1, inp.pricePerCustomer)
  const arr: number[] = []
  for (let m = 0; m < 24; m++) {
    cust = cust * (1 - (inp.churnRate / 100) * cf) + inp.newCustomers * gf
    arr.push(Math.round(cust * inp.pricePerCustomer))
  }
  return arr
}

function buildData(inp: Inputs): Point[] {
  const base = runScenario(inp, 1, 1)
  const bull = runScenario(inp, 1.2, 0.8)
  const bear = runScenario(inp, 0.8, 1.2)
  let cash = inp.startingCash
  return base.map((b, i) => {
    const costs = inp.fixedCosts + inp.newCustomers * inp.cac
    cash += b - costs
    return { month: i + 1, base: b, bull: bull[i], bear: bear[i], cash, costs, profit: b - costs }
  })
}

function InputField({
  label, value, onChange, prefix = '$', sub, extracted
}: {
  label: string; value: number; onChange: (v: number) => void
  prefix?: string; sub?: string; extracted?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: '#0A0A16', border: `1px solid ${extracted ? '#C8A96E' : '#1A1A2E'}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="label-sm">{label}</span>
        {extracted && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(200,169,110,0.15)', color: '#C8A96E' }}>
            AUTO ✓
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2">
        {prefix && <span className="text-[18px] font-mono" style={{ color: '#444466' }}>{prefix}</span>}
        <input
          type="number"
          className="bg-transparent border-none outline-none font-mono w-full"
          style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F5' }}
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
        />
      </div>
      {sub && <p className="text-[10px] mt-1" style={{ color: '#444466' }}>{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-4 py-3 text-[12px]" style={{ minWidth: 180 }}>
      <p className="font-bold mb-2" style={{ color: '#8888AA' }}>Month {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="mb-0.5" style={{ color: p.color }}>
          {p.name}: {f$(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Simulation() {
  const [inputs, setInputs] = useState<Inputs>({
    monthlyRevenue: 5000, pricePerCustomer: 49, newCustomers: 15,
    churnRate: 5, fixedCosts: 3000, cac: 150, startingCash: 25000, teamSize: 3
  })
  const [extracted, setExtracted] = useState<Partial<Inputs>>({})
  const [data, setData] = useState<Point[]>([])
  const [ran, setRan] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [bizProfile, setBizProfile] = useState<any>(null)

  useEffect(() => {
    const bp = localStorage.getItem('orelis-biz-profile')
    if (bp) {
      const p = JSON.parse(bp)
      setBizProfile(p)
      // Pre-fill from profile if mrr is set
      if (p.mrr) setInputs(prev => ({...prev, monthlyRevenue: parseInt(p.mrr)||prev.monthlyRevenue}))
    }
  }, [])

  const upd = (k: keyof Inputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  function runSim() {
    setData(buildData(inputs))
    setRan(true)
    setAnalysis(null)
  }

  async function analyse() {
    setAnalyzing(true)
    try {
      const last = data[data.length - 1] || { base: 0, bull: 0, bear: 0, cash: 0 }
      const res = await fetch(`${BASE_PATH}/api/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          scenarios: { base: last.base, bull: last.bull, bear: last.bear, cash: last.cash }
        })
      })
      let text = ''
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += dec.decode(value)
      }
      const clean = text.replace(/```json|```/g, '').trim()
      setAnalysis(JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1)))
    } catch (e) {
      console.error(e)
    }
    setAnalyzing(false)
  }

  async function handleFile(file: File) {
    setUploading(true)
    try {
      let content = ''
      if (file.type === 'application/pdf') {
        const b64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res((reader.result as string).split(',')[1])
          reader.onerror = () => rej(new Error('Read failed'))
          reader.readAsDataURL(file)
        })
        const resp = await fetch(`${BASE_PATH}/api/extract-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, base64: b64 })
        })
        const { text: pdfText } = await resp.json()
        content = pdfText
      } else {
        content = await file.text()
      }
      const res = await fetch(`${BASE_PATH}/api/extract-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const d = await res.json()
      const ex: Partial<Inputs> = {}
      const fieldMap: Record<string, keyof Inputs> = {
        monthlyRevenue: 'monthlyRevenue', pricePerCustomer: 'pricePerCustomer',
        newCustomersMonth: 'newCustomers', churnRate: 'churnRate',
        fixedCosts: 'fixedCosts', cac: 'cac',
        startingCash: 'startingCash', teamSize: 'teamSize'
      }
      Object.entries(fieldMap).forEach(([dk, ik]) => {
        if (d[dk]) {
          (ex as any)[ik] = d[dk]
          setInputs(p => ({ ...p, [ik]: d[dk] }))
        }
      })
      setExtracted(ex)
    } catch (e) {
      console.error(e)
    }
    setUploading(false)
  }

  const beMonth = data.findIndex(d => d.profit > 0)
  const ltvcac = (inputs.pricePerCustomer / Math.max(0.01, inputs.churnRate / 100)) / Math.max(1, inputs.cac)
  const last = data[data.length - 1]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="label-gold mb-1">Business</div>
        <h2 className="text-[26px] sm:text-[28px] font-bold mb-1 gradient-gold">Growth Trajectory</h2>
        <p className="text-t3 text-[13px]">Model your revenue, cash, and unit economics over 24 months.</p>
      </div>

      {/* INPUTS */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="label-sm">Model Parameters</div>
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-[12px] font-semibold transition-all"
            style={{
              border: `1px dashed ${dragging ? '#C8A96E' : 'rgba(200,169,110,0.4)'}`,
              color: '#C8A96E',
              background: 'rgba(200,169,110,0.04)'
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
          >
            <input
              type="file" accept=".csv,.txt,.pdf" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
            {uploading ? 'Reading…' : '⬆ Upload financials — AI auto-fills'}
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <InputField label="Monthly Revenue" value={inputs.monthlyRevenue} onChange={upd('monthlyRevenue')} sub="Current MRR" extracted={!!extracted.monthlyRevenue} />
          <InputField label="Price / Customer" value={inputs.pricePerCustomer} onChange={upd('pricePerCustomer')} sub="Per month" extracted={!!extracted.pricePerCustomer} />
          <InputField label="New Customers / Mo" value={inputs.newCustomers} onChange={upd('newCustomers')} prefix="#" sub="Acquisitions" extracted={!!extracted.newCustomers} />
          <InputField label="Churn Rate" value={inputs.churnRate} onChange={upd('churnRate')} prefix="%" sub="Monthly" extracted={!!extracted.churnRate} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <InputField label="Fixed Costs / Mo" value={inputs.fixedCosts} onChange={upd('fixedCosts')} sub="Rent, tools, etc" extracted={!!extracted.fixedCosts} />
          <InputField label="Customer Acq. Cost" value={inputs.cac} onChange={upd('cac')} sub="Per customer" extracted={!!extracted.cac} />
          <InputField label="Starting Cash" value={inputs.startingCash} onChange={upd('startingCash')} sub="Available runway" extracted={!!extracted.startingCash} />
          <InputField label="Team Size" value={inputs.teamSize} onChange={upd('teamSize')} prefix="#" sub="Headcount" extracted={!!extracted.teamSize} />
        </div>

        {/* Live unit economics preview */}
        {inputs.pricePerCustomer > 0 && inputs.cac > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5 p-4 rounded-xl" style={{ background: '#0A0A16', border: '1px solid #1A1A2E' }}>
            <div>
              <div className="label-sm mb-1">LTV (estimated)</div>
              <div className="text-[18px] font-black gold-text">
                {f$(inputs.pricePerCustomer / Math.max(0.01, inputs.churnRate / 100))}
              </div>
            </div>
            <div>
              <div className="label-sm mb-1">LTV : CAC</div>
              <div className="text-[18px] font-black" style={{ color: ltvcac >= 3 ? '#4CAF7D' : ltvcac >= 1.5 ? '#F59E0B' : '#E05C5C' }}>
                {ltvcac.toFixed(1)}×
              </div>
            </div>
            <div>
              <div className="label-sm mb-1">Payback Period</div>
              <div className="text-[18px] font-black" style={{ color: inputs.cac / inputs.pricePerCustomer <= 12 ? '#4CAF7D' : '#F59E0B' }}>
                {Math.round(inputs.cac / Math.max(1, inputs.pricePerCustomer))} mo
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn-gold flex-1 py-3 text-[15px]" onClick={runSim}>
            ▶ Run Simulation
          </button>
          {ran && (
            <button className="btn-ghost flex-1 py-3 text-[14px]" onClick={analyse} disabled={analyzing}>
              {analyzing ? 'Analysing…' : '◎ AI Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {!ran && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4 opacity-20 gold-text">⬡</div>
          <p className="text-t3 text-[14px]">
            Fill in your numbers above and hit Run Simulation.<br />
            Generates Bear / Base / Bull scenarios with full financial projections.
          </p>
        </div>
      )}

      {/* CHARTS */}
      {ran && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Scenario area chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="label-sm mb-1">24-Month Revenue Scenarios</div>
                <p className="text-t3 text-[12px]">Bear (−20% growth) · Base (your inputs) · Bull (+20% growth)</p>
              </div>
              <div className="flex gap-4 text-[11px]">
                {[{ l: 'Bear', c: '#E05C5C' }, { l: 'Base', c: '#C8A96E' }, { l: 'Bull', c: '#4CAF7D' }].map(s => (
                  <div key={s.l} className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: s.c }} />
                    <span className="text-t3">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A96E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C8A96E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gBear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E05C5C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E05C5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
                <XAxis dataKey="month" tickFormatter={v => `M${v}`} tick={{ fill: '#444466', fontSize: 10 }} axisLine={{ stroke: '#1A1A2E' }} tickLine={false} />
                <YAxis tickFormatter={v => f$(v)} tick={{ fill: '#444466', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {beMonth >= 0 && (
                  <ReferenceLine x={beMonth + 1} stroke="#4CAF7D" strokeDasharray="4 2"
                    label={{ value: 'Break-even', fill: '#4CAF7D', fontSize: 10, position: 'top' }} />
                )}
                <Area type="monotone" dataKey="bull" name="Bull" stroke="#4CAF7D" strokeWidth={1.5} fill="url(#gBull)" />
                <Area type="monotone" dataKey="base" name="Base" stroke="#C8A96E" strokeWidth={2.5} fill="url(#gBase)" />
                <Area type="monotone" dataKey="bear" name="Bear" stroke="#E05C5C" strokeWidth={1.5} fill="url(#gBear)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'M12 MRR (Base)', v: f$(data[11]?.base || 0), c: '#C8A96E' },
              { l: 'M24 MRR (Base)', v: f$(data[23]?.base || 0), c: '#C8A96E' },
              { l: 'Cash at M24', v: f$(last?.cash || 0), c: (last?.cash || 0) > 0 ? '#4CAF7D' : '#E05C5C' },
              { l: 'LTV : CAC', v: `${ltvcac.toFixed(1)}×`, c: ltvcac >= 3 ? '#4CAF7D' : ltvcac >= 1.5 ? '#F59E0B' : '#E05C5C' },
            ].map(m => (
              <div key={m.l} className="card p-5">
                <div className="label-sm mb-2">{m.l}</div>
                <div className="text-[26px] font-black" style={{ color: m.c, letterSpacing: '-0.02em' }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Cash + Profit charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-5">
              <div className="label-sm mb-4">Cash Position Over 24 Months</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6E8EDA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6E8EDA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
                  <XAxis dataKey="month" tickFormatter={v => `M${v}`} tick={{ fill: '#444466', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => f$(v)} tick={{ fill: '#444466', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#E05C5C" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="cash" name="Cash" stroke="#6E8EDA" strokeWidth={2} fill="url(#gCash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <div className="label-sm mb-4">Monthly Profit / Loss</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
                  <XAxis dataKey="month" tickFormatter={v => `M${v}`} tick={{ fill: '#444466', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => f$(v)} tick={{ fill: '#444466', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#444466" />
                  <Bar dataKey="profit" name="Profit" radius={[2, 2, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#4CAF7D' : '#E05C5C'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: 'Bear Case M24', v: f$(data[23]?.bear || 0), c: '#E05C5C', desc: '−20% growth, +20% churn' },
              { l: 'Base Case M24', v: f$(data[23]?.base || 0), c: '#C8A96E', desc: 'Your exact inputs' },
              { l: 'Bull Case M24', v: f$(data[23]?.bull || 0), c: '#4CAF7D', desc: '+20% growth, −20% churn' },
            ].map(s => (
              <div key={s.l} className="card p-5 text-center">
                <div className="label-sm mb-2">{s.l}</div>
                <div className="text-[28px] font-black mb-1" style={{ color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
                <div className="text-[11px] text-t3">{s.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI ANALYSIS */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-5">

            <div className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="label-sm">AI Verdict</div>
                <span className="text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: analysis.viabilityStatus === 'Viable' ? 'rgba(76,175,125,0.15)' : analysis.viabilityStatus === 'Not Viable' ? 'rgba(224,92,92,0.15)' : 'rgba(245,158,11,0.15)',
                    color: analysis.viabilityStatus === 'Viable' ? '#4CAF7D' : analysis.viabilityStatus === 'Not Viable' ? '#E05C5C' : '#F59E0B'
                  }}>
                  {analysis.viabilityStatus}
                </span>
              </div>
              <p className="text-[15px] text-t2" style={{ lineHeight: 1.75 }}>{analysis.verdict}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { l: 'Break-Even', v: analysis.breakEvenMonth ? `Month ${analysis.breakEvenMonth}` : 'Not reached', c: analysis.breakEvenMonth ? '#4CAF7D' : '#E05C5C' },
                { l: 'Runway', v: `${analysis.runwayMonths} mo`, c: analysis.runwayMonths >= 12 ? '#4CAF7D' : analysis.runwayMonths >= 6 ? '#F59E0B' : '#E05C5C' },
                { l: 'LTV : CAC', v: `${analysis.ltvCacRatio}×`, c: analysis.ltvCacRatio >= 3 ? '#4CAF7D' : analysis.ltvCacRatio >= 1.5 ? '#F59E0B' : '#E05C5C' },
              ].map(m => (
                <div key={m.l} className="card p-5 text-center">
                  <div className="label-sm mb-2">{m.l}</div>
                  <div className="text-[32px] font-black" style={{ color: m.c, letterSpacing: '-0.02em' }}>{m.v}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="label-sm mb-3 text-success">What&apos;s Working</div>
                {analysis.whatWorks.map((w, i) => (
                  <p key={i} className="text-[13px] text-t2 mb-2 flex gap-2">
                    <span className="text-success">✓</span>{w}
                  </p>
                ))}
              </div>
              <div className="card p-5">
                <div className="label-sm mb-3 text-danger">What to Fix</div>
                {analysis.whatToFix.map((f, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-[13px] font-semibold text-t1">{f.issue}</p>
                    <p className="text-[12px] text-t3 mb-0.5">{f.impact}</p>
                    <p className="text-[12px] text-success">→ {f.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="label-sm mb-4 gold-text">30-Day Action Plan</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.thirtyDayPlan.map((a, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.15)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(200,169,110,0.2)', color: '#C8A96E' }}>{i + 1}</span>
                      <p className="text-[13px] font-semibold">{a.action}</p>
                    </div>
                    <p className="text-[12px] text-t2 mb-1">{a.description}</p>
                    <p className="text-[11px] text-success">→ {a.outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="label-sm mb-3">SEA Market Context</div>
              <p className="text-[14px] text-t2" style={{ lineHeight: 1.7 }}>{analysis.seaContext}</p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
