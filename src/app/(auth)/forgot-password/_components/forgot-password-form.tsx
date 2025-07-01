'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { render } from '@react-email/render'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

import FormCard from '@/components/form-ui/form-card'
import { Button } from '@/components/ui/button'
import { CustomToast } from '@/components/ui/custom-toast'
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

import { generateToken } from '@/app/server-actions'
import ForgotPassword from '@/email-templates/forgot-password'
import { env } from '@/env/client'
import { type ForgotPasswordSchema, forgotPasswordSchema } from '@/lib/schemas'

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
        toast.custom(<CustomToast message={body.error} type="error" />)
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
        toast.custom(
          <CustomToast
            message="Error sending password reset email. Please try again."
            type="error"
          />,
        )
        return
      }
      toast.custom(
        <CustomToast
          message="Password reset email sent. Check your inbox."
          type="success"
        />,
      )
      form.reset()
    } catch (error) {
      console.error(error)
      toast.custom(
        <CustomToast
          message="An error occurred during forgot password"
          type="error"
        />,
      )
    }
  }

  return (
    <FormCard
      heading="Pricing GPT"
      subheading="AI-Powered Pricing for Your Business"
      backPrefix="Don't have an account?"
      backLabel="Register"
      backHref="/register"
      type="forgot-password"
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
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>
    </FormCard>
  )
}

export default ForgotPasswordForm
