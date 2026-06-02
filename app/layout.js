import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/layout/AppShell'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'ORI Sprint OS',
  description: '18-Day Revenue Sprint System',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
