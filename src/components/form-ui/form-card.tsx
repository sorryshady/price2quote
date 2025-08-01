'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { IconBrandGoogle } from '@tabler/icons-react'
import toast from 'react-hot-toast'

import { env } from '@/env/client'

import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { CustomToast } from '../ui/custom-toast'
import { Separator } from '../ui/separator'

interface FormCardProps {
  heading: string
  subheading: string
  children: React.ReactNode
  backPrefix?: string
  backLabel?: string
  backHref?: string
  socials?: boolean
  type?: 'login' | 'register' | 'forgot-password' | 'reset-password'
}

const FormCard = ({
  heading,
  subheading,
  children,
  backPrefix,
  backLabel,
  backHref,
  socials = false,
  type,
}: FormCardProps) => {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // Show error toast if there's an error parameter
  useEffect(() => {
    if (error) {
      toast.custom(<CustomToast message={error} type="error" />)
      // Remove error from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl)
    }
  }, [error])

  const oauthLogin = async (provider: 'google' | 'github') => {
    try {
      window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`
    } catch (error) {
      console.error(error)
      toast.custom(
        <CustomToast
          message={`Error logging in with ${provider}. Please try again.`}
          type="error"
        />,
      )
    }
  }
  return (
    <Card className="bg-background mx-auto w-full max-w-lg gap-0 border border-zinc-200 shadow-lg dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl font-bold">
          {heading}
        </CardTitle>
        <CardDescription className="text-center text-zinc-500">
          {subheading}
        </CardDescription>
        {type && (
          <p className="mt-2 text-center text-lg font-bold text-zinc-700 capitalize">
            {type.replace('-', ' ')}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-4">
        {children}
        <Separator className="border-zinc-200 dark:border-zinc-800" />
        {socials && (
          <>
            <h3 className="text-muted-foreground text-center text-sm">
              Or continue with
            </h3>
            <div className="flex h-7 w-full items-center space-x-4">
              <Button
                className="flex-1 flex-row items-center gap-2"
                variant="outline"
                onClick={() => oauthLogin('google')}
              >
                <IconBrandGoogle />
                <span className="font-semibold">Google</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between px-6 py-4">
        <div className="flex w-full items-center justify-end">
          {backPrefix && (
            <span className="text-sm text-zinc-500">{backPrefix}</span>
          )}
          {backLabel && backHref && (
            <Link
              href={backHref}
              className="text-primary focus:ring-primary rounded px-1 text-sm font-medium hover:underline focus:ring-2 focus:outline-none"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default FormCard
