import Groq from 'groq-sdk'

export const MODEL = 'llama-3.3-70b-versatile'

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === 'gsk_your_key_here') {
    throw new Error('GROQ_API_KEY is not set. Add it in Netlify: Site Settings → Environment Variables.')
  }
  return new Groq({ apiKey })
}
