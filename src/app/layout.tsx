import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Lora } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'
import data from "@/data/data.json"

const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-sans',
  display:  'swap',
})

const lora = Lora({
  subsets:  ['latin'],
  variable: '--font-serif',
  display:  'swap',
})

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${jakarta.variable} ${lora.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}