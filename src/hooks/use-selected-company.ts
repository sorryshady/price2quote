import { useEffect, useState } from 'react'

import type { CompanyWithServices } from '@/types'

const SELECTED_COMPANY_KEY = 'price2quote_selected_company_id'

export function useSelectedCompany(
  companies: CompanyWithServices[] | undefined,
) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  )

  // Load persisted company selection on mount
  useEffect(() => {
    try {
      const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
      if (savedCompanyId && companies?.some((c) => c.id === savedCompanyId)) {
        setSelectedCompanyId(savedCompanyId)
      } else if (companies?.length && !selectedCompanyId) {
        // Auto-select first company if no valid saved selection
        setSelectedCompanyId(companies[0].id)
        localStorage.setItem(SELECTED_COMPANY_KEY, companies[0].id)
      }
    } catch {
      // localStorage might not be available (SSR)
      if (companies?.length && !selectedCompanyId) {
        setSelectedCompanyId(companies[0].id)
      }
    }
  }, [companies, selectedCompanyId])

  // Update localStorage when selection changes
  const updateSelectedCompanyId = (companyId: string | null) => {
    setSelectedCompanyId(companyId)
    try {
      if (companyId) {
        localStorage.setItem(SELECTED_COMPANY_KEY, companyId)
      } else {
        localStorage.removeItem(SELECTED_COMPANY_KEY)
      }
    } catch {
      // localStorage might not be available
    }
  }

  // Get the selected company object
  const selectedCompany = selectedCompanyId
    ? companies?.find((c) => c.id === selectedCompanyId)
    : companies?.[0]

  return {
    selectedCompanyId,
    selectedCompany,
    setSelectedCompanyId: updateSelectedCompanyId,
  }
}
