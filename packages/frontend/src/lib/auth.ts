import { create } from 'zustand'
import { api } from './api'
import { setOrgSettings } from './org-format'

function applyUserLocale(user: any) {
  if (!user) return
  setOrgSettings({ language: user.language || 'en_us', timezone: user.timezone || 'UTC', dateFormat: user.dateFormat || 'mm-dd-yyyy', hourFormat: user.hourFormat || '12h', defaultCurrency: user.currencyCode || 'USD' })
  const code = (user.language || 'en_us').split('_')[0]
  document.documentElement.lang = code
  document.documentElement.dir = ['ar', 'ur', 'he', 'fa'].includes(code) ? 'rtl' : 'ltr'
}

interface AuthState {
  token: string | null
  user: any | null
  loading: boolean
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<any>
  login2fa: (challenge: string, code: string) => Promise<void>
  register: (data: any) => Promise<any>
  verifyRegister: (verificationId: string, code: string) => Promise<any>
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
    applyUserLocale(res.user)
    set({ token: res.token, user: res.user, loading: false })
  },

  login2fa: async (challenge, code) => {
    const res = await api.login2fa(challenge, code)
    localStorage.setItem('token', res.token)
    applyUserLocale(res.user)
    set({ token: res.token, user: res.user, loading: false })
  },

  register: async (data) => {
    // New registrations require email verification first; no token is issued
    // until /auth/register/verify confirms the code.
    return api.orgRegister(data)
  },

  verifyRegister: async (verificationId, code) => {
    const res = await api.verifyRegister(verificationId, code)
    localStorage.setItem('token', res.token)
    applyUserLocale(res.user)
    set({ token: res.token, user: res.user, loading: false })
    return res
  },

  logout: () => {
    const token = get().token
    if (token) api.logout(token).catch(() => {})
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
      applyUserLocale(user)
      set({ user, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, loading: false })
    }
  },
}))

useAuthStore.getState().loadUser()
