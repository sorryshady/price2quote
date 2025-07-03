'use client'

import Image from 'next/image'

import { DashboardSkeleton } from '@/components/ui/loading-states'

import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import { useCompanyLimit, useQuoteLimit } from '@/hooks/use-subscription-limits'

export default function DashboardPage() {
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const { companies, isLoading: companiesLoading } = useCompaniesQuery()
  const { currentQuotes, isLoading: quoteLimitLoading } = useQuoteLimit()
  const { currentCompanies, isLoading: companyLimitLoading } = useCompanyLimit()

  // Wait for auth to be initialized and all data to load
  if (
    !isInitialized ||
    authLoading ||
    companiesLoading ||
    quoteLimitLoading ||
    companyLimitLoading
  ) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Usage Summary for Free Users */}
      {user?.subscriptionTier === 'free' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Quote Usage</h3>
                <p className="text-muted-foreground text-sm">
                  {currentQuotes || 0} of 3 used this month
                </p>
              </div>
              <div
                className={`h-2 w-16 rounded-full ${
                  (currentQuotes || 0) >= 2 ? 'bg-yellow-500' : 'bg-muted'
                }`}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Companies</h3>
                <p className="text-muted-foreground text-sm">
                  {currentCompanies || 0} of 1 company
                </p>
              </div>
              <div
                className={`h-2 w-16 rounded-full ${
                  (currentCompanies || 0) >= 1 ? 'bg-yellow-500' : 'bg-muted'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-semibold">Your Companies</h2>
        {companies && companies.length > 0 ? (
          <div className="space-y-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center gap-3 rounded border p-3"
              >
                {company.logoUrl && (
                  <Image
                    src={company.logoUrl}
                    alt={company.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div>
                  <h3 className="font-medium">{company.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {company.businessType} • {company.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No companies found.</p>
        )}
      </div>
    </div>
  )
}
