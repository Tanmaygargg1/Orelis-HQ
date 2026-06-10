import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'orelis-change-this-in-production-secret-key'
)
const COOKIE_NAME = 'orelis_session'

export async function signToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSessionUser(req: NextRequest): Promise<{ userId: string; email: string } | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export { COOKIE_NAME }
