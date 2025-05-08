'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { render } from '@react-email/render'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import FormCard from '@/components/form-ui/form-card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/ui/password-input'

import { generateToken } from '@/app/server-actions/action'
import { VerifyEmail } from '@/email-templates/verify-email'
import { env } from '@/env/client'
import { useAuthState } from '@/hooks/use-auth'
import { LoginSchema, loginSchema } from '@/lib/schemas'

interface UserInfo {
  email: string
  id: string
  name: string
  ip: string
  location: string
}

const LoginForm = () => {
  const [showNotVerified, setShowNotVerified] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'
  const error = searchParams.get('error')
  const { setUser } = useAuthState()

  // Show error toast if there's an error parameter
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 3000,
      })
      // Remove error from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      window.history.replaceState({}, '', newUrl)
    }
  }, [error])

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const submitHandler = async (data: LoginSchema) => {
    const { email, password } = data
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      )
      const body = await response.json()
      if (!response.ok && body.user) {
        setShowNotVerified(true)
        setUserInfo(body.user as UserInfo)
        return
      } else if (!response.ok) {
        toast.error(body.error)
        return
      }

      // Update auth state with user data
      setUser(body.user)
      toast.success('Login successful')

      // Get redirect URL from query params or default to home
      router.push(redirectUrl)
    } catch (error) {
      console.error(error)
      toast.error('An error occurred during login')
    }
  }

  const resendVerificationEmail = async () => {
    if (!userInfo) return
    const token = await generateToken(
      userInfo.email,
      userInfo.id,
      'email-verification',
    )
    const html = await render(
      <VerifyEmail
        userName={userInfo.name}
        requestIp={userInfo.ip}
        requestLocation={userInfo.location}
        verificationUrl={`${env.NEXT_PUBLIC_API_URL}/verify-email?token=${token}`}
      />,
    )
    setIsResending(true)
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/send-email`,
        {
          method: 'POST',
          body: JSON.stringify({
            html,
            userEmail: userInfo.email,
            purpose: 'email-verification',
          }),
        },
      )
      if (!response.ok) {
        console.error('Error: ', response)
        toast.error('Error sending email verification. Please try again.')
        return
      }
      toast.success('Email verification sent. Check your inbox.')
    } catch (error) {
      console.error(error)
    } finally {
      setIsResending(false)
      setShowNotVerified(false)
    }
  }

  // const oauthLogin = async (provider: 'google' | 'github') => {
  //   try {
  //     window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`
  //   } catch (error) {
  //     console.error(error)
  //     toast.error(`Error logging in with ${provider}. Please try again.`)
  //   }
  // }

  return (
    <>
      <FormCard
        heading="Login"
        subheading="Login to your account"
        backPrefix="Don't have an account?"
        backLabel="Register"
        backHref="/register"
        socials={true}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitHandler)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-primary block text-end text-sm"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Logging in...
                </>
              ) : (
                <>Login</>
              )}
            </Button>
          </form>
          {/* <Separator />
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
            <Separator orientation="vertical" />
            <Button
              className="flex-1 flex-row items-center gap-2"
              variant="outline"
              onClick={() => oauthLogin('github')}
            >
              <IconBrandGithub />
              <span className="font-semibold">Github</span>
            </Button>
          </div> */}
        </Form>
      </FormCard>
      {showNotVerified && (
        <AlertDialog open={showNotVerified} onOpenChange={setShowNotVerified}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Email not verified</AlertDialogTitle>
              <AlertDialogDescription>
                Your email has not yet been verified. Please check your email
                for a verification link. The link expires in 15 minutes. You may
                resend the verification email by clicking the button below.
              </AlertDialogDescription>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="cursor-pointer">
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="default"
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                >
                  {isResending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Resend'
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
export default LoginForm
