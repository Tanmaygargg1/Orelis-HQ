import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUserById, updateUser, saveDocumentText, deleteDocument } from '@/lib/db'

// Upload document (PDF text already extracted, passed as markdown)
export async function POST(req: NextRequest) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, text, preview, pageCount, charCount } = await req.json()
  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const docId = `doc_${Date.now()}`
  const meta = { id: docId, name, uploadedAt: new Date().toISOString(), pageCount: pageCount || 0, charCount: charCount || 0, preview: preview || text.slice(0, 600) }

  // Save full text to file, metadata to user record
  saveDocumentText(session.userId, docId, text)
  const docs = [...(user.documents || []), meta]
  updateUser(session.userId, { documents: docs })

  return NextResponse.json({ ok: true, doc: meta })
}

// Delete a document
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { docId } = await req.json()
  deleteDocument(session.userId, docId)
  return NextResponse.json({ ok: true })
}
