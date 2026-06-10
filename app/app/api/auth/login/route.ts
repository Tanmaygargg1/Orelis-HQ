import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail } from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const user = getUserByEmail(email)
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    const token = await signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 500 })
  }
}
