import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'
import { ThemeProvider } from '@/lib/theme'

const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const ContactUsPage = lazy(() => import('@/pages/ContactUsPage').then(m => ({ default: m.ContactUsPage })))
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })))
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const CookiePolicyPage = lazy(() => import('@/pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })))
const RefundPolicyPage = lazy(() => import('@/pages/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignUpPage = lazy(() => import('@/pages/SignUpPage').then(m => ({ default: m.SignUpPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const OrgProfilePage = lazy(() => import('@/pages/OrgProfilePage').then(m => ({ default: m.OrgProfilePage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ModuleListPage = lazy(() => import('@/pages/ModuleListPage').then(m => ({ default: m.ModuleListPage })))
const ModuleDetailPage = lazy(() => import('@/pages/ModuleDetailPage').then(m => ({ default: m.ModuleDetailPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const ForecastPage = lazy(() => import('@/pages/ForecastPage').then(m => ({ default: m.ForecastPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })))
const MailboxesPage = lazy(() => import('@/pages/MailboxesPage').then(m => ({ default: m.MailboxesPage })))
const RssPage = lazy(() => import('@/pages/RssPage').then(m => ({ default: m.RssPage })))
const ChatPage = lazy(() => import('@/pages/ChatPage').then(m => ({ default: m.ChatPage })))
const ChatAdminPage = lazy(() => import('@/pages/ChatAdminPage').then(m => ({ default: m.ChatAdminPage })))
const EmailCampaignsPage = lazy(() => import('@/pages/EmailCampaignsPage').then(m => ({ default: m.EmailCampaignsPage })))
const SmsPage = lazy(() => import('@/pages/SmsPage').then(m => ({ default: m.SmsPage })))
const RecycleBinPage = lazy(() => import('@/pages/RecycleBinPage').then(m => ({ default: m.RecycleBinPage })))
const LandingPagesPage = lazy(() => import('@/pages/LandingPagesPage').then(m => ({ default: m.LandingPagesPage })))
const SocialMediaPage = lazy(() => import('@/pages/SocialMediaPage').then(m => ({ default: m.SocialMediaPage })))
const WebhooksPage = lazy(() => import('@/pages/WebhooksPage').then(m => ({ default: m.WebhooksPage })))
const LeadDetailPage = lazy(() => import('@/pages/LeadDetailPage').then(m => ({ default: m.LeadDetailPage })))
const QuotationsPage = lazy(() => import('@/pages/QuotationsPage').then(m => ({ default: m.QuotationsPage })))
const SalesDocumentPage = lazy(() => import('@/pages/SalesDocumentPage').then(m => ({ default: m.SalesDocumentPage })))
const PurchaseOrderDetailPage = lazy(() => import('@/pages/PurchaseOrderDetailPage').then(m => ({ default: m.PurchaseOrderDetailPage })))
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const SuperAdminLayout = lazy(() => import('@/pages/SuperAdminLayout').then(m => ({ default: m.SuperAdminLayout })))
const SuperAdminDashboard = lazy(() => import('@/pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })))
const SuperAdminOrgs = lazy(() => import('@/pages/SuperAdminOrgs').then(m => ({ default: m.SuperAdminOrgs })))
const SuperAdminUsers = lazy(() => import('@/pages/SuperAdminUsers').then(m => ({ default: m.SuperAdminUsers })))
const SuperAdminLoginHistory = lazy(() => import('@/pages/SuperAdminLoginHistory').then(m => ({ default: m.SuperAdminLoginHistory })))
const SuperAdminSettings = lazy(() => import('@/pages/SuperAdminSettings').then(m => ({ default: m.SuperAdminSettings })))
const AgentsPage = lazy(() => import('@/pages/AgentsPage').then(m => ({ default: m.AgentsPage })))
const PortalPage = lazy(() => import('@/pages/PortalPage').then(m => ({ default: m.PortalPage })))
const AiAssistantPage = lazy(() => import('@/pages/AiAssistantPage').then(m => ({ default: m.AiAssistantPage })))
const RecurringInvoicesPage = lazy(() => import('@/pages/RecurringInvoicesPage').then(m => ({ default: m.RecurringInvoicesPage })))
const EscalationHistoryPage = lazy(() => import('@/pages/EscalationHistoryPage').then(m => ({ default: m.EscalationHistoryPage })))

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })))

function Suspense({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      {children}
    </React.Suspense>
  )
}

import React from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!user?.isAdmin && !user?.isSuperAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (loading) return <>{children}</>
  if (!user?.isSuperAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { token, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <React.Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
            <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Standalone protected route (no sidebar) */}
            <Route path="/org/setup" element={<ProtectedRoute><OrgProfilePage /></ProtectedRoute>} />
            <Route path="/portal" element={<PortalPage />} />

            {/* CRM routes inside sidebar layout */}
            {/* Super Admin routes */}
            <Route element={<ProtectedRoute><SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute></ProtectedRoute>}>
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/organizations" element={<SuperAdminOrgs />} />
              <Route path="/superadmin/users" element={<SuperAdminUsers />} />
              <Route path="/superadmin/agents" element={<AgentsPage />} />
              <Route path="/superadmin/login-history" element={<SuperAdminLoginHistory />} />
              <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
            </Route>

            {/* CRM routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
              <Route path="/admin" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/mailboxes" element={<MailboxesPage />} />
              <Route path="/rssfeeds" element={<RssPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat-admin" element={<ChatAdminPage />} />
              <Route path="/email-campaigns" element={<EmailCampaignsPage />} />
              <Route path="/sms" element={<SmsPage />} />
              <Route path="/landing-pages" element={<LandingPagesPage />} />
              <Route path="/social-media" element={<SocialMediaPage />} />
              <Route path="/webhooks" element={<WebhooksPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/recurringinvoices/new" element={<RecurringInvoicesPage />} />
              <Route path="/recurringinvoices/:id" element={<RecurringInvoicesPage />} />
              <Route path="/escalationhistory/new" element={<EscalationHistoryPage />} />
              <Route path="/trash" element={<RecycleBinPage />} />
              <Route path="/leads/new" element={<ModuleDetailPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/leads/:id/edit" element={<ModuleDetailPage />} />
              <Route path="/quotes" element={<QuotationsPage key="list" />} />
              <Route path="/quotes/:id" element={<QuotationsPage key="detail" />} />
              <Route path="/salesorders" element={<SalesDocumentPage key="so-list" module="salesorders" />} />
              <Route path="/salesorders/:id" element={<SalesDocumentPage key="so-detail" module="salesorders" />} />
              <Route path="/invoices" element={<SalesDocumentPage key="inv-list" module="invoices" />} />
              <Route path="/invoices/:id" element={<SalesDocumentPage key="inv-detail" module="invoices" />} />
              <Route path="/purchaseorders" element={<PurchaseOrderDetailPage key="po-list" />} />
              <Route path="/purchaseorders/new" element={<PurchaseOrderDetailPage key="po-new" />} />
              <Route path="/purchaseorders/:id" element={<PurchaseOrderDetailPage key="po-detail" />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductDetailPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products/:id/edit" element={<ProductDetailPage />} />
              <Route path="/:module" element={<ModuleListPage />} />
              <Route path="/:module/new" element={<ModuleDetailPage />} />
              <Route path="/:module/:id" element={<ModuleDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </ToastProvider>
    </ThemeProvider>
  )
}
