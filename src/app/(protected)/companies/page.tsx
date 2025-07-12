'use client'

import Image from 'next/image'
import Link from 'next/link'

import { MailCheck, Plus, Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/loading-states'

import { useCompaniesQuery } from '@/hooks/use-companies-query'

export default function CompaniesPage() {
  const { companies, isLoading } = useCompaniesQuery()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">My Companies</h1>
          <p className="text-muted-foreground">
            Manage your companies and their settings
          </p>
        </div>
        <Button asChild>
          <Link href="/add-company">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      {!companies || companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <Settings className="mx-auto mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">No companies yet</h3>
                <p>Create your first company to start generating quotes</p>
              </div>
              <Button asChild>
                <Link href="/add-company">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Company
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {company.logoUrl && (
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-12 w-12 rounded object-cover"
                        width={48}
                        height={48}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                          {company.businessType} • {company.country}
                        </span>
                        {company.gmailConnected && company.gmailEmail && (
                          <Badge variant="outline" className="text-xs">
                            <MailCheck className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {company.currency}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {company.services?.length || 0} services
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {company.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                    {company.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/companies/${company.id}`}>View Details</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/companies/${company.id}/edit`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
