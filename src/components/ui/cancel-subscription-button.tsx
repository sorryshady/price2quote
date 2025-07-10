'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { toast } from 'react-hot-toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { CustomToast } from '@/components/ui/custom-toast'

import { useAuth } from '@/hooks/use-auth'

interface CancelSubscriptionButtonProps {
  subscriptionId: string
  className?: string
}

export function CancelSubscriptionButton({
  subscriptionId,
  className,
}: CancelSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { checkAuth } = useAuth()

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          reason: 'User requested cancellation',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast.custom(
        <CustomToast
          type="success"
          message={
            data.message ||
            "Subscription cancelled successfully. You'll retain Pro access until the end of your billing period."
          }
        />,
      )

      setIsOpen(false)

      // Refresh auth state to update any cached subscription info
      await checkAuth()

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error('Cancellation error:', error)
      toast.custom(
        <CustomToast
          type="error"
          message={
            error instanceof Error
              ? error.message
              : 'Failed to cancel subscription'
          }
        />,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={className}>
          Cancel Subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to cancel your Pro subscription? You will:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Keep Pro access until the end of your current billing period
              </li>
              <li>Then lose access to unlimited quotes</li>
              <li>Be limited to 1 company instead of 5</li>
              <li>Be limited to 2 revisions per quote</li>
              <li>Lose priority support access</li>
            </ul>
            <p className="text-muted-foreground pt-2 text-sm">
              Your subscription will remain active until the end of your current
              billing period. You can resubscribe at any time.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Keep Subscription
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Cancelling...' : 'Yes, Cancel Subscription'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
