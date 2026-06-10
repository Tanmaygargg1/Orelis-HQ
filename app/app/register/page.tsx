'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BASE_PATH } from '@/lib/config'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('You must agree to the Terms of Service and Privacy Policy'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      router.push('/')
    } catch { setError('Connection error. Try again.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{background:'#000'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div style={{width:28,height:28,background:'linear-gradient(135deg,#C8A96E,#E8C98E)',clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)'}}/>
            <span className="gradient-gold" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.02em'}}>ORELIS</span>
          </div>
          <h1 className="text-[24px] font-bold mb-1">Create your account</h1>
          <p className="text-t3 text-[13px]">Free for founders in SEA</p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-sm block mb-2">Full Name</label>
              <input className="input-field" type="text" placeholder="Jane Founder"
                value={name} onChange={e => setName(e.target.value)} required autoFocus/>
            </div>
            <div>
              <label className="label-sm block mb-2">Email</label>
              <input className="input-field" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required/>
            </div>
            <div>
              <label className="label-sm block mb-2">Password <span className="text-t3 normal-case font-normal">(min 8 chars)</span></label>
              <input className="input-field" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8}/>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0" onClick={() => setAgreed(a => !a)}>
                <div style={{width:16,height:16,borderRadius:4,border:`1px solid ${agreed?'#C8A96E':'#333'}`,background:agreed?'rgba(200,169,110,0.2)':'transparent',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {agreed && <span style={{color:'#C8A96E',fontSize:10,fontWeight:900}}>✓</span>}
                </div>
              </div>
              <span className="text-[12px] text-t2" style={{lineHeight:1.5}}>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="gold-text hover:opacity-80">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" className="gold-text hover:opacity-80">Privacy Policy</Link>
              </span>
            </label>
            {error && (
              <div className="px-3 py-2.5 rounded-lg text-[12px]" style={{background:'rgba(224,92,92,0.1)',border:'1px solid rgba(224,92,92,0.25)',color:'#E05C5C'}}>
                {error}
              </div>
            )}
            <button type="submit" className="btn-gold w-full py-3 text-[14px] mt-1" disabled={loading || !agreed}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-t3 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="gold-text font-semibold hover:opacity-80 transition-opacity">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
