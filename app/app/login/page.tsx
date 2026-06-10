'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BASE_PATH } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${BASE_PATH}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      router.push('/')
    } catch { setError('Connection error. Try again.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'#000'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div style={{width:28,height:28,background:'linear-gradient(135deg,#C8A96E,#E8C98E)',clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)'}}/>
            <span className="gradient-gold" style={{fontWeight:900,fontSize:20,letterSpacing:'-0.02em'}}>ORELIS</span>
          </div>
          <h1 className="text-[24px] font-bold mb-1">Welcome back</h1>
          <p className="text-t3 text-[13px]">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-sm block mb-2">Email</label>
              <input className="input-field" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
            </div>
            <div>
              <label className="label-sm block mb-2">Password</label>
              <input className="input-field" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required/>
            </div>
            {error && (
              <div className="px-3 py-2.5 rounded-lg text-[12px]" style={{background:'rgba(224,92,92,0.1)',border:'1px solid rgba(224,92,92,0.25)',color:'#E05C5C'}}>
                {error}
              </div>
            )}
            <button type="submit" className="btn-gold w-full py-3 text-[14px] mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-t3 mt-5">
          No account?{' '}
          <Link href="/register" className="gold-text font-semibold hover:opacity-80 transition-opacity">
            Create one free →
          </Link>
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-t3">
          <Link href="/terms" className="hover:text-t2 transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-t2 transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  )
}
