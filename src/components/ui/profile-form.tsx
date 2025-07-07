'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

import { updateUserProfileAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: {
    name: string
    email: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, user } = useAuth()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true)

      const result = await updateUserProfileAction({
        name: data.name,
      })

      if (result.success) {
        // Update the auth state with new user data
        if (user && result.user) {
          setUser({
            ...user,
            name: result.user.name,
          })
        }

        // Reset form dirty state by setting the new value as default
        form.reset({
          name: result.user?.name || data.name,
        })

        toast.custom(
          <CustomToast message="Profile updated successfully" type="success" />,
        )
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to update profile'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.custom(
        <CustomToast message="An unexpected error occurred" type="error" />,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Email Address</FormLabel>
              <Input
                value={initialData.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-muted-foreground text-sm">
                Email cannot be changed as it&apos;s linked to your account
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
