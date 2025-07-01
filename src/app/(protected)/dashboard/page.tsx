'use client'

import { redirect } from 'next/navigation'

import { useCompanies } from '@/hooks/use-companies'

export default function DashboardPage() {
  const { hasCompanies } = useCompanies()
  if (!hasCompanies) {
    redirect('/add-company')
  }
  return <div>DashboardPage</div>
}
