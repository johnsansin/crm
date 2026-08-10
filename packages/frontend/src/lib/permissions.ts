import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const cache = new Map<string, Set<string>>()

export function useViewableModules(): Set<string> {
  const { data } = useQuery({
    queryKey: ['viewable-modules'],
    queryFn: async () => {
      const res = await api.getMenuModules()
      const set = new Set<string>()
      for (const m of res?.data || []) set.add(m.name)
      cache.set('viewable', set)
      return set
    },
    staleTime: 60_000,
    retry: false,
  })
  return data || cache.get('viewable') || new Set()
}

export function useCanView(module: string): boolean {
  return useViewableModules().has(module)
}
