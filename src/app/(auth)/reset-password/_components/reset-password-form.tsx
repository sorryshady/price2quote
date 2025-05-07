'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import FormCard from '@/components/form-card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import PasswordInput from '@/components/ui/password-input'

import { env } from '@/env/client'
import { ResetPasswordSchema, resetPasswordSchema } from '@/lib/schemas'

interface ResetPasswordFormProps {
  user: {
    email: string
    id: string
    name: string
  }
}
const ResetPasswordForm = ({ user }: ResetPasswordFormProps) => {
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  const submitHandler = async (data: ResetPasswordSchema) => {
    try {
      const { password } = data
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ password }),
        },
      )
    } catch (error) {
      console.error(error)
      toast.error('An error occurred during reset')
    }
  }
  return (
    <FormCard heading="Reset Password" subheading="Enter your new password">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>

                <FormControl>
                  <PasswordInput
                    placeholder="Enter your new password"
                    {...field}
                  />
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
                    placeholder="Confirm your new password"
                    {...field}
                  />
                </FormControl>
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
                Resetting password...
              </>
            ) : (
              <>Reset Password</>
            )}
          </Button>
        </form>
      </Form>
    </FormCard>
  )
}

export default ResetPasswordForm
