'use client'

import NextLink from 'next/link'
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import { useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react'

export function useNavigate() {
  const router = useRouter()
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to < 0) router.back()
      else router.forward()
      return
    }
    options?.replace ? router.replace(to) : router.push(to)
  }
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  const search = searchParams.toString()
  return { pathname, search: search ? `?${search}` : '', hash: typeof window === 'undefined' ? '' : window.location.hash, state: null }
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useNextParams() as T
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const params = useNextSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const serializedParams = params.toString()
  const current = useMemo(() => new URLSearchParams(serializedParams), [serializedParams])
  const setParams = useCallback((next: URLSearchParams | Record<string, string>) => {
    const value = next instanceof URLSearchParams ? next : new URLSearchParams(next)
    router.push(pathname + (value.size ? "?" + value.toString() : ""))
  }, [pathname, router])
  return [current, setParams]
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
  to: string
  children?: ReactNode
  className?: string | ((state: { isActive: boolean }) => string)
  end?: boolean
  state?: unknown
}

export function Link({ to, children, state: _state, end: _end, ...props }: LinkProps) {
  const className = typeof props.className === 'function' ? undefined : props.className
  return <NextLink href={to} {...props} className={className}>{children}</NextLink>
}

export function NavLink({ to, children, className, end, state: _state, ...props }: LinkProps) {
  const pathname = usePathname()
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  return <NextLink href={to} {...props} className={typeof className === 'function' ? className({ isActive }) : className}>{children}</NextLink>
}
