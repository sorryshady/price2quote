'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { render } from '@react-email/render'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import FormCard from '@/components/form-ui/form-card'
import { Button } from '@/components/ui/button'
import { CustomToast } from '@/components/ui/custom-toast'
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

import { generateToken } from '@/app/server-actions'
import VerifyEmail from '@/email-templates/verify-email'
import { env } from '@/env/client'
import { type RegisterSchema, registerSchema } from '@/lib/schemas'

export function RegisterForm() {
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  })
  const submitHandler = async (data: RegisterSchema) => {
    const { name, email, password } = data
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        },
      )
      const body = await response.json()
      if (!response.ok) {
        console.error('Error: ', body)
        toast.custom(<CustomToast message={body.error} type="error" />)
        return
      }
      const { name: userName, email: userEmail, ip, location, id } = body.user
      toast.custom(
        <CustomToast
          message="User registered successfully. Sending verification email."
          type="success"
        />,
      )
      form.reset()
      const token = await generateToken(userEmail, id, 'email-verification')
      const html = await render(
        <VerifyEmail
          userName={userName}
          requestIp={ip}
          requestLocation={location}
          verificationUrl={`${env.NEXT_PUBLIC_API_URL}/verify-email?token=${token}`}
        />,
      )
      const emailResponse = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/send-email`,
        {
          method: 'POST',
          body: JSON.stringify({
            html,
            userEmail,
            purpose: 'email-verification',
          }),
        },
      )
      if (!emailResponse.ok) {
        console.error('Error: ', emailResponse)
        toast.custom(
          <CustomToast
            message="Error sending email verification. Please try again."
            type="error"
          />,
        )
        return
      }
      toast.custom(
        <CustomToast
          message="Email verification sent. Check your inbox."
          type="success"
        />,
      )
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <FormCard
      heading="Pricing GPT"
      subheading="AI-Powered Pricing for Your Business"
      backPrefix="Already have an account?"
      backLabel="Login"
      backHref="/login"
      socials={true}
      type="register"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
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
                  <PasswordInput {...field} placeholder="Enter password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    placeholder="Confirm your password"
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
            {form.formState.isSubmitting ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </Form>
    </FormCard>
  )
}
