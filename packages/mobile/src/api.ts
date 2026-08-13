import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_API = 'http://192.168.2.229:3000'

export function apiBase(): string {
  return (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '')
}

const TOKEN_KEY = 'bizforce_token'

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
  else await AsyncStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${apiBase()}/api${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const j = await res.json()
      if (j?.error) message = j.error
    } catch {}
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export async function login(email: string, password: string) {
  const data = await request<any>('/auth/login', { method: 'POST', body: { email, password } })
  if (data.token) await setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  await setToken(null)
}

export async function apiList(module: string, limit = 50) {
  return request<any>(`/${module}?limit=${limit}`)
}

export async function apiGet(module: string, id: string) {
  return request<any>(`/${module}/${id}`)
}

export async function apiUpdate(module: string, id: string, body: any) {
  return request<any>(`/${module}/${id}`, { method: 'PUT', body })
}

export async function apiCreate(module: string, body: any) {
  return request<any>(`/${module}`, { method: 'POST', body })
}

export async function apiCount(module: string) {
  const data = await request<any>(`/${module}?limit=1`)
  return data?.pagination?.total ?? 0
}
