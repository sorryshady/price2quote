'use server'

import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import db from '@/db'
import { users } from '@/db/schema'
import { accounts } from '@/db/schema'
import { env } from '@/env/server'
import { getSession } from '@/lib/auth'

export async function generateToken(
  email: string,
  userId: string,
  type: 'email-verification' | 'password-reset',
) {
  const secret = env.AUTH_SECRET
  if (!secret)
    throw new Error('AUTH_SECRET is not set in environment variables')
  return jwt.sign(
    {
      sub: userId ?? '',
      email: email,
      type,
    },
    secret,
    { expiresIn: '15m' },
  )
}

export type VerifyEmailTokenResult =
  | { success: true; message: string }
  | {
      success: false
      error: string
    }

export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailTokenResult> {
  const secret = env.AUTH_SECRET
  if (!secret)
    return {
      success: false,
      error: 'Server misconfiguration',
    }
  try {
    const decoded = jwt.verify(token, secret)
    if (!decoded || typeof decoded !== 'object') {
      return { success: false, error: 'Invalid token' }
    }
    const { email, type } = decoded as jwt.JwtPayload & {
      email?: string
      type?: string
    }
    if (type !== 'email-verification') {
      return {
        success: false,
        error: 'Invalid token type',
      }
    }
    if (!email) {
      return {
        success: false,
        error: 'Token does not contain email',
      }
    }
    const usersResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
    const user = usersResult[0]
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email already verified',
      }
    }
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))
    return { success: true, message: 'Email verified successfully' }
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err &&
      'name' in err &&
      (err as { name?: string }).name === 'TokenExpiredError'
    ) {
      return {
        success: false,
        error: 'Verification link has expired. Please request a new one.',
      }
    }
    return {
      success: false,
      error: 'Invalid or malformed token',
    }
  }
}

export type ForgotPasswordTokenResult =
  | { success: true; user: { email: string; id: string; name: string } }
  | {
      success: false
      error: string
    }

export async function verifyForgotPasswordToken(
  token: string,
): Promise<ForgotPasswordTokenResult> {
  const secret = env.AUTH_SECRET
  if (!secret)
    return {
      success: false,
      error: 'Server misconfiguration',
    }
  try {
    const decoded = jwt.verify(token, secret)
    if (!decoded || typeof decoded !== 'object') {
      return { success: false, error: 'Invalid token' }
    }
    const { email, type } = decoded as jwt.JwtPayload & {
      email?: string
      type?: string
    }
    if (type !== 'password-reset') {
      return {
        success: false,
        error: 'Invalid token type',
      }
    }
    if (!email) {
      return {
        success: false,
        error: 'Token does not contain email',
      }
    }
    const usersResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
    const user = usersResult[0]
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return {
      success: true,
      user: { email: user.email, id: user.id, name: user.name ?? '' },
    }
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err &&
      'name' in err &&
      (err as { name?: string }).name === 'TokenExpiredError'
    ) {
      return {
        success: false,
        error: 'Password reset link has expired. Please request a new one.',
      }
    }
    return {
      success: false,
      error: 'Invalid or malformed token',
    }
  }
}

export async function updateUserProfileAction(data: { name?: string }) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        return {
          success: false,
          error: 'Name is required and must be a valid string',
        }
      }
      if (data.name.trim().length > 255) {
        return {
          success: false,
          error: 'Name must be less than 255 characters',
        }
      }
    }

    // Prepare update data
    const updateData: Partial<typeof users.$inferInsert> = {}
    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    // Update user in database
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning()

    if (!updatedUser) {
      return { success: false, error: 'Failed to update user profile' }
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
        subscriptionTier: updatedUser.subscriptionTier,
      },
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update user profile' }
  }
}

export async function getUserProfileAction() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        subscriptionTier: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get user data with all columns needed
    const userWithDates = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        subscriptionTier: true,
        passwordHash: true,
      },
    })

    if (!userWithDates) {
      return { success: false, error: 'User not found' }
    }

    // Get connected OAuth providers
    const connectedAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, session.user.id),
      columns: {
        provider: true,
        type: true,
      },
    })

    return {
      success: true,
      user: {
        id: userWithDates.id,
        name: userWithDates.name,
        email: userWithDates.email,
        image: userWithDates.image,
        emailVerified: userWithDates.emailVerified,
        subscriptionTier: userWithDates.subscriptionTier,
      },
      hasPassword: !!userWithDates.passwordHash,
      connectedAccounts: connectedAccounts.map((account) => ({
        provider: account.provider,
        type: account.type,
      })),
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { success: false, error: 'Failed to get user profile' }
  }
}

export async function changePasswordAction(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get user with password hash
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user has a password (OAuth users might not)
    if (!user.passwordHash) {
      return {
        success: false,
        error: 'Password change not available for OAuth accounts',
      }
    }

    // Verify current password
    const bcrypt = await import('bcryptjs')
    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    )

    if (!isValidPassword) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Validate new password
    if (data.newPassword.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters long',
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 12)

    // Update password in database
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, session.user.id))

    return { success: true, message: 'Password updated successfully' }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Failed to change password' }
  }
}
