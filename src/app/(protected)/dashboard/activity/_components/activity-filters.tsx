'use client'

import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FilterType =
  | 'all'
  | 'quote_created'
  | 'quote_status_changed'
  | 'email_sent'
  | 'email_received'
  | 'system_event'
type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'

interface ActivityFiltersProps {
  filters: {
    type: FilterType
    dateRange: DateRangeType
    limit: number
    offset: number
  }
  onFiltersChange: (filters: {
    type: FilterType
    dateRange: DateRangeType
    limit: number
    offset: number
  }) => void
}

export function ActivityFilters({
  filters,
  onFiltersChange,
}: ActivityFiltersProps) {
  const handleTypeChange = (type: FilterType) => {
    onFiltersChange({ ...filters, type, offset: 0 })
  }

  const handleDateRangeChange = (dateRange: DateRangeType) => {
    onFiltersChange({ ...filters, dateRange, offset: 0 })
  }

  const handleReset = () => {
    onFiltersChange({
      type: 'all',
      dateRange: 'all',
      limit: 50,
      offset: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Activity Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Type</label>
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="quote_created">Quotes Created</SelectItem>
                <SelectItem value="quote_status_changed">
                  Status Changes
                </SelectItem>
                <SelectItem value="email_sent">Emails Sent</SelectItem>
                <SelectItem value="email_received">Emails Received</SelectItem>
                <SelectItem value="system_event">System Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select
              value={filters.dateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
