export const socialForceModule = {
  name: 'socialforce', label: 'SocialForce', parent: 'SocialForce',
  icon: 'Share2', sequence: 45, isActive: true, isEntity: false,
}

// Keep existing social grants and organization menu preferences when upgrading.
export function withSocialForceModule<T extends { name: string }>(rows: T[]): (T | typeof socialForceModule)[] {
  const existing = rows.find(row => row.name === 'socialforce')
    || rows.find(row => row.name === 'social-media' || row.name === 'social')
  return [...rows.filter(row => !['socialforce', 'social-media', 'social'].includes(row.name)),
    { ...socialForceModule, ...existing, name: 'socialforce', label: 'SocialForce' }]
}

export function socialForceMenuOverrides(overrides: Record<string, any>): Record<string, any> {
  return { ...overrides, socialforce: overrides.socialforce ?? overrides['social-media'] ?? overrides.social ?? {} }
}

export function menuPermissionModule(name: string) {
  return name
}

export const socialForceSections = ['dashboard', 'create-post', 'content', 'calendar', 'approvals', 'social-accounts', 'analytics', 'ai-assistant', 'brand-settings'] as const
export type SocialForceSection = typeof socialForceSections[number]
export const socialForcePermissionModules = ['socialforce', ...socialForceSections.map(section => `socialforce.${section}`)]
export const socialForceActions = ['view', 'create', 'edit', 'delete', 'import', 'export'] as const
export type SocialForceAction = typeof socialForceActions[number]
export type SocialForceGrant = Record<SocialForceAction, boolean>
export type SocialForcePermissionRow = { moduleName: string } & Partial<SocialForceGrant>
const emptyGrant = (): SocialForceGrant => ({ view: false, create: false, edit: false, delete: false, import: false, export: false })

// Legacy grants are inherited only until a role has explicit SocialForce configuration.
// Once configured, omitted submenu grants deny access instead of falling back to legacy access.
export function resolveSocialForcePermissions(rows: SocialForcePermissionRow[], administrator = false): Record<string, SocialForceGrant> {
  const configured = rows.some(row => row.moduleName === 'socialforce' || row.moduleName.startsWith('socialforce.'))
  const legacy = rows.find(row => row.moduleName === 'social')
  return Object.fromEntries(socialForcePermissionModules.map(name => {
    const row = rows.find(row => row.moduleName === name) || (!configured ? legacy : undefined)
    return [name, Object.fromEntries(socialForceActions.map(action => [action, administrator || row?.[action] === true])) as SocialForceGrant]
  }))
}

export function canUseSocialForce(grants: Record<string, SocialForceGrant>, section: SocialForceSection, action: SocialForceAction = 'view') {
  const root = grants.socialforce || emptyGrant(), child = grants[`socialforce.${section}`] || emptyGrant()
  return root.view && root[action] && child.view && child[action]
}
