import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ジムアンケート',
  description: 'ジムに関するアンケートフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </body>
    </html>
  )
}