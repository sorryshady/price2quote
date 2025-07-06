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
Client Budget: ${data.projectData.clientBudget ? `${data.companyData.currency} ${data.projectData.clientBudget}` : 'Not specified'}

SELECTED SERVICES:
${data.projectData.selectedServices.map((s) => `- ${s.serviceName} (${s.skillLevel}): ${s.quantity} units at ${data.companyData.currency} ${s.currentPrice}/unit (total: ${data.companyData.currency} ${s.quantity * s.currentPrice})`).join('\n')}

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
Client Budget: ${data.projectData.clientBudget ? `${data.companyData.currency} ${data.projectData.clientBudget}` : 'Not specified'}

NEGOTIATION CONTEXT:
Service: ${data.negotiationData.serviceName}
AI Recommended Price: ${data.companyData.currency} ${data.negotiationData.currentRecommendedPrice}/unit
User Proposed Price: ${data.companyData.currency} ${data.negotiationData.proposedPrice}/unit
Price Range: ${data.companyData.currency} ${data.negotiationData.priceRange.min}/unit - ${data.companyData.currency} ${data.negotiationData.priceRange.max}/unit
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
    email?: string
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
Client Budget: ${data.projectData.clientBudget ? `${data.companyData.currency} ${data.projectData.clientBudget}` : 'Not specified'}

FINAL QUOTE DATA:
Services: ${data.finalData.services.map((s) => `${s.serviceName}: ${s.quantity} units at ${data.companyData.currency} ${s.finalPrice}/unit = ${data.companyData.currency} ${s.totalPrice}`).join(', ')}
Total Amount: ${data.companyData.currency} ${data.finalData.totalAmount}
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

// AI email generation function
export async function generateAIEmail(data: {
  companyData: {
    name: string
    description?: string
    businessType: string
    country: string
    aiSummary?: string
    phone?: string
  }
  quoteData: {
    projectTitle: string
    clientName?: string
    clientEmail?: string
    amount?: string
    currency: string
    status: string
    projectDescription?: string
    createdAt: Date
  }
  emailType: 'draft' | 'sent' | 'revised' | 'accepted' | 'rejected'
  customContext?: string
}) {
  try {
    const formatCurrency = (
      amount: string | null | undefined,
      currency: string,
    ) => {
      if (!amount) return 'TBD'
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
        }).format(parseFloat(amount))
      } catch {
        // Fallback formatting
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
        return `${symbol}${parseFloat(amount).toFixed(2)}`
      }
    }

    const prompt = `You are an expert business communication specialist helping ${data.companyData.name} write professional emails to clients.

COMPANY CONTEXT:
${data.companyData.name} - ${data.companyData.businessType} in ${data.companyData.country}
${data.companyData.aiSummary ? `Business Summary: ${data.companyData.aiSummary}` : ''}
${data.companyData.description ? `Description: ${data.companyData.description}` : ''}
${data.companyData.phone ? `Phone: ${data.companyData.phone}` : ''}

QUOTE DETAILS:
Project: ${data.quoteData.projectTitle}
Client: ${data.quoteData.clientName || 'Client'}
Amount: ${formatCurrency(data.quoteData.amount, data.quoteData.currency)}
Status: ${data.quoteData.status}
${data.quoteData.projectDescription ? `Description: ${data.quoteData.projectDescription}` : ''}
${data.customContext ? `Additional Context: ${data.customContext}` : ''}

EMAIL TYPE: ${data.emailType.toUpperCase()}

TASK: Generate a professional, personalized email that:
1. Matches the company's tone and business type
2. Is appropriate for the quote status
3. Includes all relevant project details
4. Has a clear call-to-action
5. Is warm but professional
6. Uses the client's name when available
7. References the specific project and amount
8. Includes contact information in the signature (phone number if available)

EMAIL REQUIREMENTS:
- Subject line should be clear and professional
- Body should be 3-5 paragraphs
- Include a greeting with client name if available
- Reference the specific project and amount
- End with a professional signature using company name
- Include phone number in signature if available
- Tone should match the email type (follow-up, confirmation, etc.)

RESPONSE FORMAT (JSON only):
{
  "subject": "string",
  "body": "string (with proper line breaks)",
  "tone": "professional|friendly|formal|casual"
}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const aiResponse = JSON.parse(jsonMatch[0]) as {
      subject: string
      body: string
      tone: string
    }

    return {
      success: true,
      email: {
        subject: aiResponse.subject,
        body: aiResponse.body,
        tone: aiResponse.tone,
      },
    }
  } catch (error) {
    console.error('Error generating AI email:', error)
    return {
      success: false,
      error: 'Failed to generate AI email',
    }
  }
}

// Quote revision analysis types
interface QuoteRevisionAnalysis {
  marketAnalysis: {
    locationFactor: string
    marketConditions: string
    competitivePosition: string
    revisionContext: string
  }
  serviceRecommendations: Array<{
    serviceName: string
    currentPrice: number
    recommendedPrice: number
    confidenceLevel: 'high' | 'medium' | 'low'
    reasoning: string
    priceRange: {
      min: number
      max: number
    }
    revisionImpact: string
  }>
  negotiationTips: string[]
  revisionStrategy: string
}

// Generate AI analysis for quote revisions
export async function generateQuoteRevisionAnalysis(data: {
  companyData: {
    name: string
    description: string
    businessType: string
    country: string
    currency: string
    aiSummary?: string
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
  revisionContext: {
    clientFeedback: string
    revisionNotes: string
    previousQuoteData: {
      amount: string
      services: Array<{
        serviceName: string
        quantity: number
        unitPrice: number
        totalPrice: number
      }>
      status: string
      versionNumber?: number
    }
    currentServices: Array<{
      serviceName: string
      skillLevel: string
      quantity: number
      currentPrice: number
    }>
  }
}): Promise<QuoteRevisionAnalysis> {
  try {
    const prompt = `You are an expert pricing consultant helping a business revise a quote based on client feedback and market changes. This is a REVISION of an existing quote, so consider the context carefully.

COMPANY CONTEXT:
${data.companyData.name} - ${data.companyData.businessType} in ${data.companyData.country}
${data.companyData.aiSummary ? `AI Business Summary: ${data.companyData.aiSummary}` : ''}

PROJECT DETAILS:
Title: ${data.projectData.title}
Description: ${data.projectData.description || 'Not provided'}
Complexity: ${data.projectData.complexity}
Timeline: ${data.projectData.deliveryTimeline}${data.projectData.customTimeline ? ` (${data.projectData.customTimeline})` : ''}
Client Location: ${data.projectData.clientLocation}
Client Budget: ${data.projectData.clientBudget ? `$${data.projectData.clientBudget}` : 'Not specified'}

REVISION CONTEXT:
Previous Quote Amount: $${data.revisionContext.previousQuoteData.amount}
Previous Quote Status: ${data.revisionContext.previousQuoteData.status}
Version: ${data.revisionContext.previousQuoteData.versionNumber || 1}

Client Feedback: "${data.revisionContext.clientFeedback || 'No feedback provided'}"
Revision Notes: "${data.revisionContext.revisionNotes || 'No revision notes'}"
Previous Services: ${data.revisionContext.previousQuoteData.services.map((s) => `${s.serviceName}: ${s.quantity} units at $${s.unitPrice}/unit (total: $${s.totalPrice})`).join(', ')}

CURRENT SERVICES (TO BE REVISED):
${data.revisionContext.currentServices.map((s) => `- ${s.serviceName} (${s.skillLevel}): ${s.quantity} units at $${s.currentPrice}/unit (total: $${s.quantity * s.currentPrice})`).join('\n')}

TASK: Provide a comprehensive revision analysis considering:
1. How client feedback affects pricing strategy
2. Market changes since the original quote
3. Competitive positioning adjustments
4. Service-specific recommendations with revision impact
5. Negotiation strategies based on revision context
6. Overall revision strategy

IMPORTANT: 
- The "recommendedPrice" should be the PER UNIT price, not the total price
- Consider if the revision should be more competitive, maintain pricing, or increase pricing based on feedback
- Provide specific reasoning for each service recommendation
- Include revision impact analysis for each service

RESPONSE FORMAT (JSON only):
{
  "marketAnalysis": {
    "locationFactor": "string explaining location impact on revision",
    "marketConditions": "string about current market vs original quote",
    "competitivePosition": "string about competitive adjustments",
    "revisionContext": "string about how feedback affects pricing"
  },
  "serviceRecommendations": [
    {
      "serviceName": "string",
      "currentPrice": number,
      "recommendedPrice": number,
      "confidenceLevel": "high|medium|low",
      "reasoning": "string explaining the revision recommendation",
      "priceRange": {
        "min": number,
        "max": number
      },
      "revisionImpact": "string about how this service revision addresses feedback"
    }
  ],
  "negotiationTips": [
    "string with revision-specific negotiation strategy"
  ],
  "revisionStrategy": "string summarizing the overall revision approach"
}`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid AI response format')
    }

    const aiResponse = JSON.parse(jsonMatch[0]) as QuoteRevisionAnalysis

    // Validate and process the response
    const validatedResponse: QuoteRevisionAnalysis = {
      ...aiResponse,
      serviceRecommendations: aiResponse.serviceRecommendations.map(
        (service) => {
          // Find the corresponding service data to get quantity
          const serviceData = data.revisionContext.currentServices.find(
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
              recommendedPrice = recommendedTotal / serviceData.quantity
              priceRange = {
                min: priceRange.min / serviceData.quantity,
                max: priceRange.max / serviceData.quantity,
              }
            }
          }

          return {
            ...service,
            recommendedPrice: Math.round(recommendedPrice * 100) / 100, // Round to 2 decimal places
            priceRange: {
              min: Math.round(priceRange.min * 100) / 100,
              max: Math.round(priceRange.max * 100) / 100,
            },
            confidenceLevel: validateConfidenceLevel(service.confidenceLevel),
          }
        },
      ),
    }

    return validatedResponse
  } catch (error) {
    console.error('Error generating quote revision analysis:', error)
    throw new Error('Failed to generate quote revision analysis')
  }
}
