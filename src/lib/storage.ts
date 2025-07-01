import { storage } from '@/lib/supabase'

/**
 * Uploads a company logo to Supabase storage and returns the public URL.
 * @param companyId - The company ID to namespace the file
 * @param file - The image file to upload
 * @returns The public URL of the uploaded logo, or null if failed
 */
export async function uploadCompanyLogo(companyId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const filePath = `${companyId}/logo.${fileExt}`

  try {
    await storage.upload('company-logos', filePath, file)
    const { data } = storage.getPublicUrl('company-logos', filePath)
    return data.publicUrl || null
  } catch (error) {
    console.error('Logo upload failed:', error)
    return null
  }
} 