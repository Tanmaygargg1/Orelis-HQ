import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail, createUser } from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    if (getUserByEmail(email)) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const user = createUser({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash })
    const token = await signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Registration failed' }, { status: 500 })
  }
}
