import { AuthGuard } from '@/components/AuthGuard'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="crm"><AppLayout>{children}</AppLayout></AuthGuard>
}
