import { NextResponse } from 'next/server'

export async function GET() {
  const hasKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your_key_here'
  if (hasKey) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false }, { status: 503 })
}
