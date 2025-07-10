'use client'

import { IconCrown } from '@tabler/icons-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'

import { useAuth } from '@/hooks/use-auth'

import { CustomToast } from './custom-toast'

interface UpgradeButtonProps {
  className?: string
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const { user } = useAuth()

  const handleUpgrade = () => {
    if (!user) {
      toast.custom(
        <CustomToast
          type="error"
          message="Please log in to upgrade your subscription"
        />,
      )
      return
    }

    // Redirect to upgrade page where user can enter billing information
    window.location.href = '/upgrade'
  }

  return (
    <Button onClick={handleUpgrade} className={className}>
      <IconCrown className="mr-2 h-4 w-4" />
      Upgrade to Pro
    </Button>
  )
}
