import { create } from 'zustand'
import { api } from './api'

interface AuthState {
  token: string | null
  user: any | null
  loading: boolean
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<any>
  login2fa: (userId: string, code: string) => Promise<void>
  register: (data: any) => Promise<any>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: true,

  setToken: (token) => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
    set({ token })
  },

  login: async (email, password) => {
    const res = await api.login(email, password)
    if (res.requires2FA) {
      set({ user: res.user, loading: false })
      return res
    }
    localStorage.setItem('token', res.token)
    set({ token: res.token, user: res.user, loading: false })
  },

  login2fa: async (userId, code) => {
    const res = await api.login2fa(userId, code)
    localStorage.setItem('token', res.token)
    set({ token: res.token, user: res.user, loading: false })
  },

  register: async (data) => {
    const res = await api.orgRegister(data)
    localStorage.setItem('token', res.token)
    set({ token: res.token, user: res.user, loading: false })
    return res
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },

  loadUser: async () => {
    const token = get().token
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const user = await api.getMe()
      set({ user, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, loading: false })
    }
  },
}))

useAuthStore.getState().loadUser()
