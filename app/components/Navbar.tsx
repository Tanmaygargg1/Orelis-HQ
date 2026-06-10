'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BASE_PATH } from '@/lib/config'

export default function Navbar() {
  const path = usePathname()
  const [aiOk, setAiOk] = useState<boolean|null>(null)
  const [mode, setMode] = useState<'business'|'individual'>('business')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch(`${BASE_PATH}/api/health`).then(r=>setAiOk(r.ok)).catch(()=>setAiOk(false))
    const saved = localStorage.getItem('orelis-mode') as 'business'|'individual'|null
    if (saved) setMode(saved)
  }, [])

  const toggleMode = () => {
    const next = mode==='business'?'individual':'business'
    setMode(next); localStorage.setItem('orelis-mode', next)
  }

  const bizLinks = [
    { href:'/', label:'Home', icon:'⬡' },
    { href:'/advisor', label:'Advisor', icon:'◈' },
    { href:'/growth-trajectory', label:'Growth', icon:'◎' },
    { href:'/simulation', label:'Simulation', icon:'△' },
    { href:'/settings', label:'Profile', icon:'◉' },
  ]
  const indLinks = [
    { href:'/', label:'Home', icon:'⬡' },
    { href:'/individual/launchpad', label:'Launchpad', icon:'◈' },
    { href:'/individual/learn', label:'Learn', icon:'◎' },
    { href:'/individual/simulation', label:'Market Sim', icon:'△' },
  ]
  const links = mode==='business' ? bizLinks : indLinks

  return (
    <>
      {/* Desktop / Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{background:'rgba(0,0,0,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid #111',height:52}}>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div style={{width:22,height:22,background:'linear-gradient(135deg,#C8A96E,#E8C98E)',clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)'}}/>
          <span style={{fontWeight:800,fontSize:15,letterSpacing:'-0.01em'}} className="gradient-gold">ORELIS</span>
        </Link>

        {/* Desktop links */}
        <div className="desktop-nav-links flex items-center gap-0.5">
          {links.map(l=>(
            <Link key={l.href} href={l.href}
              className="px-3.5 py-1.5 text-[12px] font-medium transition-all rounded-lg"
              style={{
                color: path===l.href?'#C8A96E':'#444',
                background: path===l.href?'rgba(200,169,110,0.08)':'transparent',
              }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleMode}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{background:'#0A0A0A',border:'1px solid #1C1C1C',color:'#444'}}>
            <span style={{color:mode==='business'?'#C8A96E':'#444'}}>Biz</span>
            <span style={{color:'#222'}}>/</span>
            <span style={{color:mode==='individual'?'#6E8EDA':'#444'}}>Ind</span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px]" style={{color:'#333'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:aiOk===null?'#222':aiOk?'#4CAF7D':'#E05C5C'}}/>
            <span className="hidden sm:inline">{aiOk===null?'…':aiOk?'AI Online':'No Key'}</span>
          </div>
          {/* Mobile hamburger */}
          <button className="sm:hidden p-1.5 rounded-lg" style={{border:'1px solid #1C1C1C'}}
            onClick={()=>setMenuOpen(o=>!o)}>
            <div style={{width:16,display:'flex',flexDirection:'column',gap:3}}>
              <div style={{height:1.5,background:menuOpen?'#C8A96E':'#666',borderRadius:1,transition:'all 0.2s',transform:menuOpen?'rotate(45deg) translate(3px,3px)':'none'}}/>
              <div style={{height:1.5,background:menuOpen?'transparent':'#666',borderRadius:1,transition:'all 0.2s'}}/>
              <div style={{height:1.5,background:menuOpen?'#C8A96E':'#666',borderRadius:1,transition:'all 0.2s',transform:menuOpen?'rotate(-45deg) translate(3px,-3px)':'none'}}/>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="fixed top-[52px] left-0 right-0 z-40 sm:hidden"
          style={{background:'rgba(0,0,0,0.98)',backdropFilter:'blur(20px)',borderBottom:'1px solid #1C1C1C'}}>
          <div className="px-4 py-3 space-y-1">
            {links.map(l=>(
              <Link key={l.href} href={l.href} onClick={()=>setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all"
                style={{
                  color: path===l.href?'#C8A96E':'#888',
                  background: path===l.href?'rgba(200,169,110,0.08)':'transparent',
                  border: path===l.href?'1px solid rgba(200,169,110,0.15)':'1px solid transparent'
                }}>
                <span style={{fontSize:16}}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <div className="pt-2 pb-1 flex items-center justify-between px-2">
              <button onClick={()=>{toggleMode();setMenuOpen(false)}}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold flex-1 mr-2"
                style={{background:'#0A0A0A',border:'1px solid #1C1C1C'}}>
                <span style={{color:mode==='business'?'#C8A96E':'#444'}}>Business</span>
                <span style={{color:'#222'}}>/</span>
                <span style={{color:mode==='individual'?'#6E8EDA':'#444'}}>Individual</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px]" style={{color:'#444'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:aiOk===null?'#222':aiOk?'#4CAF7D':'#E05C5C'}}/>
                <span>{aiOk===null?'…':aiOk?'Online':'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav justify-around items-center">
        {links.map(l=>(
          <Link key={l.href} href={l.href}
            className="flex flex-col items-center gap-1 flex-1 py-1"
            style={{color: path===l.href?'#C8A96E':'#444'}}>
            <span style={{fontSize:18,lineHeight:1}}>{l.icon}</span>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:'0.05em'}}>{l.label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
