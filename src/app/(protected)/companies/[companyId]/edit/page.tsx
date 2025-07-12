'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/loading-states'

import { useCompaniesQuery } from '@/hooks/use-companies-query'
import type { CompanyWithServices } from '@/types'

import { EditCompanyForm } from './_components/edit-company-form'

export default function EditCompanyPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const { companies, isLoading } = useCompaniesQuery()
  const [company, setCompany] = useState<CompanyWithServices | null>(null)

  useEffect(() => {
    if (companies && companyId) {
      const foundCompany = companies.find((c) => c.id === companyId)
      setCompany(foundCompany || null)
    }
  }, [companies, companyId])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/companies')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">Company not found</h2>
            <p className="text-muted-foreground">
              The company you&apos;re trying to edit doesn&apos;t exist or has
              been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/companies/${companyId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Company
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
            <h1 className="text-2xl font-bold">Edit {company.name}</h1>
            <p className="text-muted-foreground">
              Update your company information and services
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <EditCompanyForm company={company} />
    </div>
  )
}
