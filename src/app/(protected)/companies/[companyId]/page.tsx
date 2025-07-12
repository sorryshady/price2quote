'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { ArrowLeft, Edit3, MailCheck, Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/loading-states'
import { Separator } from '@/components/ui/separator'

import { useCompaniesQuery } from '@/hooks/use-companies-query'

export default function CompanyDetailsPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { companies, isLoading } = useCompaniesQuery()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const company = companies?.find((c) => c.id === companyId)

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/companies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Company not found</h2>
            <p className="text-muted-foreground">
              The company you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/companies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Link>
          </Button>
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
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {company.businessType} • {company.country}
                </span>
                {company.gmailConnected && company.gmailEmail && (
                  <Badge variant="outline" className="text-xs">
                    <MailCheck className="mr-1 h-3 w-3" />
                    {company.gmailEmail}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/companies/${company.id}/edit`}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Company
          </Link>
        </Button>
      </div>

      {/* Company Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Business Type
                </label>
                <p className="capitalize">{company.businessType}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Country
                </label>
                <p>{company.country}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Currency
                </label>
                <p className="font-medium">{company.currency}</p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Services
                </label>
                <p>{company.services?.length || 0} services</p>
              </div>
            </div>

            {company.description && (
              <>
                <Separator />
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Description
                  </label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {company.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.email && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Email
                </label>
                <p>{company.email}</p>
              </div>
            )}
            {company.phone && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Phone
                </label>
                <p>{company.phone}</p>
              </div>
            )}
            {company.website && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Website
                </label>
                <p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                </p>
              </div>
            )}
            {company.address && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Address
                </label>
                <p className="text-sm leading-relaxed">{company.address}</p>
              </div>
            )}

            {!company.email &&
              !company.phone &&
              !company.website &&
              !company.address && (
                <p className="text-muted-foreground text-sm italic">
                  No contact information provided
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          {company.services && company.services.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {company.services.map((service) => (
                <div
                  key={service.id}
                  className="space-y-2 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{service.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {service.skillLevel}
                    </Badge>
                  </div>
                  {service.description && (
                    <p className="text-muted-foreground text-sm">
                      {service.description}
                    </p>
                  )}
                  {service.basePrice && (
                    <p className="text-sm font-medium">
                      Base Price: {service.currency} {service.basePrice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No services added yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
