export const appBasePath = (
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BASE_PATH : ''
) || ''

export function withAppBasePath(path: string) {
  if (!appBasePath || !path.startsWith('/')) return path
  return `${appBasePath}${path}`
}
