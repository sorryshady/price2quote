'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import FormCard from '@/components/form-card'

import { RegisterSchema, registerSchema } from '@/lib/schemas'

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
  const submitHandler = (data: RegisterSchema) => {
    console.log(data)
  }
  return (
    <FormCard
      heading="Register"
      subheading="Create an account"
      backPrefix="Already have an account?"
      backLabel="Login"
      backHref="/login"
    >
      <div>Register</div>
    </FormCard>
  )
}
