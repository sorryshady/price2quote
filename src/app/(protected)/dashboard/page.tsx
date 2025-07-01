'use client'

import Image from 'next/image'

import { useCompanies } from '@/hooks/use-companies'

export default function DashboardPage() {
  const { companies, isLoading } = useCompanies()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
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
