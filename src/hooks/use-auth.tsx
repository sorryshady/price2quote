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
      setUser: (user: User | null) =>
        set({ user, isInitialized: true, isLoading: false }),
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
        const currentState = get()

        // Only show loading if we haven't initialized yet
        if (!currentState.isInitialized) {
          set({ isLoading: true })
        }

        try {
          const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/me`)
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, isInitialized: true, isLoading: false })
          } else {
            // Only clear user if we get a 401/403, not on network errors
            if (response.status === 401 || response.status === 403) {
              set({ user: null, isInitialized: true, isLoading: false })
            } else {
              // Don't clear user on other errors to prevent flickering
              set({ isInitialized: true, isLoading: false })
            }
          }
        } catch (error) {
          console.error('Auth check error:', error)
          // Don't clear user on network errors to prevent flickering
          // Only clear if we're not initialized yet
          if (!currentState.isInitialized) {
            set({ user: null, isInitialized: true, isLoading: false })
          } else {
            set({ isInitialized: true, isLoading: false })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
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
