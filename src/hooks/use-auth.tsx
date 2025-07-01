import toast from 'react-hot-toast'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { CustomToast } from '@/components/ui/custom-toast'

import { env } from '@/env/client'
import { SubscriptionTier } from '@/types'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: Date | null
  subscriptionTier: SubscriptionTier
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

type AuthStore = {
  set: (partial: Partial<AuthState>) => void
  get: () => AuthState
}

export const useAuth = create<AuthState>()(
  persist(
    (set: AuthStore['set'], get: AuthStore['get']) => ({
      user: null,
      isLoading: true,
      setUser: (user: User | null) => set({ user }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      logout: async () => {
        try {
          const response = await fetch(
            `${env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
            {
              method: 'POST',
            },
          )
          if (response.ok) {
            toast.custom(
              <CustomToast message="Logged out successfully" type="success" />,
            )
            set({ user: null })
          } else {
            toast.custom(
              <CustomToast message="Failed to logout" type="error" />,
            )
            console.error('Logout error:', response.statusText)
          }
        } catch (error) {
          console.error('Logout error:', error)
        }
      },

      checkAuth: async () => {
        const { setUser, setLoading } = get()
        setLoading(true)

        try {
          const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/me`)
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Auth check error:', error)
          setUser(null)
        } finally {
          setLoading(false)
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({ user: state.user }),
    },
  ),
)

// Single hook for all auth-related functionality
export function useAuthState() {
  const { user, isLoading, logout, checkAuth, setUser } = useAuth()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    checkAuth,
    setUser,
  }
}
