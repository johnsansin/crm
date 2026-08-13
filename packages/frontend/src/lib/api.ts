const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/api'

const origin = API_BASE === '/api' ? '' : API_BASE.replace(/\/api\/?$/, '')
export function publicUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {}
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  } catch {
    throw new Error('Network error — server may be offline')
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const body = await res.json()
      msg = body.error || body.message || msg
    } catch {}
    throw new Error(msg)
  }

  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any; requires2FA?: boolean; userId?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login2fa: (userId: string, code: string) =>
    request<{ token: string; user: any }>('/auth/login/2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, code }),
    }),

  orgRegister: (data: { userName: string; email: string; firstName: string; lastName: string; password: string; companyName: string }) =>
    request<{ needsVerification: boolean; verificationId: string; email: string; delivered: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyRegister: (verificationId: string, code: string) =>
    request<{ token: string; user: any }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ verificationId, code }),
    }),

  resendRegisterCode: (verificationId: string) =>
    request<{ needsVerification: boolean; verificationId: string; email: string; delivered: boolean }>('/auth/register/resend', {
      method: 'POST',
      body: JSON.stringify({ verificationId }),
    }),

  register: (data: { userName: string; email: string; firstName: string; lastName: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<any>('/auth/me'),

  logout: (token: string) =>
    request<any>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCompany: () => request<any>('/company'),

  updateCompany: (data: any) =>
    request<any>('/company', { method: 'PUT', body: JSON.stringify(data) }),

  list: (module: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; pagination: any }>(`/${module}${qs}`)
  },

  listAll: (module: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[] }>(`/${module}/all${qs}`)
  },

  get: (module: string, id: string) => request<any>(`/${module}/${id}`),

  forgotPassword: (email: string) =>
    request<{ message: string; email?: string; delivered?: boolean; alreadySent?: boolean }>('/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token, password })
    }),

  create: (module: string, data: any) =>
    request<any>(`/${module}`, { method: 'POST', body: JSON.stringify(data) }),

  update: (module: string, id: string, data: any) =>
    request<any>(`/${module}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (module: string, id: string) =>
    request<any>(`/${module}/${id}`, { method: 'DELETE' }),

  restore: (module: string, id: string) =>
    request<any>(`/${module}/${id}/restore`, { method: 'PUT' }),

  // RBAC
  getRoleTree: () => request<{ data: any[] }>('/roles/tree'),

  getRolePermissions: (roleId: string) =>
    request<{ data: any[] }>(`/roles/${roleId}/permissions`),

  updateRolePermissions: (roleId: string, permissions: any[]) =>
    request<any>(`/roles/${roleId}/permissions`, {
      method: 'PUT', body: JSON.stringify({ permissions })
    }),

  listGroups: () => request<{ data: any[] }>('/usergroups'),

  createGroup: (data: any) =>
    request<any>('/usergroups', { method: 'POST', body: JSON.stringify(data) }),

  updateGroup: (id: string, data: any) =>
    request<any>(`/usergroups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteGroup: (id: string) =>
    request<any>(`/usergroups/${id}`, { method: 'DELETE' }),

  addGroupMember: (groupId: string, userId: string) =>
    request<any>(`/usergroups/${groupId}/members`, {
      method: 'POST', body: JSON.stringify({ userId })
    }),

  removeGroupMember: (groupId: string, userId: string) =>
    request<any>(`/usergroups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ fileName: string; storedName: string; path: string }>('/upload', {
      method: 'POST', body: formData
    })
  },

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return request<{ fileName: string; storedName: string; path: string }>('/upload/logo', {
      method: 'POST', body: formData
    })
  },

  // Generic fetch for custom endpoints
  request: <T = any>(endpoint: string, options: RequestInit = {}) => request<T>(endpoint, options),

  // Super admin
  adminListCompanies: () => request<{ data: any[] }>('/admin/companies'),
  adminGetCompany: (id: string) => request<any>(`/admin/companies/${id}`),
  adminListUsers: () => request<{ data: any[] }>('/admin/users'),
  adminToggleCompany: (id: string) => request<any>(`/admin/companies/${id}/toggle`, { method: 'PUT' }),
  adminLoginHistory: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; pagination: any }>(`/admin/login-history${qs}`)
  },

  // ---- Settings ----
  getOrgSettings: () => request<any>('/settings'),
  updateOrgSettings: (settings: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),

  getGlobalSettings: () => request<any>('/admin/settings'),
  updateGlobalSettings: (settings: any) =>
    request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),

  getPicklists: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[] }>(`/settings/picklists${qs}`)
  },
  getAllPicklists: (module?: string) => {
    const qs = module ? `?module=${encodeURIComponent(module)}` : ''
    return request<{ data: Record<string, Record<string, string[]>> }>(`/settings/picklists/all${qs}`)
  },
  createPicklistOption: (data: any) =>
    request<any>('/settings/picklists', { method: 'POST', body: JSON.stringify(data) }),
  updatePicklistOption: (id: string, data: any) =>
    request<any>(`/settings/picklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePicklistOption: (id: string) =>
    request<any>(`/settings/picklists/${id}`, { method: 'DELETE' }),
  reorderPicklists: (ids: string[]) =>
    request<any>('/settings/picklists/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),

  getCustomFields: (module?: string) => {
    const qs = module ? `?module=${encodeURIComponent(module)}` : ''
    return request<{ data: any[] }>(`/settings/custom-fields${qs}`)
  },
  createCustomField: (data: any) =>
    request<any>('/settings/custom-fields', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomField: (id: string, data: any) =>
    request<any>(`/settings/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomField: (id: string) =>
    request<any>(`/settings/custom-fields/${id}`, { method: 'DELETE' }),

  getSettingsModules: () => request<{ data: any[] }>('/settings/modules'),
  getMenuModules: () => request<{ data: any[] }>('/settings/modules/menu'),
  updateModule: (name: string, data: any) =>
    request<any>(`/settings/modules/${name}`, { method: 'PUT', body: JSON.stringify(data) }),

  getSharingRules: () => request<{ data: any[] }>('/settings/sharing-rules'),
  updateSharingRule: (moduleName: string, data: any) =>
    request<any>(`/settings/sharing-rules/${moduleName}`, { method: 'PUT', body: JSON.stringify(data) }),

  getProfiles: () => request<{ data: any[] }>('/settings/profiles'),
  createProfile: (data: any) =>
    request<any>('/settings/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id: string, data: any) =>
    request<any>(`/settings/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProfile: (id: string) => request<any>(`/settings/profiles/${id}`, { method: 'DELETE' }),
  applyProfile: (id: string) =>
    request<any>(`/settings/profiles/${id}/apply`, { method: 'POST' }),

  getWorkflows: () => request<{ data: any[] }>('/settings/workflows'),
  createWorkflow: (data: any) =>
    request<any>('/settings/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: any) =>
    request<any>(`/settings/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) => request<any>(`/settings/workflows/${id}`, { method: 'DELETE' }),

  getScheduledTasks: () => request<{ data: any[] }>('/settings/cron'),
  createScheduledTask: (data: any) =>
    request<any>('/settings/cron', { method: 'POST', body: JSON.stringify(data) }),
  updateScheduledTask: (id: string, data: any) =>
    request<any>(`/settings/cron/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScheduledTask: (id: string) => request<any>(`/settings/cron/${id}`, { method: 'DELETE' }),
  runScheduledTask: (id: string) =>
    request<any>(`/settings/cron/${id}/run`, { method: 'POST' }),

  getWebforms: () => request<{ data: any[] }>('/settings/webforms'),
  createWebform: (data: any) =>
    request<any>('/settings/webforms', { method: 'POST', body: JSON.stringify(data) }),
  updateWebform: (id: string, data: any) =>
    request<any>(`/settings/webforms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWebform: (id: string) => request<any>(`/settings/webforms/${id}`, { method: 'DELETE' }),
  regenerateWebformToken: (id: string) =>
    request<any>(`/settings/webforms/${id}/token`, { method: 'POST' }),

  getNotifications: () => request<{ data: any[] }>('/settings/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/settings/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<any>('/settings/notifications/read-all', { method: 'PUT' }),

  getChatUsers: () => request<{ data: any[] }>('/chat/users'),
  getChatConversations: () => request<{ data: any[] }>('/chat/conversations'),
  createChatConversation: (data: any) =>
    request<any>('/chat/conversations', { method: 'POST', body: JSON.stringify(data) }),
  getChatMessages: (id: string, after?: string) =>
    request<{ data: any[] }>(`/chat/conversations/${id}/messages${after ? `?after=${after}` : ''}`),
  sendChatMessage: (id: string, body: string) =>
    request<any>(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  markChatRead: (id: string) =>
    request<any>(`/chat/conversations/${id}/read`, { method: 'POST' }),
  addChatMembers: (id: string, userIds: string[]) =>
    request<any>(`/chat/conversations/${id}/members`, { method: 'POST', body: JSON.stringify({ participantIds: userIds }) }),
  removeChatMember: (id: string, userId: string) =>
    request<any>(`/chat/conversations/${id}/members/${userId}`, { method: 'DELETE' }),
  leaveChatConversation: (id: string) =>
    request<any>(`/chat/conversations/${id}`, { method: 'DELETE' }),

  getActiveAnnouncements: () => request<{ data: any[] }>('/settings/announcements/active'),
  getAnnouncements: () => request<{ data: any[] }>('/settings/announcements'),
  createAnnouncement: (data: any) =>
    request<any>('/settings/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: any) =>
    request<any>(`/settings/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) => request<any>(`/settings/announcements/${id}`, { method: 'DELETE' }),

  getHolidays: () => request<{ data: any[] }>('/settings/holidays'),
  createHoliday: (data: any) =>
    request<any>('/settings/holidays', { method: 'POST', body: JSON.stringify(data) }),
  updateHoliday: (id: string, data: any) =>
    request<any>(`/settings/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHoliday: (id: string) => request<any>(`/settings/holidays/${id}`, { method: 'DELETE' }),

  getCalendar: (from: string, to: string) =>
    request<{ data: any[] }>(`/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  getUpcomingActivities: (limit?: number) =>
    request<{ data: any[] }>(`/calendar/upcoming${limit ? `?limit=${limit}` : ''}`),
  createCalendarActivity: (data: any) =>
    request<any>('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  updateCalendarActivity: (id: string, data: any) =>
    request<any>(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCalendarActivity: (id: string) => request<any>(`/calendar/${id}`, { method: 'DELETE' }),

  getDashboardConfig: () => request<{ config: any }>('/auth/me/dashboard'),
  updateDashboardConfig: (config: any) =>
    request<any>('/auth/me/dashboard', { method: 'PUT', body: JSON.stringify({ config }) }),

  getAudit: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; pagination: any }>(`/settings/audit${qs}`)
  },

  getLoginHistory: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<{ data: any[]; pagination: any }>(`/settings/login-history${qs}`)
  },

  createBackup: () => request<any>('/settings/backup', { method: 'POST' }),
  listBackups: () => request<{ data: any[] }>('/settings/backups'),

  exportModule: async (moduleName: string, format: 'csv' | 'json'): Promise<{ ok: boolean; error?: string }> => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/settings/export/${moduleName}?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        let msg = `Export failed (${res.status})`
        try {
          const body = await res.json()
          msg = body.error || msg
        } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${moduleName}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message || 'Export failed' }
    }
  },

  importModule: (moduleName: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ success: boolean; created: number; failed: number; total: number }>(`/settings/import/${moduleName}`, {
      method: 'POST', body: formData
    })
  },
  importModuleRows: (moduleName: string, rows: any[], options: { matchField?: string; updateExisting?: boolean }) =>
    request<{ success: boolean; created: number; updated: number; failed: number; total: number; errors: { row: number; error: string }[] }>(`/settings/import/${moduleName}/rows`, {
      method: 'POST', body: JSON.stringify({ rows, options }),
    }),

  testSmtp: (cfg: any) =>
    request<any>('/settings/smtp/test', { method: 'POST', body: JSON.stringify(cfg) }),
  sendEmail: (data: any) =>
    request<any>('/settings/email/send', { method: 'POST', body: JSON.stringify(data) }),

  get2faSetup: () => request<any>('/settings/2fa/setup'),
  enable2fa: (code: string) =>
    request<any>('/settings/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: (data: any) =>
    request<any>('/settings/2fa/disable', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/settings/password/change', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  getSequenceNumbers: () => request<{ data: any[] }>('/settings/sequence-numbers'),
  updateSequenceNumber: (moduleName: string, data: any) =>
    request<any>(`/settings/sequence-numbers/${moduleName}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ---- Tags (company-scoped) ----
  getTags: () => request<{ data: any[] }>('/settings/tags'),
  createTag: (data: any) =>
    request<any>('/settings/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id: string, name: string) =>
    request<any>(`/settings/tags/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteTag: (id: string) => request<any>(`/settings/tags/${id}`, { method: 'DELETE' }),

  // ---- Custom views ----
  getCustomViews: (moduleName: string) => request<{ data: any[] }>(`/settings/customviews/${moduleName}`),
  createCustomView: (moduleName: string, data: any) =>
    request<any>(`/settings/customviews/${moduleName}`, { method: 'POST', body: JSON.stringify(data) }),
  updateCustomView: (id: string, data: any) =>
    request<any>(`/settings/customviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomView: (id: string) =>
    request<any>(`/settings/customviews/${id}`, { method: 'DELETE' }),

  // ---- Report export (printable HTML) ----
  exportReport: async (report: any, rows: any[]): Promise<{ ok: boolean; error?: string }> => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...report, rows }),
      })
      if (!res.ok) {
        let msg = `Export failed (${res.status})`
        try { const b = await res.json(); msg = b.error || msg } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const w = window.open()
      if (w) { w.document.open(); w.document.write('Loading report…'); w.location.href = url }
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message || 'Export failed' }
    }
  },
  exportReportCsv: async (report: any, rows: any[]): Promise<{ ok: boolean; error?: string }> => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_BASE}/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...report, rows, format: 'csv' }),
      })
      if (!res.ok) {
        let msg = `Export failed (${res.status})`
        try { const b = await res.json(); msg = b.error || msg } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(report.name || 'report').replace(/[^a-zA-Z0-9-_]/g, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message || 'Export failed' }
    }
  },

  // ---- Record detail ----
  record: (module: string, id: string) => ({
    activities: () => request<{ data: any[] }>(`/records/${module}/${id}/activities`),
    createActivity: (data: any) =>
      request<any>(`/records/${module}/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
    emails: () => request<{ data: any[] }>(`/records/${module}/${id}/emails`),
    createEmail: (data: any) =>
      request<any>(`/records/${module}/${id}/emails`, { method: 'POST', body: JSON.stringify(data) }),
    documents: () => request<{ data: any[] }>(`/records/${module}/${id}/documents`),
    createDocument: (data: any) =>
      request<any>(`/records/${module}/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),
    comments: () => request<{ data: any[] }>(`/records/${module}/${id}/comments`),
    createComment: (data: any) =>
      request<any>(`/records/${module}/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
    updates: (limit?: number) =>
      request<{ data: any[] }>(`/records/${module}/${id}/updates${limit ? `?limit=${limit}` : ''}`),
    followers: () => request<{ data: any[]; isFollowing: boolean }>(`/records/${module}/${id}/followers`),
    follow: () => request<any>(`/records/${module}/${id}/follow`, { method: 'POST' }),
    unfollow: () => request<any>(`/records/${module}/${id}/follow`, { method: 'DELETE' }),
    related: (relatedModule: string) =>
      request<{ data: any[] }>(`/records/${module}/${id}/related/${relatedModule}`),
    linkProducts: (products: { productId: string; qty?: number; listPrice?: number }[]) =>
      request<any>(`/records/${module}/${id}/products`, { method: 'POST', body: JSON.stringify({ products }) }),
    updateLinkedProduct: (productId: string, data: { qty?: number; listPrice?: number }) =>
      request<any>(`/records/${module}/${id}/products/${productId}`, { method: 'PUT', body: JSON.stringify(data) }),
    unlinkProduct: (productId: string) =>
      request<any>(`/records/${module}/${id}/products/${productId}`, { method: 'DELETE' }),
    linkServices: (services: { serviceId: string; qty?: number; listPrice?: number }[]) =>
      request<any>(`/records/${module}/${id}/services`, { method: 'POST', body: JSON.stringify({ services }) }),
    updateLinkedService: (serviceId: string, data: { qty?: number; listPrice?: number }) =>
      request<any>(`/records/${module}/${id}/services/${serviceId}`, { method: 'PUT', body: JSON.stringify(data) }),
    unlinkService: (serviceId: string) =>
      request<any>(`/records/${module}/${id}/services/${serviceId}`, { method: 'DELETE' }),
    linkDocuments: (documentIds: string[]) =>
      request<any>(`/records/${module}/${id}/documents/link`, { method: 'POST', body: JSON.stringify({ documentIds }) }),
    unlinkDocument: (documentId: string) =>
      request<any>(`/records/${module}/${id}/documents/${documentId}`, { method: 'DELETE' }),
    setCampaign: (campaignId: string | null) =>
      request<any>(`/records/${module}/${id}/campaign`, { method: 'PUT', body: JSON.stringify({ campaignId }) }),
  }),

  deleteComment: (id: string) => request<any>(`/records/comments/${id}`, { method: 'DELETE' }),
  updateRecordActivity: (id: string, data: any) =>
    request<any>(`/records/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecordActivity: (id: string) => request<any>(`/records/activities/${id}`, { method: 'DELETE' }),
  deleteRecordDocument: (id: string) => request<any>(`/records/documents/${id}`, { method: 'DELETE' }),

  // ---- Lead conversion ----
  getLeadConversionInfo: (id: string) =>
    request<any>(`/leads/${id}/conversion-info`),
  convertLead: (id: string, data: any) =>
    request<any>(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),

  // ---- Forecast ----
  getForecast: (range?: string) =>
    request<{ data: any }>(`/forecast/opportunities${range ? `?range=${range}` : ''}`),
  recalculateForecast: () =>
    request<any>('/forecast/recalculate', { method: 'POST', body: JSON.stringify({}) }),

  // ---- Duplicate & Merge ----
  getDuplicates: (module: string, id: string) =>
    request<{ data: any[] }>(`/${module}/${id}/duplicates`),
  mergeRecords: (module: string, id: string, targetId: string, keepFields?: string[]) =>
    request<any>(`/${module}/${id}/merge`, { method: 'POST', body: JSON.stringify({ targetId, keepFields: keepFields || [] }) }),

  // ---- Recycle bin ----
  getTrashModules: () => request<{ data: any[] }>('/trash'),
  getTrashRecords: (moduleName: string) => request<{ data: any[]; label: string }>(`/trash/${moduleName}`),
  restoreTrash: (moduleName: string, id: string) =>
    request<any>('/trash/restore', { method: 'POST', body: JSON.stringify({ moduleName, id }) }),
  purgeTrash: (moduleName: string, id: string) =>
    request<any>(`/trash/${moduleName}/${id}`, { method: 'DELETE' }),

  // ---- Recurring invoices ----
  generateRecurringInvoice: (id: string) =>
    request<any>(`/recurringinvoices/${id}/generate`, { method: 'POST', body: JSON.stringify({}) }),
  getUpcomingRecurring: () => request<{ data: any[] }>('/recurringinvoices/upcoming'),

  // ---- Invoice payments ----
  getInvoicePayments: (invoiceId: string) => request<{ data: any[]; total: number }>(`/invoices/${invoiceId}/payments`),
  addInvoicePayment: (invoiceId: string, data: any) =>
    request<any>(`/invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  getInvoiceBalance: (invoiceId: string) => request<any>(`/invoices/${invoiceId}/balance`),

  // ---- Mailboxes / Email-to-ticket ----
  getMailboxRule: (mailboxId: string) => request<{ data: any }>(`/mailboxes/${mailboxId}/rule`),
  saveMailboxRule: (mailboxId: string, data: any) =>
    request<any>(`/mailboxes/${mailboxId}/rule`, { method: 'PUT', body: JSON.stringify(data) }),
  syncMailbox: (mailboxId: string) =>
    request<any>(`/mailboxes/${mailboxId}/sync`, { method: 'POST', body: JSON.stringify({}) }),

  // ---- RSS ----
  getRssEntries: (feedId: string) => request<{ data: any[]; unread: number }>(`/rssfeeds/${feedId}/entries`),
  fetchRssFeed: (feedId: string) =>
    request<any>(`/rssfeeds/${feedId}/fetch`, { method: 'POST', body: JSON.stringify({}) }),
  markRssRead: (entryId: string, isRead?: boolean) =>
    request<any>(`/rssentries/${entryId}/read`, { method: 'POST', body: JSON.stringify({ isRead: isRead !== false }) }),

  // ---- Google sync ----
  getGoogleAccounts: () => request<{ data: any[] }>('/google/accounts'),
  getGoogleAuthUrl: () => request<{ data: any }>('/google/auth-url'),
  connectGoogle: (data: any) => request<any>('/google/token', { method: 'POST', body: JSON.stringify(data) }),
  syncGoogle: (accountId: string, mode?: string) =>
    request<any>('/google/sync', { method: 'POST', body: JSON.stringify({ accountId, mode }) }),
  disconnectGoogle: (id: string) => request<any>(`/google/accounts/${id}`, { method: 'DELETE' }),

  // ---- Layout editor ----
  getModuleLayout: (moduleName: string) => request<{ data: any[] }>(`/layout/${moduleName}`),
  saveModuleLayout: (moduleName: string, tabName: string, data: any) =>
    request<any>(`/layout/${moduleName}/${encodeURIComponent(tabName)}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ---- Picklist dependencies ----
  getPicklistDependencies: (moduleName?: string) => {
    const qs = moduleName ? `?moduleName=${encodeURIComponent(moduleName)}` : ''
    return request<{ data: any[] }>(`/picklist-dependencies${qs}`)
  },
  createPicklistDependency: (data: any) =>
    request<any>('/picklist-dependencies', { method: 'POST', body: JSON.stringify(data) }),
  deletePicklistDependency: (id: string) =>
    request<any>(`/picklist-dependencies/${id}`, { method: 'DELETE' }),
  resolvePicklistDependency: (data: any) =>
    request<{ data: any[] }>('/picklist-dependencies/resolve', { method: 'POST', body: JSON.stringify(data) }),

  // ---- Email templates ----
  previewEmailTemplate: (id: string, variables?: any) =>
    request<any>(`/emailtemplates/${id}/preview`, { method: 'POST', body: JSON.stringify({ variables: variables || {} }) }),
  sendEmailTemplate: (id: string, data: any) =>
    request<any>(`/emailtemplates/${id}/send`, { method: 'POST', body: JSON.stringify(data) }),

  // ---- Product price ----
  computeProductPrice: (id: string, data: any) =>
    request<any>(`/products/${id}/compute-price`, { method: 'POST', body: JSON.stringify(data) }),

  // ---- Call logs / PBX ----
  clickToCall: (data: any) =>
    request<any>('/calllogs/click-to-call', { method: 'POST', body: JSON.stringify(data) }),
  getPbxConfig: () => request<{ data: any }>('/pbx/config'),
  updatePbxConfig: (data: any) =>
    request<{ data: any }>('/pbx/config', { method: 'PUT', body: JSON.stringify(data) }),
  testPbxConnection: () => request<{ ok: boolean; message: string }>('/pbx/test', { method: 'POST' }),
  dialNumber: (data: any) =>
    request<any>('/pbx/dial', { method: 'POST', body: JSON.stringify(data) }),

  // ---- REST WebService API ----
  restLogin: (username: string, password: string) =>
    request<any>('/rest/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  restDescribe: (module: string, sessionName: string) =>
    request<any>(`/rest/describe?module=${encodeURIComponent(module)}&sessionName=${encodeURIComponent(sessionName)}`),

  // ---- API keys ----
  getApiKeys: () => request<{ data: any[] }>('/apikeys'),
  createApiKey: (data: any) => request<any>('/apikeys', { method: 'POST', body: JSON.stringify(data) }),
  deleteApiKey: (id: string) => request<any>(`/apikeys/${id}`, { method: 'DELETE' }),

  // ---- Presence ----
  heartbeat: () => request<{ ok: boolean }>('/presence/heartbeat', { method: 'POST' }),
  getPresenceUsers: () => request<{ data: any[] }>('/presence'),

  // ---- Portal ----
  registerPortal: (contactId: string, accessCode?: string) =>
    request<any>('/portal/register', { method: 'POST', body: JSON.stringify({ contactId, accessCode }) }),
  unregisterPortal: (contactId: string) =>
    request<any>('/portal/unregister', { method: 'POST', body: JSON.stringify({ contactId }) }),
}
