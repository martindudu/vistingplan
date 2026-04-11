import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const instrument = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '旅遊建築師 | 您的完美行程規劃專家',
  description: '使用 Google Maps 規劃您的旅遊行程，享受無縫的旅行體驗',
  manifest: '/manifest.json',
  themeColor: '#0a0a0c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '旅遊建築師',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className={`${jakarta.variable} ${instrument.variable}`}>
      <body className={jakarta.className}>{children}</body>
    </html>
  )
}
