'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { render } from '@react-email/render'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import FormCard from '@/components/form-ui/form-card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { generateToken } from '@/app/server-actions/action'
import ForgotPassword from '@/email-templates/forgot-password'
import { env } from '@/env/client'
import { ForgotPasswordSchema, forgotPasswordSchema } from '@/lib/schemas'

const ForgotPasswordForm = () => {
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const submitHandler = async (data: ForgotPasswordSchema) => {
    try {
      const userResponse = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      const body = await userResponse.json()
      if (!userResponse.ok) {
        toast.error(body.error)
        return
      }

      const { user } = body
      const { email, id, name, ip, location } = user
      const token = await generateToken(email, id, 'password-reset')
      const html = await render(
        <ForgotPassword
          userName={name}
          passwordResetUrl={`${env.NEXT_PUBLIC_API_URL}/reset-password?token=${token}`}
          requestIp={ip}
          requestLocation={location}
        />,
      )
      const emailResponse = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/send-email`,
        {
          method: 'POST',
          body: JSON.stringify({
            html,
            userEmail: email,
            purpose: 'password-reset',
          }),
        },
      )
      if (!emailResponse.ok) {
        console.error('Error: ', emailResponse)
        toast.error('Error sending password reset email. Please try again.')
        return
      }
      toast.success('Password reset email sent. Check your inbox.')
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error('An error occurred during forgot password')
    }
  }

  return (
    <FormCard
      heading="Forgot Password"
      subheading="Forgot your password? Enter your email to reset it."
      backPrefix="Don't have an account?"
      backLabel="Register"
      backHref="/register"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>

                <FormControl>
                  <Input placeholder="johndoe@gmail.com" {...field} />
                </FormControl>
                <FormDescription>
                  Enter your email to reset your password
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Sending reset link...
              </>
            ) : (
              <>Send reset link</>
            )}
          </Button>
        </form>
      </Form>
    </FormCard>
  )
}

export default ForgotPasswordForm
