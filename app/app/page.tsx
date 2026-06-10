'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!
    c.width = window.innerWidth; c.height = window.innerHeight
    const pts = Array.from({length:50},()=>({ x:Math.random()*c.width, y:Math.random()*c.height, vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2, r:Math.random()*.8+.2 }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height)
      pts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>c.width)p.vx*=-1; if(p.y<0||p.y>c.height)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fill() })
      raf=requestAnimationFrame(draw)
    }
    draw(); return ()=>cancelAnimationFrame(raf)
  },[])
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none"/>
}

const NEWS = [
  'SEA e-commerce GMV projected to hit $230B this year — Shopee and Lazada intensifying competition',
  'MAS tightens digital payment regulations — new fintech licensing requirements effective Q3',
  'Sequoia SEA closes $850M fund — B2B SaaS named top priority sector',
  'Indonesia central bank holds rates — consumer spending outlook stable for Q2',
  'Singapore expands SME digitisation grants to S$50k — applications open now',
  'Vietnam fastest-growing digital economy in SEA at 28% YoY growth',
]

const bizCards = [
  { href:'/growth-trajectory', icon:'⬡', title:'Growth Trajectory', desc:'Model your financials. Run Bear/Base/Bull scenarios. Upload docs and get AI analysis of your unit economics.' },
  { href:'/simulation', icon:'◎', title:'Market Simulation', desc:'Test any decision against live SEA market conditions. Social media, crisis, regulation — 6 simulation modules.' },
  { href:'/advisor', icon:'◈', title:'AI Advisor', desc:'Persistent AI that knows your business. No re-entering context. Brutally honest, SEA-specific.' },
]
const indCards = [
  { href:'/individual/learn', icon:'◉', title:'4 Core Courses', desc:'Unit economics, PMF, SEA markets, fundraising — each with quizzes and XP.' },
  { href:'/individual/launchpad', icon:'◈', title:'Idea Launchpad', desc:'Folder-based vault. AI validation reports. Per-idea chat bot.' },
  { href:'/individual/simulation', icon:'⬡', title:'Market Simulator', desc:'24-month simulation with 7 events. Link ideas from Launchpad. AI forecasts your decisions.' },
  { href:'/settings', icon:'△', title:'Business Profile', desc:'Set your context once — used automatically across all business tools.' },
]

export default function Home() {
  const [ticker, setTicker] = useState(0)
  useEffect(() => { const id = setInterval(()=>setTicker(t=>t+1), 4000); return ()=>clearInterval(id) }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden pb-20">
      <Particles/>
      <div className="relative z-10 max-w-5xl w-full text-center">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
          <div className="label-gold mb-5">Built for SEA Founders & Ambitious Individuals</div>
          <h1 className="text-[36px] sm:text-[52px] md:text-[64px] font-black leading-[1.05] tracking-tight mb-5" style={{letterSpacing:'-0.03em'}}>
            Your AI<br/><span style={{color:'#fff',opacity:0.4}}>Business Brain.</span>
          </h1>
          <p className="text-[15px] max-w-lg mx-auto mb-6 text-t2" style={{lineHeight:1.75}}>
            Validate ideas. Simulate market decisions. Get strategic advice.<br/>
            Built for founders who want to think before they act.
          </p>
        </motion.div>

        {/* Live ticker */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}} className="mb-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl text-[12px] mx-auto"
            style={{background:'rgba(255,255,255,0.03)',border:'1px solid #1C1C1C'}}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#22C55E'}}/>
              <span className="label-sm" style={{color:'#555'}}>SEA TODAY</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.span key={ticker} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                className="text-t3 truncate max-w-xs md:max-w-md">
                {NEWS[ticker % NEWS.length]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Business */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.3}}>
          <div className="label-gold mb-4 text-left">Business & Founders</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {bizCards.map((c,i)=>(
              <motion.div key={c.href} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.35+i*.07}}>
                <Link href={c.href}>
                  <div className="card card-hover p-6 text-left h-full">
                    <div className="text-2xl mb-4 text-t2">{c.icon}</div>
                    <h3 className="text-[15px] font-bold mb-2 text-t1">{c.title}</h3>
                    <p className="text-[13px] text-t3 mb-5" style={{lineHeight:1.7}}>{c.desc}</p>
                    <span className="text-[12px] font-semibold text-t2">Open →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Individual */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}}>
          <div className="label-blue mb-4 text-left">Individual</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {indCards.map((c,i)=>(
              <motion.div key={c.href} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.55+i*.07}}>
                <Link href={c.href}>
                  <div className="card card-hover p-5 text-left h-full" style={{borderColor:'#1C1C1C'}}>
                    <div className="text-2xl mb-3 text-t3">{c.icon}</div>
                    <h3 className="text-[14px] font-bold mb-1.5 text-t1">{c.title}</h3>
                    <p className="text-[12px] text-t3 mb-4" style={{lineHeight:1.7}}>{c.desc}</p>
                    <span className="text-[11px] font-semibold text-t3">Open →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.9}}
          className="flex items-center justify-center gap-6 text-[11px] text-t3">
          <span>5,000+ Founders in SEA</span><span>·</span>
          <span>AI-Powered</span><span>·</span>
          <span>Built in Singapore</span>
        </motion.div>
      </div>
    </div>
  )
}
