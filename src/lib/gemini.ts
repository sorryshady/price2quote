import { GoogleGenerativeAI } from '@google/generative-ai'

import { env } from '@/env/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Get the generative model
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// Company summary generation function
export async function generateCompanySummary(companyData: {
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
    const prompt = `Generate a comprehensive, detailed business summary (4-6 sentences) for internal AI use. This summary will be used by AI agents to understand the company's business context, expertise, market position, and operational details for future AI-powered features.

The summary should include:
- Company's core business and value proposition
- Geographic location and market context
- Service offerings with expertise levels and pricing structure
- Business type and operational model
- Primary/preferred currency for financial operations (note: this is their preferred currency, not necessarily exclusive)
- Any unique characteristics or specializations

Make the summary rich in business context, professional, and comprehensive enough for AI systems to understand the company's full operational scope and market positioning.

Company Name: ${companyData.name}
Description: ${companyData.description}
Business Type: ${companyData.businessType}
Country: ${companyData.country}
Preferred Currency: ${companyData.currency}
Services: ${companyData.services.map(s => `${s.name} (${s.skillLevel} level${s.basePrice ? `, ${s.basePrice}` : ''}${s.description ? `, ${s.description}` : ''})`).join(', ')}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error('Error generating company summary:', error)
    throw new Error('Failed to generate company summary')
  }
} 