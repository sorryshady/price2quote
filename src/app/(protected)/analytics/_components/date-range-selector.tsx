'use client'

import { useState } from 'react'

import { Calendar, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { getDateRangePresets } from '@/hooks/use-analytics'

interface DateRange {
  start: Date
  end: Date
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presetLabels = {
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  last3Months: 'Last 3 Months',
  last6Months: 'Last 6 Months',
  last12Months: 'Last 12 Months',
  thisYear: 'This Year',
  lastYear: 'Last Year',
} as const

function formatDateRange(range: DateRange): string {
  const start = range.start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const end = range.end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${start} - ${end}`
}

function isPresetRange(
  range: DateRange,
  presets: ReturnType<typeof getDateRangePresets>,
): string | null {
  for (const [key, preset] of Object.entries(presets)) {
    const startMatch =
      Math.abs(range.start.getTime() - preset.start.getTime()) <
      24 * 60 * 60 * 1000
    const endMatch =
      Math.abs(range.end.getTime() - preset.end.getTime()) < 24 * 60 * 60 * 1000
    if (startMatch && endMatch) {
      return key
    }
  }
  return null
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const presets = getDateRangePresets()
  const currentPreset = isPresetRange(value, presets)
  const [isOpen, setIsOpen] = useState(false)

  const handlePresetSelect = (presetKey: keyof typeof presets) => {
    onChange(presets[presetKey])
    setIsOpen(false)
  }

  const displayText = currentPreset
    ? presetLabels[currentPreset as keyof typeof presetLabels]
    : formatDateRange(value)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[240px] justify-between text-left font-normal"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{displayText}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {Object.entries(presetLabels).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handlePresetSelect(key as keyof typeof presets)}
            className={`cursor-pointer ${
              currentPreset === key ? 'bg-muted font-medium' : ''
            }`}
          >
            {label}
          </DropdownMenuItem>
        ))}
        {/* TODO: Add custom date range picker */}
        {!currentPreset && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Custom Range Selected
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
