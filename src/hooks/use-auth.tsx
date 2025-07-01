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
  isInitialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      setUser: (user: User | null) => set({ user }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setInitialized: (initialized: boolean) =>
        set({ isInitialized: initialized }),

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
            // Redirect to login page
            window.location.href = '/login'
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
        // Only show loading if we haven't initialized yet
        if (!get().isInitialized) {
          set({ isLoading: true })
        }

        try {
          const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/me`)
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user })
          } else {
            set({ user: null })
          }
        } catch (error) {
          console.error('Auth check error:', error)
          set({ user: null })
        } finally {
          set({ isLoading: false, isInitialized: true })
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
  const { user, isLoading, isInitialized, logout, checkAuth, setUser } =
    useAuth()

  return {
    user,
    isLoading: isLoading && !isInitialized, // Only show loading for initial check
    isAuthenticated: !!user,
    logout,
    checkAuth,
    setUser,
  }
}
