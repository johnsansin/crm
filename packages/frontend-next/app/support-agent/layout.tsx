import { AuthGuard } from '@/components/AuthGuard'
import { SupportAgentLayout } from '@/views/SupportAgentLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="support"><SupportAgentLayout>{children}</SupportAgentLayout></AuthGuard>
}
