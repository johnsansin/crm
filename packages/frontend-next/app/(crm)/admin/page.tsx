import { AuthGuard } from '@/components/AuthGuard'
import { AdminPage } from '@/views/AdminPage'
export default function Page() { return <AuthGuard role="superadmin"><AdminPage /></AuthGuard> }
