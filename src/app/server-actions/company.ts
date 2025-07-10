'use server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { companies, gmailConnections, services } from '@/db/schema'
import { getUser } from '@/lib/auth'
import { generateCompanySummary } from '@/lib/gemini'
import { uploadCompanyLogo } from '@/lib/storage'
import { canUserCreateCompany } from '@/lib/subscription'
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
      where: and(eq(companies.userId, userId), eq(companies.isArchived, false)),
    })

    // Get services and Gmail connections for each company
    const companiesWithServices = await Promise.all(
      userCompanies.map(async (company) => {
        const companyServices = await db.query.services.findMany({
          where: eq(services.companyId, company.id),
        })

        // Check Gmail connection status
        const gmailConnection = await db.query.gmailConnections.findFirst({
          where: eq(gmailConnections.companyId, company.id),
        })

        const now = new Date()
        const isGmailConnected =
          gmailConnection && gmailConnection.expiresAt > now

        return {
          ...company,
          services: companyServices,
          gmailConnected: isGmailConnected,
          gmailEmail: gmailConnection?.gmailEmail || null,
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

export async function getArchivedCompaniesAction(userId: string): Promise<{
  success: boolean
  companies?: CompanyWithServices[]
  error?: string
}> {
  try {
    const archivedCompanies = await db.query.companies.findMany({
      where: and(eq(companies.userId, userId), eq(companies.isArchived, true)),
    })

    // Get services for each archived company
    const companiesWithServices = await Promise.all(
      archivedCompanies.map(async (company) => {
        const companyServices = await db.query.services.findMany({
          where: eq(services.companyId, company.id),
        })

        return {
          ...company,
          services: companyServices,
          gmailConnected: false, // Archived companies don't have active Gmail connections
          gmailEmail: null,
        }
      }),
    )

    return {
      success: true,
      companies: companiesWithServices as CompanyWithServices[],
    }
  } catch (error) {
    console.error('Error fetching archived companies:', error)
    return { success: false, error: 'Failed to fetch archived companies' }
  }
}

export async function reactivateCompanyAction(
  userId: string,
  companyId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Get user to check actual subscription tier
    const user = await getUser()
    if (!user || user.id !== userId) {
      return {
        success: false,
        error: 'Unauthorized to reactivate company',
      }
    }

    // Check if user can reactivate (based on subscription limits)
    const canCreate = await canUserCreateCompany(userId, user.subscriptionTier)

    if (!canCreate) {
      return {
        success: false,
        error:
          'Cannot reactivate company. Upgrade to Pro to manage more companies.',
      }
    }

    // Verify the company belongs to the user and is archived
    const company = await db.query.companies.findFirst({
      where: and(
        eq(companies.id, companyId),
        eq(companies.userId, userId),
        eq(companies.isArchived, true),
      ),
    })

    if (!company) {
      return {
        success: false,
        error: 'Company not found or not archived',
      }
    }

    // Reactivate the company
    await db
      .update(companies)
      .set({
        isArchived: false,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))

    return { success: true }
  } catch (error) {
    console.error('Error reactivating company:', error)
    return { success: false, error: 'Failed to reactivate company' }
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
    // Get user to check actual subscription tier
    const user = await getUser()
    if (!user || user.id !== data.userId) {
      return {
        success: false,
        error: 'Unauthorized to create company',
      }
    }

    // Check subscription limit before creating company
    const canCreate = await canUserCreateCompany(
      data.userId,
      user.subscriptionTier,
    )
    if (!canCreate) {
      return {
        success: false,
        error: 'Company limit reached. Upgrade to Pro to add more companies.',
      }
    }
    // 1. Save company to database with 'generating' status
    const [company] = await db
      .insert(companies)
      .values({
        userId: data.userId,
        name: data.companyInfo.name,
        country: data.companyInfo.country,
        businessType: data.companyInfo.businessType,
        currency: data.companyInfo.currency,
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
      try {
        console.log('Processing company logo for company:', company.id)

        // Convert base64 to file for upload
        const originalBase64 = data.companyProfile.logo
        const base64Data = originalBase64.replace(
          /^data:image\/[a-z]+;base64,/,
          '',
        )

        console.log('Base64 data length:', base64Data.length)

        // Validate base64 data before processing
        if (!base64Data || base64Data.trim() === '') {
          console.warn('Empty base64 data provided for logo')
        } else {
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const file = new File([byteArray], 'logo.png', { type: 'image/png' })

          console.log('Created file for upload, size:', file.size, 'bytes')

          const logoUrl = await uploadCompanyLogo(company.id, file)
          console.log('Upload result:', logoUrl ? 'Success' : 'Failed', logoUrl)

          // Update company with logo URL
          if (logoUrl) {
            await db
              .update(companies)
              .set({ logoUrl })
              .where(eq(companies.id, company.id))
            console.log('Updated company with logo URL:', logoUrl)
          } else {
            console.warn('Logo upload failed, company created without logo')
          }
        }
      } catch (logoError) {
        console.error('Error processing company logo:', logoError)
        // Don't fail the entire company creation just because of logo issues
        // The company will be created without a logo
      }
    } else {
      console.log('No logo provided for company:', company.id)
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
