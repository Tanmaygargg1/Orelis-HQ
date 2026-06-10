import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Orelis Hub',
  description: 'AI-powered business platform for SEA founders'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="pt-14 min-h-screen">{children}</main>
      </body>
    </html>
  )
}
