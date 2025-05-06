import { NextRequest } from 'next/server'

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
