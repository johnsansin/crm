import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { login as apiLogin, logout as apiLogout, apiBase } from './api'

const USER_KEY = 'bizforce_user'

interface AuthCtx {
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  complete2FA: (code: string) => Promise<void>
  logout: () => Promise<void>
  requires2FA: string | null
}

const AuthContext = createContext<AuthCtx>(null as any)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requires2FA, setRequires2FA] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem('bizforce_token'),
        ])
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    if (data.requires2FA) {
      setRequires2FA(data.userId)
      return
    }
    setRequires2FA(null)
    setUser(data.user)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }, [])

  const complete2FA = useCallback(async (code: string) => {
    const res = await fetch(`${apiBase()}/api/auth/login/2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: requires2FA, code }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Invalid code')
    await AsyncStorage.setItem('bizforce_token', data.token)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setRequires2FA(null)
    setUser(data.user)
  }, [requires2FA])

  const logout = useCallback(async () => {
    await apiLogout()
    await AsyncStorage.removeItem(USER_KEY)
    setUser(null)
    setRequires2FA(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, complete2FA, logout, requires2FA }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
