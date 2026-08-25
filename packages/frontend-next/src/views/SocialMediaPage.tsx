'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Send, Calendar, BarChart3, Share2, X } from 'lucide-react'

const platformIcons: Record<string, string> = {
  facebook: 'f', twitter: 'X', linkedin: 'in', instagram: 'ig', youtube: 'yt',
}

export function SocialMediaPage() {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [postFormOpen, setPostFormOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({ platform: 'facebook', profileId: '', profileName: '', profileUrl: '' })
  const [postForm, setPostForm] = useState({ profileId: '', content: '', status: 'draft' })
  const [saving, setSaving] = useState(false)

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['social-profiles'],
    queryFn: () => api.request<{ data: any[] }>('/social/profiles'),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => api.request<{ data: any[] }>('/social/posts'),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['social-analytics', analyticsOpen],
    queryFn: () => analyticsOpen ? api.request<{ data: any }>(`/social/analytics/${analyticsOpen}`) : Promise.resolve(null),
    enabled: !!analyticsOpen,
  })

  const profiles = profilesData?.data || []
  const posts = postsData?.data || []

  const saveProfile = async () => {
    if (!profileForm.platform || !profileForm.profileId) return addToast({ title: 'Error', description: 'Platform and Profile ID required', variant: 'destructive' })
    setSaving(true)
    try {
      await api.request('/social/profiles', { method: 'POST', body: JSON.stringify(profileForm) })
      setProfileFormOpen(false)
      qc.invalidateQueries({ queryKey: ['social-profiles'] })
      addToast({ title: 'Profile connected', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const disconnectProfile = async (id: string) => {
    try {
      await api.request(`/social/profiles/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['social-profiles'] })
      addToast({ title: 'Disconnected', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const savePost = async () => {
    if (!postForm.profileId || !postForm.content) return addToast({ title: 'Error', description: 'Profile and content required', variant: 'destructive' })
    setSaving(true)
    try {
      if (editingPostId) {
        await api.request(`/social/posts/${editingPostId}`, { method: 'PUT', body: JSON.stringify(postForm) })
      } else {
        await api.request('/social/posts', { method: 'POST', body: JSON.stringify(postForm) })
      }
      setPostFormOpen(false); setEditingPostId(null)
      qc.invalidateQueries({ queryKey: ['social-posts'] })
      addToast({ title: editingPostId ? 'Updated' : 'Created', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const deletePost = async (id: string) => {
    try {
      await api.request(`/social/posts/${id}`, { method: 'DELETE' })
      qc.invalidateQueries({ queryKey: ['social-posts'] })
      addToast({ title: 'Deleted', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const publishPost = async (id: string) => {
    try {
      await api.request(`/social/posts/${id}/publish`, { method: 'POST' })
      qc.invalidateQueries({ queryKey: ['social-posts'] })
      addToast({ title: 'Published', variant: 'success' })
    } catch (e: any) { addToast({ title: 'Error', description: e.message, variant: 'destructive' }) }
  }

  const statusColor = (s: string) => {
    if (s === 'published') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (s === 'scheduled') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('Social Media')}</h1>
      </div>

      {/* Profiles Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t('Connected Profiles')}</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setProfileFormOpen(true)}><Plus size={14} />{t('Connect')}</Button>
        </div>
        {profilesLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin" /></div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('No connected profiles')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{platformIcons[p.platform] || p.platform[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.profileName || p.profileId}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.platform}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title={t('Analytics')} onClick={() => setAnalyticsOpen(p.id)}><BarChart3 size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title={t('Disconnect')} onClick={() => disconnectProfile(p.id)}><X size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t('Posts')}</h2>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditingPostId(null); setPostForm({ profileId: profiles[0]?.id || '', content: '', status: 'draft' }); setPostFormOpen(true) }}><Plus size={14} />{t('New Post')}</Button>
        </div>
        {postsLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Share2 size={36} className="opacity-40" />
            <p className="text-sm">{t('No posts yet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p: any) => (
              <div key={p.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    {p.profile && <span className="text-xs text-muted-foreground capitalize">{p.profile.platform}</span>}
                    {p.publishedAt && <span className="text-xs text-muted-foreground">{new Date(p.publishedAt).toLocaleDateString()}</span>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{p.likes} likes</span>
                    <span>{p.comments} comments</span>
                    <span>{p.shares} shares</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Edit')} onClick={() => { setEditingPostId(p.id); setPostForm({ profileId: p.profileId, content: p.content, status: p.status }); setPostFormOpen(true) }}><Plus size={15} /></Button>}
                  {p.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8" title={t('Publish')} onClick={() => publishPost(p.id)}><Send size={15} /></Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title={t('Delete')} onClick={() => deletePost(p.id)}><Trash2 size={15} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Profile Dialog */}
      <Dialog open={profileFormOpen} onOpenChange={setProfileFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('Connect Profile')}</DialogTitle>
            <DialogDescription>{t('Link a social media profile')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <select value={profileForm.platform} onChange={e => setProfileForm({ ...profileForm, platform: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter / X</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
            <Input placeholder={t('Profile ID')} value={profileForm.profileId} onChange={e => setProfileForm({ ...profileForm, profileId: e.target.value })} />
            <Input placeholder={t('Profile Name')} value={profileForm.profileName} onChange={e => setProfileForm({ ...profileForm, profileName: e.target.value })} />
            <Input placeholder={t('Profile URL')} value={profileForm.profileUrl} onChange={e => setProfileForm({ ...profileForm, profileUrl: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setProfileFormOpen(false)}>{t('Cancel')}</Button>
              <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Connect')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Form Dialog */}
      <Dialog open={postFormOpen} onOpenChange={o => { if (!o) { setPostFormOpen(false); setEditingPostId(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPostId ? t('Edit Post') : t('New Post')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <select value={postForm.profileId} onChange={e => setPostForm({ ...postForm, profileId: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{t('Select profile')}</option>
              {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.profileName || p.profileId} ({p.platform})</option>)}
            </select>
            <textarea placeholder={t('What do you want to share?')} value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y" />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setPostFormOpen(false); setEditingPostId(null) }}>{t('Cancel')}</Button>
              <Button onClick={savePost} disabled={saving}>{saving && <Loader2 size={14} className="animate-spin mr-1" />}{t('Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={!!analyticsOpen} onOpenChange={o => { if (!o) setAnalyticsOpen(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('Profile Analytics')}</DialogTitle></DialogHeader>
          {analyticsData?.data ? (
            <div className="grid grid-cols-2 gap-4 py-2">
              {[
                ['Total Posts', analyticsData.data.totalPosts],
                ['Published', analyticsData.data.publishedCount],
                ['Total Likes', analyticsData.data.totalLikes],
                ['Total Comments', analyticsData.data.totalComments],
                ['Total Shares', analyticsData.data.totalShares],
                ['Total Reach', analyticsData.data.totalReach],
              ].map(([label, val]) => (
                <div key={String(label)} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{val as number}</p>
                  <p className="text-xs text-muted-foreground">{t(String(label))}</p>
                </div>
              ))}
            </div>
          ) : <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" /></div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
