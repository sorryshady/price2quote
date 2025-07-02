import { GoogleGenerativeAI } from '@google/generative-ai'

import { env } from '@/env/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

// Get the generative model
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
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
${data.projectData.selectedServices.map((s) => `- ${s.serviceName} (${s.skillLevel}): ${s.quantity} units at $${s.currentPrice}/unit (total: $${s.quantity * s.currentPrice})`).join('\n')}

TASK: Provide a structured analysis with:
1. Market research based on company location vs client location
2. Pricing recommendations for each service PER UNIT with confidence levels
3. Total quote amount with confidence level
4. Reasoning for each recommendation
5. If in person delivery is required, spread the delivery charge over the services. Do not generate separate delivery charges.

IMPORTANT: The "recommendedPrice" should be the PER UNIT price, not the total price for all quantities. For example, if you recommend $12/unit for 40 units, the recommendedPrice should be 12, not 480.

RESPONSE FORMAT (JSON only):
{
  "marketAnalysis": {
    "locationFactor": "string explaining how location affects pricing",
    "marketConditions": "string about current market conditions",
    "competitivePosition": "string about competitive positioning"
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
  "negotiationTips": [
    "string with negotiation strategy"
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
        (service) => {
          // Find the corresponding service data to get quantity
          const serviceData = data.projectData.selectedServices.find(
            (s) => s.serviceName === service.serviceName,
          )

          // Validate and potentially fix unit price if AI returned total price
          let recommendedPrice = service.recommendedPrice
          let priceRange = {
            min: Math.max(0, service.priceRange.min),
            max: Math.max(service.priceRange.min, service.priceRange.max),
          }

          // If AI might have returned total price instead of unit price, convert it
          if (serviceData && serviceData.quantity > 1) {
            const currentTotal = serviceData.currentPrice * serviceData.quantity
            const recommendedTotal = service.recommendedPrice

            // If recommended price is much higher than current total, it might be a total price
            if (recommendedTotal > currentTotal * 2) {
              // Check if it's closer to being a total price than a unit price
              const unitPriceGuess = recommendedTotal / serviceData.quantity
              const totalPriceGuess = recommendedTotal

              const unitPriceDiff = Math.abs(
                unitPriceGuess - serviceData.currentPrice,
              )
              const totalPriceDiff = Math.abs(totalPriceGuess - currentTotal)

              if (totalPriceDiff < unitPriceDiff) {
                // AI probably returned total price, convert to unit price
                recommendedPrice = recommendedTotal / serviceData.quantity
                priceRange = {
                  min: Math.max(
                    0,
                    service.priceRange.min / serviceData.quantity,
                  ),
                  max: Math.max(
                    service.priceRange.min / serviceData.quantity,
                    service.priceRange.max / serviceData.quantity,
                  ),
                }
                console.log(
                  `Converted AI recommendation from total price ${recommendedTotal} to unit price ${recommendedPrice} for ${service.serviceName}`,
                )
              }
            }
          }

          return {
            ...service,
            recommendedPrice,
            confidenceLevel: validateConfidenceLevel(service.confidenceLevel),
            priceRange,
          }
        },
      ),
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

// AI price negotiation function
export async function negotiatePriceWithAI(data: {
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
  }
  negotiationData: {
    serviceName: string
    currentRecommendedPrice: number
    proposedPrice: number
    userReasoning: string
    priceRange: {
      min: number
      max: number
    }
  }
}) {
  try {
    const prompt = `You are an expert pricing consultant helping with price negotiation. A user has proposed a different price for a service and wants your feedback.

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

NEGOTIATION CONTEXT:
Service: ${data.negotiationData.serviceName}
AI Recommended Price: $${data.negotiationData.currentRecommendedPrice}/unit
User Proposed Price: $${data.negotiationData.proposedPrice}/unit
Price Range: $${data.negotiationData.priceRange.min}/unit - $${data.negotiationData.priceRange.max}/unit
User Reasoning: ${data.negotiationData.userReasoning}

TASK: Provide a structured response about the proposed price change:
1. Analyze if the proposed price is reasonable within the market context
2. Consider the user's reasoning and provide feedback
3. Suggest any adjustments or alternative approaches
4. Provide confidence level for your assessment

IMPORTANT: All prices should be PER UNIT prices, not total prices for all quantities.

RESPONSE FORMAT (JSON only):
{
  "analysis": {
    "isReasonable": boolean,
    "reasoning": "string explaining why the price is reasonable or not",
    "marketContext": "string about market positioning",
    "riskAssessment": "string about potential risks or benefits"
  },
  "recommendation": {
    "suggestedPrice": number,
    "confidenceLevel": "high|medium|low",
    "reasoning": "string explaining the recommendation",
    "alternativeApproaches": ["string with alternative pricing strategies"]
  },
  "feedback": {
    "userReasoningAssessment": "string about the user's reasoning",
    "suggestions": ["string with specific suggestions"],
    "warnings": ["string with any warnings or concerns"]
  }
}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const aiResponse = JSON.parse(jsonMatch[0])

    // Validate confidence levels
    const validatedResponse = {
      ...aiResponse,
      recommendation: {
        ...aiResponse.recommendation,
        confidenceLevel: validateConfidenceLevel(
          aiResponse.recommendation.confidenceLevel,
        ),
      },
    }

    return validatedResponse
  } catch (error) {
    console.error('Error negotiating price with AI:', error)
    throw new Error('Failed to negotiate price with AI')
  }
}

// AI final quote generation function
export async function generateFinalQuoteWithAI(data: {
  companyData: {
    name: string
    description: string
    businessType: string
    country: string
    currency: string
    aiSummary?: string
    phone?: string
  }
  projectData: {
    title: string
    description?: string
    complexity: string
    deliveryTimeline: string
    customTimeline?: string
    clientLocation: string
    clientBudget?: number
  }
  finalData: {
    services: Array<{
      serviceName: string
      finalPrice: number
      quantity: number
      totalPrice: number
    }>
    totalAmount: number
    notes: string
  }
}) {
  try {
    const prompt = `You are an expert quote generator. Create a professional, comprehensive quote document based on the provided data.

COMPANY CONTEXT:
${data.companyData.name} - ${data.companyData.businessType} in ${data.companyData.country}
${data.companyData.aiSummary ? `AI Business Summary: ${data.companyData.aiSummary}` : ''}
Phone: ${data.companyData.phone}

PROJECT DETAILS:
Title: ${data.projectData.title}
Description: ${data.projectData.description || 'Not provided'}
Complexity: ${data.projectData.complexity}
Timeline: ${data.projectData.deliveryTimeline}${data.projectData.customTimeline ? ` (${data.projectData.customTimeline})` : ''}
Client Location: ${data.projectData.clientLocation}
Client Budget: ${data.projectData.clientBudget ? `$${data.projectData.clientBudget}` : 'Not specified'}

FINAL QUOTE DATA:
Services: ${data.finalData.services.map((s) => `${s.serviceName}: ${s.quantity} units at $${s.finalPrice}/unit = $${s.totalPrice}`).join(', ')}
Total Amount: $${data.finalData.totalAmount}
Additional Notes: ${data.finalData.notes}

TASK: Generate a professional quote document with:
1. Executive summary
2. Detailed service breakdown
3. Terms and conditions
4. Professional presentation
5. Contact information to be added in the nextSteps. 
6. Mention payment terms but do not specify any specific payment methods (like card, bank transfer, etc).


RESPONSE FORMAT (JSON only):
{
  "quoteDocument": {
    "executiveSummary": "string with project overview and value proposition",
    "serviceBreakdown": [
      {
        "serviceName": "string",
        "description": "string",
        "quantity": number,
        "unitPrice": number,
        "totalPrice": number,
        "deliverables": ["string with specific deliverables"]
      }
    ],
    "termsAndConditions": [
      "string with terms and conditions"
    ],
    "paymentTerms": "string with payment schedule and terms",
    "deliveryTimeline": "string with detailed timeline",
    "nextSteps": "string with clear next steps for the client"
  },
  "presentation": {
    "keyHighlights": ["string with key selling points"],
    "valueProposition": "string explaining the value to the client",
    "competitiveAdvantages": ["string with competitive advantages"]
  }
}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error generating final quote with AI:', error)
    throw new Error('Failed to generate final quote with AI')
  }
}
