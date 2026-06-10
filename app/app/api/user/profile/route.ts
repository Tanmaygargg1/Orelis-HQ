import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { updateUser, getUserById } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const updated = updateUser(session.userId, { bizProfile: body })
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ bizProfile: user.bizProfile || {} })
}
