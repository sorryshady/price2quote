import { GoogleGenerativeAI } from '@google/generative-ai'

import { env } from '@/env/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Get the generative model
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
})

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
Services: ${companyData.services.map((s) => `${s.name} (${s.skillLevel} level${s.basePrice ? `, ${s.basePrice}` : ''}${s.description ? `, ${s.description}` : ''})`).join(', ')}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error('Error generating company summary:', error)
    throw new Error('Failed to generate company summary')
  }
}

// AI response types
interface ServiceRecommendation {
  serviceName: string
  currentPrice: number
  recommendedPrice: number
  confidenceLevel: 'high' | 'medium' | 'low'
  reasoning: string
  priceRange: {
    min: number
    max: number
  }
}

interface AIQuoteResponse {
  marketAnalysis: {
    locationFactor: string
    marketConditions: string
    competitivePosition: string
  }
  serviceRecommendations: ServiceRecommendation[]
  totalQuote: {
    currentTotal: number
    recommendedTotal: number
    confidenceLevel: 'high' | 'medium' | 'low'
    reasoning: string
  }
  negotiationTips: string[]
}

// AI-assisted quote generation with pricing thresholds
export async function generateAIAssistedQuote(data: {
  companyData: {
    name: string
    description: string
    businessType: string
    country: string
    currency: string
    aiSummary?: string
    services: Array<{
      name: string
      description?: string
      skillLevel: string
      basePrice?: string
    }>
  }
  projectData: {
    title: string
    description?: string
    complexity: string
    deliveryTimeline: string
    customTimeline?: string
    clientLocation: string
    clientBudget?: number
    selectedServices: Array<{
      serviceName: string
      skillLevel: string
      basePrice?: string
      quantity: number
      currentPrice: number
    }>
  }
}): Promise<AIQuoteResponse> {
  try {
    const prompt = `You are an expert pricing consultant helping a business generate competitive quotes. Analyze the project requirements and provide pricing recommendations with confidence levels.

COMPANY CONTEXT:
${data.companyData.name} - ${data.companyData.businessType} in ${data.companyData.country}
${data.companyData.aiSummary ? `AI Business Summary: ${data.companyData.aiSummary}` : ''}
Services: ${data.companyData.services.map((s) => `${s.name} (${s.skillLevel} level${s.basePrice ? `, base: ${s.basePrice}` : ''})`).join(', ')}

PROJECT DETAILS:
Title: ${data.projectData.title}
Description: ${data.projectData.description || 'Not provided'}
Complexity: ${data.projectData.complexity}
Timeline: ${data.projectData.deliveryTimeline}${data.projectData.customTimeline ? ` (${data.projectData.customTimeline})` : ''}
Client Location: ${data.projectData.clientLocation}
Client Budget: ${data.projectData.clientBudget ? `$${data.projectData.clientBudget}` : 'Not specified'}

SELECTED SERVICES:
${data.projectData.selectedServices.map((s) => `- ${s.serviceName} (${s.skillLevel}): ${s.quantity} units at $${s.currentPrice}/unit`).join('\n')}

TASK: Provide a structured analysis with:
1. Market research based on company location vs client location
2. Pricing recommendations for each service with confidence levels
3. Total quote amount with confidence level
4. Reasoning for each recommendation

RESPONSE FORMAT (JSON only):
{
  "marketAnalysis": {
    "locationFactor": "string explaining location impact",
    "marketConditions": "string about local market rates",
    "competitivePosition": "string about competitive advantage"
  },
  "serviceRecommendations": [
    {
      "serviceName": "string",
      "currentPrice": number,
      "recommendedPrice": number,
      "confidenceLevel": "high|medium|low",
      "reasoning": "string explaining the recommendation",
      "priceRange": {
        "min": number,
        "max": number
      }
    }
  ],
  "totalQuote": {
    "currentTotal": number,
    "recommendedTotal": number,
    "confidenceLevel": "high|medium|low",
    "reasoning": "string explaining total recommendation"
  },
  "negotiationTips": [
    "string with negotiation advice"
  ]
}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const aiResponse = JSON.parse(jsonMatch[0]) as AIQuoteResponse

    // Validate confidence levels and add thresholds
    const validatedResponse: AIQuoteResponse = {
      ...aiResponse,
      serviceRecommendations: aiResponse.serviceRecommendations.map(
        (service) => ({
          ...service,
          confidenceLevel: validateConfidenceLevel(service.confidenceLevel),
          priceRange: {
            min: Math.max(0, service.priceRange.min),
            max: Math.max(service.priceRange.min, service.priceRange.max),
          },
        }),
      ),
      totalQuote: {
        ...aiResponse.totalQuote,
        confidenceLevel: validateConfidenceLevel(
          aiResponse.totalQuote.confidenceLevel,
        ),
      },
    }

    return validatedResponse
  } catch (error) {
    console.error('Error generating AI-assisted quote:', error)
    throw new Error('Failed to generate AI-assisted quote')
  }
}

function validateConfidenceLevel(level: string): 'high' | 'medium' | 'low' {
  const validLevels = ['high', 'medium', 'low']
  return validLevels.includes(level.toLowerCase())
    ? (level.toLowerCase() as 'high' | 'medium' | 'low')
    : 'medium'
}
