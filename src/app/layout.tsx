import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AppNavbar } from '@/components/app-navbar'
import Provider from '@/components/provider'

import './globals.css'

export const metadata: Metadata = {
  title: 'Starter Template',
  description: 'Starter Template for Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📦</text></svg>"
        ></link>
      </head>
      <body className={`antialiased`}>
        <Provider>
          <AppNavbar />
          <main>
            <Suspense>{children}</Suspense>
          </main>
        </Provider>
      </body>
    </html>
  )
}
