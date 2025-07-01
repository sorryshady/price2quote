'use server'

import { generateCompanySummary } from '@/lib/gemini'

export async function generateCompanySummaryAction(data: {
  name: string
  description: string
  businessType: string
  country: string
  currency: string
  services: Array<{
    name: string
    description?: string
    skillLevel: string
    basePrice?: string
  }>
}) {
  try {
    const summary = await generateCompanySummary(data)
    return { success: true, summary }
  } catch (error) {
    console.error('Error generating company summary:', error)
    return { success: false, error: 'Failed to generate summary' }
  }
} 