'use server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { companies, services } from '@/db/schema'
import { generateCompanySummary } from '@/lib/gemini'
import { uploadCompanyLogo } from '@/lib/storage'
import type { CompanyWithServices } from '@/types'

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

export async function getUserCompaniesAction(userId: string): Promise<{
  success: boolean
  companies?: CompanyWithServices[]
  error?: string
}> {
  try {
    const userCompanies = await db.query.companies.findMany({
      where: eq(companies.userId, userId),
    })

    // Get services for each company separately to avoid relationship issues
    const companiesWithServices = await Promise.all(
      userCompanies.map(async (company) => {
        const companyServices = await db.query.services.findMany({
          where: eq(services.companyId, company.id),
        })
        return {
          ...company,
          services: companyServices,
        }
      }),
    )

    return {
      success: true,
      companies: companiesWithServices as CompanyWithServices[],
    }
  } catch (error) {
    console.error('Error fetching user companies:', error)
    return { success: false, error: 'Failed to fetch companies' }
  }
}

export async function saveCompanyAction(data: {
  userId: string
  companyInfo: {
    name: string
    country: string
    businessType: 'freelancer' | 'company'
    currency: string
  }
  companyProfile: {
    description: string
    logo?: string // Base64 data
    address?: string
    phone?: string
    email?: string
    website?: string
  }
  services: Array<{
    name: string
    description?: string
    skillLevel: 'beginner' | 'intermediate' | 'advanced'
    basePrice?: string
  }>
}) {
  try {
    // 1. Save company to database with 'generating' status
    const [company] = await db
      .insert(companies)
      .values({
        userId: data.userId,
        name: data.companyInfo.name,
        country: data.companyInfo.country,
        businessType: data.companyInfo.businessType,
        description: data.companyProfile.description,
        address: data.companyProfile.address,
        phone: data.companyProfile.phone,
        email: data.companyProfile.email,
        website: data.companyProfile.website,
        aiSummaryStatus: 'generating',
      })
      .returning()

    // 2. Save services
    if (data.services.length > 0) {
      await db.insert(services).values(
        data.services.map((service) => ({
          companyId: company.id,
          name: service.name,
          description: service.description,
          skillLevel: service.skillLevel,
          basePrice: service.basePrice,
          currency: data.companyInfo.currency,
        })),
      )
    }

    // 3. Upload logo if provided
    if (data.companyProfile.logo) {
      // Convert base64 to file for upload
      const base64Data = data.companyProfile.logo.replace(
        /^data:image\/[a-z]+;base64,/,
        '',
      )
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const file = new File([byteArray], 'logo.png', { type: 'image/png' })

      const logoUrl = await uploadCompanyLogo(company.id, file)

      // Update company with logo URL
      if (logoUrl) {
        await db
          .update(companies)
          .set({ logoUrl })
          .where(eq(companies.id, company.id))
      }
    }

    // 4. Trigger background AI summary generation (fire and forget)
    generateAISummaryInBackground(company.id, {
      name: data.companyInfo.name,
      description: data.companyProfile.description,
      businessType: data.companyInfo.businessType,
      country: data.companyInfo.country,
      currency: data.companyInfo.currency,
      services: data.services,
    })

    return { success: true, companyId: company.id }
  } catch (error) {
    console.error('Error saving company:', error)
    return { success: false, error: 'Failed to save company' }
  }
}

// Background AI summary generation
async function generateAISummaryInBackground(
  companyId: string,
  companyData: {
    name: string
    description: string
    businessType: string
    country: string
    currency: string
    services: Array<{
      name: string
      description?: string
      skillLevel: 'beginner' | 'intermediate' | 'advanced'
      basePrice?: string
    }>
  },
) {
  try {
    const summary = await generateCompanySummary(companyData)

    // Update company with AI summary
    await db
      .update(companies)
      .set({
        aiSummary: summary,
        aiSummaryStatus: 'completed',
      })
      .where(eq(companies.id, companyId))

    console.log(`AI summary generated for company ${companyId}`)
  } catch (error) {
    console.error(
      `Error generating AI summary for company ${companyId}:`,
      error,
    )

    // Update company with failed status
    await db
      .update(companies)
      .set({ aiSummaryStatus: 'failed' })
      .where(eq(companies.id, companyId))
  }
}
