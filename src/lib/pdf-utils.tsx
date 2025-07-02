import React from 'react'

import { pdf } from '@react-pdf/renderer'

import { QuotePDF } from '@/components/ui/quote-pdf'

import type { Quote } from '@/types'

export async function generateQuotePDF(quote: Quote): Promise<Blob> {
  try {
    const element = <QuotePDF quote={quote} />
    const blob = await pdf(element).toBlob()

    return blob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`Failed to generate PDF: ${error}`)
  }
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateQuoteFilename(quote: Quote): string {
  const date = new Date().toISOString().split('T')[0]
  const projectTitle = quote.projectTitle.replace(/[^a-zA-Z0-9]/g, '_')
  const quoteId = quote.id.slice(0, 8)
  return `Quote_${projectTitle}_${quoteId}_${date}.pdf`
}
