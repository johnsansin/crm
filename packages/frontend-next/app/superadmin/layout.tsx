import { AuthGuard } from '@/components/AuthGuard'
import { SuperAdminLayout } from '@/views/SuperAdminLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="superadmin"><SuperAdminLayout>{children}</SuperAdminLayout></AuthGuard>
}
