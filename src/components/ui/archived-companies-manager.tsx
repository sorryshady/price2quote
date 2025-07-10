'use client'

import { useState } from 'react'

import { Archive, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'

import {
  getArchivedCompaniesAction,
  reactivateCompanyAction,
} from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import type { CompanyWithServices } from '@/types'

interface ArchivedCompaniesManagerProps {
  onCompanyReactivated?: () => void
}

export function ArchivedCompaniesManager({
  onCompanyReactivated,
}: ArchivedCompaniesManagerProps) {
  const { user } = useAuth()
  const [archivedCompanies, setArchivedCompanies] = useState<
    CompanyWithServices[]
  >([])
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  const loadArchivedCompanies = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const result = await getArchivedCompaniesAction(user.id)
      if (result.success && result.companies) {
        setArchivedCompanies(result.companies)
        setIsVisible(true)
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to load archived companies'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error loading archived companies:', error)
      toast.custom(
        <CustomToast
          message="Failed to load archived companies"
          type="error"
        />,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReactivate = async (companyId: string) => {
    if (!user?.id) return

    setReactivatingId(companyId)
    try {
      const result = await reactivateCompanyAction(user.id, companyId)
      if (result.success) {
        toast.custom(
          <CustomToast
            message="Company reactivated successfully"
            type="success"
          />,
        )
        // Remove from archived list
        setArchivedCompanies((prev) => prev.filter((c) => c.id !== companyId))
        onCompanyReactivated?.()
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to reactivate company'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error reactivating company:', error)
      toast.custom(
        <CustomToast message="Failed to reactivate company" type="error" />,
      )
    } finally {
      setReactivatingId(null)
    }
  }

  // Only show for free tier users
  if (user?.subscriptionTier !== 'free') {
    return null
  }

  if (!isVisible) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Companies
          </CardTitle>
          <CardDescription>
            View and manage companies that were archived when you downgraded to
            the free plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={loadArchivedCompanies}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'View Archived Companies'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Archived Companies ({archivedCompanies.length})
        </CardTitle>
        <CardDescription>
          These companies were archived when you downgraded to the free plan.
          Upgrade to Pro to access all companies, or reactivate one to replace
          your current company.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {archivedCompanies.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            No archived companies found
          </p>
        ) : (
          <div className="space-y-3">
            {archivedCompanies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{company.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {company.businessType}
                    </Badge>
                  </div>
                  {company.description && (
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {company.description}
                    </p>
                  )}
                  <div className="text-muted-foreground text-xs">
                    {company.services.length} service
                    {company.services.length !== 1 ? 's' : ''} • Archived{' '}
                    {company.archivedAt
                      ? new Date(company.archivedAt).toLocaleDateString()
                      : 'recently'}
                  </div>
                </div>
                <Button
                  onClick={() => handleReactivate(company.id)}
                  disabled={reactivatingId === company.id}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="ml-1 sm:ml-2">
                    {reactivatingId === company.id
                      ? 'Reactivating...'
                      : 'Reactivate'}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2">
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            className="w-full"
          >
            Hide Archived Companies
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
