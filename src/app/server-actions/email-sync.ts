'use server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { emailSyncStatus, emailThreads } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { EmailSyncService } from '@/lib/email-sync'
import type { SyncConfig } from '@/types'

export async function getEmailSyncStatusAction(companyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const status = await db.query.emailSyncStatus.findFirst({
      where: (emailSyncStatus, { and, eq }) =>
        and(
          eq(emailSyncStatus.companyId, companyId),
          eq(emailSyncStatus.userId, session.user.id),
        ),
    })

    return { success: true, status }
  } catch (error) {
    console.error('Error fetching email sync status:', error)
    return { success: false, error: 'Failed to fetch sync status' }
  }
}

export async function enableEmailSyncAction(companyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await db
      .insert(emailSyncStatus)
      .values({
        companyId,
        userId: session.user.id,
        syncEnabled: true,
        syncFrequencyMinutes: 15,
      })
      .onConflictDoUpdate({
        target: [emailSyncStatus.companyId, emailSyncStatus.userId],
        set: { syncEnabled: true },
      })

    return { success: true }
  } catch (error) {
    console.error('Error enabling email sync:', error)
    return { success: false, error: 'Failed to enable email sync' }
  }
}

export async function disableEmailSyncAction(companyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await db
      .update(emailSyncStatus)
      .set({ syncEnabled: false })
      .where(
        and(
          eq(emailSyncStatus.companyId, companyId),
          eq(emailSyncStatus.userId, session.user.id),
        ),
      )

    return { success: true }
  } catch (error) {
    console.error('Error disabling email sync:', error)
    return { success: false, error: 'Failed to disable email sync' }
  }
}

export async function updateSyncConfigAction(
  companyId: string,
  config: SyncConfig,
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await db
      .insert(emailSyncStatus)
      .values({
        companyId,
        userId: session.user.id,
        syncEnabled: config.enabled,
        syncFrequencyMinutes: config.frequencyMinutes,
      })
      .onConflictDoUpdate({
        target: [emailSyncStatus.companyId, emailSyncStatus.userId],
        set: {
          syncEnabled: config.enabled,
          syncFrequencyMinutes: config.frequencyMinutes,
        },
      })

    return { success: true }
  } catch (error) {
    console.error('Error updating sync config:', error)
    return { success: false, error: 'Failed to update sync config' }
  }
}

export async function markEmailAsReadAction(messageId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await db
      .update(emailThreads)
      .set({ isRead: true })
      .where(
        and(
          eq(emailThreads.gmailMessageId, messageId),
          eq(emailThreads.userId, session.user.id),
        ),
      )

    return { success: true }
  } catch (error) {
    console.error('Error marking email as read:', error)
    return { success: false, error: 'Failed to mark email as read' }
  }
}

export async function syncIncomingEmailsAction(companyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const syncService = new EmailSyncService()
    await syncService.syncCompanyEmails(companyId, session.user.id)

    return { success: true, message: 'Email sync completed' }
  } catch (error) {
    console.error('Error syncing incoming emails:', error)
    return { success: false, error: 'Failed to sync incoming emails' }
  }
}
