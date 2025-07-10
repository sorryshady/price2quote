import { storage } from '@/lib/supabase'

/**
 * Uploads a company logo to Supabase storage and returns the public URL.
 * @param companyId - The company ID to namespace the file
 * @param file - The image file to upload
 * @returns The public URL of the uploaded logo, or null if failed
 */
export async function uploadCompanyLogo(
  companyId: string,
  file: File,
): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const filePath = `${companyId}/logo.${fileExt}`

  console.log('Uploading logo:', {
    companyId,
    fileName: file.name,
    fileSize: file.size,
    filePath,
  })

  try {
    const uploadResult = await storage.upload('company-logos', filePath, file)
    console.log('Supabase upload result:', uploadResult)

    // Upload was successful, get the public URL
    const { data } = storage.getPublicUrl('company-logos', filePath)
    console.log('Generated public URL:', data.publicUrl)

    return data.publicUrl || null
  } catch (error) {
    console.error('Logo upload failed with exception:', error)
    return null
  }
}
