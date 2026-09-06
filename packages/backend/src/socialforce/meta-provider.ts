import { z } from 'zod'
import { credentialKey } from './credentials'
import { providers } from './domain'

export class ConnectionError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export type ConnectPlatform = 'facebook' | 'instagram'
export type DiscoveredAccount = { externalId: string; name: string; platform: ConnectPlatform; accountType: string; accessToken: string; permissions: string[]; expiresAt: string | null }
export interface AccountConnectionProvider {
  authorizationUrl(platform: ConnectPlatform, state: string): string
  discover(platform: ConnectPlatform, code: string): Promise<DiscoveredAccount[]>
}
export function metaConfiguration() {
  const missing: string[] = []
  const clientId = process.env.FACEBOOK_CLIENT_ID || '', clientSecret = process.env.FACEBOOK_CLIENT_SECRET || ''
  const origin = process.env.SOCIALFORCE_PUBLIC_ORIGIN || '', version = process.env.FACEBOOK_GRAPH_API_VERSION || ''
  if (!clientId) missing.push('FACEBOOK_CLIENT_ID')
  if (!clientSecret) missing.push('FACEBOOK_CLIENT_SECRET')
  try { const url = new URL(origin); if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw Error() }
  catch { missing.push('SOCIALFORCE_PUBLIC_ORIGIN (HTTPS origin)') }
  if (!/^v\d+\.\d+$/.test(version)) missing.push('FACEBOOK_GRAPH_API_VERSION')
  try { credentialKey() } catch { missing.push('SOCIALFORCE_ENCRYPTION_KEY (32 bytes, base64)') }
  return { clientId, clientSecret, origin, version, missing, configured: missing.length === 0 }
}
export function connectionProviders() {
  const config = metaConfiguration()
  return providers.map(provider => {
    const implemented = provider.id === 'facebook' || provider.id === 'instagram'
    return { ...provider, implemented, canConnect: implemented && config.configured,
      status: implemented ? config.configured ? 'READY' : 'SETUP_REQUIRED' : 'COMING_LATER',
      reason: implemented ? config.configured ? 'Authorize through Meta, then select the accounts to add to this organization.' : 'An administrator must configure the Meta application and public HTTPS callback before connection.' : 'This official provider adapter is not implemented yet.',
      missing: implemented ? config.missing : [], callbackUrl: implemented && config.configured ? `${config.origin}/api/socialforce/oauth/${provider.id}/callback` : null,
    }
  })
}
function configOrThrow() {
  const config = metaConfiguration()
  if (!config.configured) throw new ConnectionError('Meta connection setup is incomplete. Open connection setup for the required server configuration.', 503)
  return config
}
function scopes(platform: ConnectPlatform) {
  // Connection-only scopes. Publishing permissions are intentionally requested in the publishing phase.
  return platform === 'instagram' ? ['pages_show_list', 'pages_read_engagement', 'instagram_basic'] : ['pages_show_list', 'pages_read_engagement']
}
export function metaAuthorizationUrl(platform: ConnectPlatform, state: string) {
  const config = configOrThrow()
  const url = new URL(`https://www.facebook.com/${config.version}/dialog/oauth`)
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: `${config.origin}/api/socialforce/oauth/${platform}/callback`, state, response_type: 'code', scope: scopes(platform).join(','), auth_type: 'rerequest' }).toString()
  return url.toString()
}
async function graph(path: string, params: Record<string, string>, accessToken?: string): Promise<unknown> {
  const config = configOrThrow(), url = new URL(`https://graph.facebook.com/${config.version}/${path}`)
  url.search = new URLSearchParams(params).toString()
  try {
    const response = await fetch(url, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}, signal: AbortSignal.timeout(15000), redirect: 'error' })
    if (!response.ok) throw new ConnectionError(response.status === 429 ? 'Meta is limiting requests. Wait a few minutes and reconnect.' : 'Meta could not authorize this connection. Check the application permissions and try again.', 502)
    return await response.json()
  } catch (error) {
    if (error instanceof ConnectionError) throw error
    throw new ConnectionError('Meta could not be reached. Please try connecting again.', 502)
  }
}
const tokenSchema = z.object({ access_token: z.string().min(1), expires_in: z.number().positive().optional() })
const pagesSchema = z.object({ data: z.array(z.object({ id: z.string(), name: z.string(), access_token: z.string().optional(), tasks: z.array(z.string()).optional(), instagram_business_account: z.object({ id: z.string(), username: z.string().optional(), name: z.string().optional() }).optional() })), paging: z.object({ next: z.string().optional(), cursors: z.object({ after: z.string().optional() }).optional() }).optional() })
export async function discoverMetaAccounts(platform: ConnectPlatform, code: string): Promise<DiscoveredAccount[]> {
  const config = configOrThrow()
  const shortToken = tokenSchema.parse(await graph('oauth/access_token', { client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: `${config.origin}/api/socialforce/oauth/${platform}/callback`, code }))
  const token = tokenSchema.parse(await graph('oauth/access_token', { grant_type: 'fb_exchange_token', client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: shortToken.access_token }))
  const permissionsResponse = z.object({ data: z.array(z.object({ permission: z.string(), status: z.string() })) }).parse(await graph('me/permissions', {}, token.access_token))
  const granted = permissionsResponse.data.filter(p => p.status === 'granted').map(p => p.permission)
  if (scopes(platform).some(scope => !granted.includes(scope))) throw new ConnectionError('Required permissions were not granted. Reconnect and allow access to the Pages you want to manage.')
  const accounts: DiscoveredAccount[] = []
  let after = ''
  for (let page = 0; page < 5; page++) {
    const fields = platform === 'instagram' ? 'id,name,access_token,tasks,instagram_business_account{id,username,name}' : 'id,name,access_token,tasks'
    const result = pagesSchema.parse(await graph('me/accounts', { fields, limit: '100', ...(after ? { after } : {}) }, token.access_token))
    for (const row of result.data) {
      if (!row.access_token || (platform === 'instagram' && !row.instagram_business_account)) continue
      const ig = row.instagram_business_account
      accounts.push({ externalId: platform === 'instagram' ? ig!.id : row.id, name: platform === 'instagram' ? ig!.username ? `@${ig!.username}` : ig!.name || row.name : row.name, platform,
        accountType: platform === 'instagram' ? 'INSTAGRAM_PROFESSIONAL' : 'FACEBOOK_PAGE', accessToken: row.access_token, permissions: granted,
        expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null })
    }
    if (!result.paging?.next) return [...new Map(accounts.map(a => [a.externalId, a])).values()]
    if (!result.paging.cursors?.after) throw new ConnectionError('Meta returned incomplete account information. Please reconnect.', 502)
    after = result.paging.cursors.after
  }
  throw new ConnectionError('More than 500 Pages were returned. Reconnect and authorize a smaller selection of Pages.')
}
export const metaAccountProvider: AccountConnectionProvider = { authorizationUrl: metaAuthorizationUrl, discover: discoverMetaAccounts }
