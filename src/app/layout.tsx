import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { AuthProvider } from '@/components/providers/auth-provider'
import Provider from '@/components/providers/provider'

import { QueryProvider } from '@/providers/query-provider'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Price2Quote - AI-Powered Pricing',
  description: 'Generate professional quotes with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>"
        ></link>
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <Provider>
            <AuthProvider>{children}</AuthProvider>
          </Provider>
        </QueryProvider>
      </body>
    </html>
  )
}
