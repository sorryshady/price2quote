'use client'

import { IconCalendar, IconMail, IconShield } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AccountInfoProps {
  user: {
    email: string
    emailVerified: Date | null
    createdAt?: Date
  }
}

export function AccountInfo({ user }: AccountInfoProps) {
  const isEmailVerified = !!user.emailVerified

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconShield className="h-5 w-5" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Address */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <IconMail className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Email Address</span>
            </div>
            <p className="text-muted-foreground pl-6 text-sm">{user.email}</p>
          </div>
          <Badge variant={isEmailVerified ? 'default' : 'secondary'}>
            {isEmailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>

        {/* Email Verification Date */}
        {user.emailVerified && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <IconCalendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Email Verified</span>
            </div>
            <p className="text-muted-foreground pl-6 text-sm">
              {user.emailVerified.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Account Created Date */}
        {user.createdAt && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <IconCalendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Member Since</span>
            </div>
            <p className="text-muted-foreground pl-6 text-sm">
              {user.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Email Verification Warning */}
        {!isEmailVerified && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <IconMail className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Email not verified
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please check your email and click the verification link to
                    secure your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
