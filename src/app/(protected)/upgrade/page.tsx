'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useAuth } from '@/hooks/use-auth'
import { DODO_PRODUCTS, SUBSCRIPTION_CONFIG } from '@/lib/constants'

const billingFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  zipcode: z.string().min(1, 'ZIP/Postal code is required'),
})

type BillingFormData = z.infer<typeof billingFormSchema>

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SE', label: 'Sweden' },
  { value: 'IN', label: 'India' },
  // Add more countries as needed
]

export default function UpgradePage() {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<BillingFormData>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '+916238059733',
      street: 'Nilav, TC-2',
      city: 'Trivandrum',
      state: 'Kerala',
      country: 'IN', // Default to US
      zipcode: '695581',
    },
  })

  // Pre-populate user's email when component mounts
  useEffect(() => {
    if (user?.email) {
      form.setValue('email', user.email)
    }
    if (user?.name) {
      const nameParts = user.name.split(' ')
      if (nameParts.length >= 2) {
        form.setValue('firstName', nameParts[0])
        form.setValue('lastName', nameParts.slice(1).join(' '))
      } else {
        form.setValue('firstName', user.name)
      }
    }
  }, [user, form])

  const onSubmit = async (data: BillingFormData) => {
    setIsLoading(true)

    try {
      // Create checkout session with billing information
      const response = await fetch(
        '/api/subscriptions/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billingInfo: {
              city: data.city,
              country: data.country,
              state: data.state,
              street: data.street,
              zipcode: data.zipcode,
              phoneNumber: data.phoneNumber,
            },
            productId: DODO_PRODUCTS.PRO_SUBSCRIPTION,
          }),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      // Redirect to Dodo Payments checkout
      window.location.href = result.payment_link
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.custom(
        <CustomToast
          type="error"
          message={
            error instanceof Error
              ? error.message
              : 'Failed to start upgrade process'
          }
        />,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upgrade to Pro</h1>
        <p className="text-muted-foreground">
          Complete your billing information to upgrade to the Pro plan
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Billing Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Address</h3>

                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem
                                    key={country.value}
                                    value={country.value}
                                  >
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP/Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Plan Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pro Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold">
                ${SUBSCRIPTION_CONFIG.PRO_PLAN.price}/
                {SUBSCRIPTION_CONFIG.PRO_PLAN.interval}
              </div>

              <div className="space-y-3">
                {SUBSCRIPTION_CONFIG.PRO_PLAN.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="text-muted-foreground text-xs">
                  Secure payment processing by Dodo Payments. Cancel anytime.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
