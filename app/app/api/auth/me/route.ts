import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUserById } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, bizProfile: user.bizProfile, documents: user.documents } })
}
