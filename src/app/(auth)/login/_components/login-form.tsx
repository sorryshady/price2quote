'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { render } from '@react-email/render'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import FormCard from '@/components/form-card'
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

import { VerifyEmail } from '@/email-templates/verify-email'
import { env } from '@/env/client'
import { LoginSchema, loginSchema } from '@/lib/schemas'

import { generateEmailVerificationToken } from '../../register/action'

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
      toast.success('Login successful')
      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const resendVerificationEmail = async () => {
    if (!userInfo) return
    const token = await generateEmailVerificationToken(
      userInfo.email,
      userInfo.id,
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

  return (
    <>
      <FormCard
        heading="Login"
        subheading="Login to your account"
        backPrefix="Don't have an account?"
        backLabel="Register"
        backHref="/register"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitHandler)}
            className="space-y-6"
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
            <Button
              type="submit"
              className="mt-6 w-full"
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
