const API_BASE = '/api'

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
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { userName: string; email: string; firstName: string; lastName: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<any>('/auth/me'),

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
    request<{ message: string }>('/auth/forgot-password', {
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

  // ---- Record detail (vtiger-style) ----
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
}
