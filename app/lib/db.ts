/**
 * Simple file-based user store — works on any VPS/EC2 with no external DB.
 * Drop-in replace with Postgres/MySQL by swapping the functions below.
 * Data is stored in /data/users.json (set DATA_DIR env var to change path).
 */
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const DOCS_DIR   = path.join(DATA_DIR, 'documents')

export type User = {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
  bizProfile?: Record<string, any>
  documents?: DocumentMeta[]
}

export type DocumentMeta = {
  id: string
  name: string
  uploadedAt: string
  pageCount: number
  charCount: number
  preview: string      // first 600 chars of extracted markdown
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]')
}

function readUsers(): User[] {
  ensureDirs()
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) }
  catch { return [] }
}

function writeUsers(users: User[]) {
  ensureDirs()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function getUserByEmail(email: string): User | undefined {
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function getUserById(id: string): User | undefined {
  return readUsers().find(u => u.id === id)
}

export function createUser(data: Omit<User, 'id' | 'createdAt' | 'documents'>): User {
  const users = readUsers()
  const user: User = { ...data, id: `u_${Date.now()}`, createdAt: new Date().toISOString(), documents: [] }
  users.push(user)
  writeUsers(users)
  return user
}

export function updateUser(id: string, patch: Partial<User>): User | null {
  const users = readUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return null
  users[idx] = { ...users[idx], ...patch }
  writeUsers(users)
  return users[idx]
}

// Store full document text in its own file to keep users.json lean
export function saveDocumentText(userId: string, docId: string, text: string) {
  ensureDirs()
  const userDir = path.join(DOCS_DIR, userId)
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })
  fs.writeFileSync(path.join(userDir, `${docId}.md`), text)
}

export function getDocumentText(userId: string, docId: string): string {
  ensureDirs()
  const filePath = path.join(DOCS_DIR, userId, `${docId}.md`)
  if (!fs.existsSync(filePath)) return ''
  return fs.readFileSync(filePath, 'utf-8')
}

export function deleteDocument(userId: string, docId: string): User | null {
  const users = readUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx === -1) return null
  users[idx].documents = (users[idx].documents || []).filter(d => d.id !== docId)
  writeUsers(users)
  // Delete the text file
  const filePath = path.join(DOCS_DIR, userId, `${docId}.md`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  return users[idx]
}

// Build combined rawText from all user docs for AI context
export function getUserDocumentsText(userId: string): string {
  const user = getUserById(userId)
  if (!user?.documents?.length) return ''
  return (user.documents || []).map(doc => {
    const text = getDocumentText(userId, doc.id)
    return `[Document: ${doc.name}]\n${text}`
  }).join('\n\n---\n\n')
}
