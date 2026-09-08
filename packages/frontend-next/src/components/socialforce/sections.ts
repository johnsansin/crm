export const socialForceSections = [
  { slug: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { slug: 'create-post', label: 'Create Post', icon: 'Plus' },
  { slug: 'content', label: 'Content', icon: 'FileText' },
  { slug: 'calendar', label: 'Calendar', icon: 'CalendarDays' },
  { slug: 'approvals', label: 'Approvals', icon: 'Shield' },
  { slug: 'social-accounts', label: 'Social Accounts', icon: 'Share2' },
  { slug: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { slug: 'ai-assistant', label: 'AI Assistant', icon: 'Sparkles' },
  { slug: 'brand-settings', label: 'Brand & Settings', icon: 'Settings' },
] as const
export type SocialForceView = typeof socialForceSections[number]['label']
