import { NextRequest } from 'next/server'

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { storage } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIpAddress(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  return ip.split(',')[0].trim()
}

export async function getLocation(ip: string) {
  if (ip === '::ffff:127.0.0.1') {
    return 'Localhost'
  }
  const response = await fetch(`https://ipapi.co/${ip}/json/`)
  const data = await response.json()
  console.log(data)
  return data.city
}

/**
 * Download an email attachment from Supabase storage
 */
export async function downloadAttachment(
  attachmentPath: string,
  originalFilename?: string,
): Promise<void> {
  try {
    // Download the file from Supabase storage
    const blob = await storage.download('email-attachments', attachmentPath)

    // Extract filename from path if not provided
    const filename =
      originalFilename || attachmentPath.split('/').pop() || 'attachment'

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading attachment:', error)
    throw new Error('Failed to download attachment')
  }
}

// Currency formatting utility
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string = 'USD',
  options?: Intl.NumberFormatOptions,
) => {
  if (amount === null || amount === undefined || amount === '') {
    return 'N/A'
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return 'N/A'
  }

  // Currency symbol mapping
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
  }

  const symbol = currencySymbols[currency] || currency

  // Default formatting options
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  try {
    return new Intl.NumberFormat('en-US', {
      ...defaultOptions,
      ...options,
    }).format(numAmount)
  } catch {
    // Fallback formatting with symbol
    return `${symbol}${numAmount.toFixed(2)}`
  }
}

// Get currency symbol only
export const getCurrencySymbol = (currency: string = 'USD'): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
  }
  return currencySymbols[currency] || currency
}
