import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
      .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain a number' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Password must contain a special character',
      }),
    confirmPassword: z.string().min(8, {
      message: 'Confirm password must be at least 8 characters long',
    }),
    name: z.string().min(1, {
      message: 'Name cannot be empty',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterSchema = z.infer<typeof registerSchema>
