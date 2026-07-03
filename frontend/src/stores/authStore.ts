import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'farmer' | 'consumer' | 'lab' | 'admin' | null

interface AuthState {
  userRole: UserRole
  userEmail: string | null
  userId: string | null
  userName: string | null
  isAuthenticated: boolean
  token: string | null
  login: (user: { id: string; email: string; role: UserRole; full_name?: string }, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userRole: null,
      userEmail: null,
      userId: null,
      userName: null,
      isAuthenticated: false,
      token: null,
      login: (user, token) =>
        set({
          userEmail: user.email,
          userRole: user.role,
          userId: user.id,
          userName: user.full_name || null,
          isAuthenticated: true,
          token,
        }),
      logout: () =>
        set({
          userEmail: null,
          userRole: null,
          userId: null,
          userName: null,
          isAuthenticated: false,
          token: null,
        }),
    }),
    { name: 'ayurveda-auth' }
  )
)
