import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { ToastProvider } from '@/lib/toast'
import { ThemeProvider } from '@/lib/theme'
import { LandingPage } from '@/pages/LandingPage'
import { ContactUsPage } from '@/pages/ContactUsPage'
import { PricingPage } from '@/pages/PricingPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsPage } from '@/pages/TermsPage'
import { CookiePolicyPage } from '@/pages/CookiePolicyPage'
import { RefundPolicyPage } from '@/pages/RefundPolicyPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OrgProfilePage } from '@/pages/OrgProfilePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ModuleListPage } from '@/pages/ModuleListPage'
import { ModuleDetailPage } from '@/pages/ModuleDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { LeadDetailPage } from '@/pages/LeadDetailPage'
import { QuotationsPage } from '@/pages/QuotationsPage'
import { SalesDocumentPage } from '@/pages/SalesDocumentPage'
import { SuperAdminLayout } from '@/pages/SuperAdminLayout'
import { SuperAdminDashboard } from '@/pages/SuperAdminDashboard'
import { SuperAdminOrgs } from '@/pages/SuperAdminOrgs'
import { SuperAdminUsers } from '@/pages/SuperAdminUsers'
import { SuperAdminLoginHistory } from '@/pages/SuperAdminLoginHistory'
import { SuperAdminSettings } from '@/pages/SuperAdminSettings'
import { AppLayout } from '@/components/layout/AppLayout'

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

          {/* CRM routes inside sidebar layout */}
          {/* Super Admin routes */}
          <Route element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/organizations" element={<SuperAdminOrgs />} />
            <Route path="/superadmin/users" element={<SuperAdminUsers />} />
            <Route path="/superadmin/login-history" element={<SuperAdminLoginHistory />} />
            <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
          </Route>

          {/* CRM routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/leads/new" element={<ModuleDetailPage />} />
            <Route path="/leads/:id" element={<LeadDetailPage />} />
            <Route path="/leads/:id/edit" element={<ModuleDetailPage />} />
            <Route path="/quotes" element={<QuotationsPage key="list" />} />
            <Route path="/quotes/:id" element={<QuotationsPage key="detail" />} />
            <Route path="/salesorders" element={<SalesDocumentPage key="so-list" module="salesorders" />} />
            <Route path="/salesorders/:id" element={<SalesDocumentPage key="so-detail" module="salesorders" />} />
            <Route path="/invoices" element={<SalesDocumentPage key="inv-list" module="invoices" />} />
            <Route path="/invoices/:id" element={<SalesDocumentPage key="inv-detail" module="invoices" />} />
            <Route path="/:module" element={<ModuleListPage />} />
            <Route path="/:module/new" element={<ModuleDetailPage />} />
            <Route path="/:module/:id" element={<ModuleDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  )
}
